package handlers

import (
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/modeptrai/exam-model-backend/internal/config"
	"github.com/modeptrai/exam-model-backend/internal/models"
	"github.com/modeptrai/exam-model-backend/internal/services"
	"github.com/modeptrai/exam-model-backend/internal/utils"
	"gorm.io/gorm"
)

func formatExpiresAt(t *time.Time) string {
	return utils.FormatExpiresAt(t)
}

func setAuthCookies(c *gin.Context, accessToken, refreshToken, role, grade, expiresAt string) {
	utils.SetAuthCookies(c, accessToken, refreshToken, role, grade, expiresAt)
}

func clearAuthCookies(c *gin.Context) {
	utils.ClearAuthCookies(c)
}

type AuthHandler struct {
	db          *gorm.DB
	emailService *services.EmailService
	otpService   *services.OTPService
}

func NewAuthHandler(db *gorm.DB) *AuthHandler {
	return &AuthHandler{
		db:           db,
		emailService: services.NewEmailService(),
		otpService:   services.NewOTPService(),
	}
}

type RegisterRequest struct {
	Email       string `json:"email" binding:"required,email"`
	Password    string `json:"password" binding:"required,min=6"`
	FullName    string `json:"fullName" binding:"required"`
	Role        string `json:"role"`
	Grade       string `json:"grade"`
	VoucherCode string `json:"voucherCode"`
}

func (h *AuthHandler) Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	req.Email = strings.ToLower(strings.TrimSpace(req.Email))

	// Check if user already exists
	var existingUser models.User
	if err := h.db.Where("email = ?", req.Email).First(&existingUser).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Email already in use"})
		return
	}

	// Validate voucher if provided
	var voucher *models.Voucher
	voucherCode := strings.ToUpper(strings.TrimSpace(req.VoucherCode))
	if voucherCode != "" {
		var v models.Voucher
		if err := h.db.Where("UPPER(code) = ?", voucherCode).First(&v).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Mã khuyến mãi không tồn tại"})
			return
		}
		if !v.IsValid() {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Mã khuyến mãi đã hết hạn hoặc hết lượt sử dụng"})
			return
		}
		voucher = &v
	}

	hashedPassword, err := utils.HashPassword(req.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	// Always default public registration to student role to prevent privilege escalation
	role := "student"

	var userExpiresAt *time.Time
	var referrerID *uuid.UUID
	isSelfReferral := false

	if voucher != nil {
		if voucher.AffiliateID != nil {
			var affiliate models.User
			if err := h.db.Select("id, email").First(&affiliate, "id = ?", *voucher.AffiliateID).Error; err == nil {
				if strings.EqualFold(affiliate.Email, req.Email) {
					isSelfReferral = true
				}
			}
		}

		if !isSelfReferral {
			if voucher.FreeMonths > 0 {
				exp := time.Now().AddDate(0, voucher.FreeMonths, 0)
				userExpiresAt = &exp
			}
			if voucher.AffiliateID != nil {
				referrerID = voucher.AffiliateID
			}
		}
	}

	verificationToken := uuid.New().String()
	verificationExpires := time.Now().Add(24 * time.Hour)

	user := models.User{
		Email:                      req.Email,
		PasswordHash:               hashedPassword,
		FullName:                   req.FullName,
		Role:                       role,
		Grade:                      req.Grade,
		ExpiresAt:                  userExpiresAt,
		ReferrerID:                 referrerID,
		IsVerified:                 false, // Bắt buộc kích hoạt qua email mới dùng được
		VerificationToken:          &verificationToken,
		VerificationTokenExpiresAt: &verificationExpires,
	}

	err = h.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&user).Error; err != nil {
			return err
		}

		if voucher != nil && !isSelfReferral {
			if err := tx.Model(&models.Voucher{}).Where("id = ?", voucher.ID).Update("used_count", gorm.Expr("used_count + 1")).Error; err != nil {
				return err
			}

			usage := models.VoucherUsage{
				VoucherID:   voucher.ID,
				UserID:      user.ID,
				AffiliateID: voucher.AffiliateID,
			}
			if err := tx.Create(&usage).Error; err != nil {
				return err
			}
		}

		if services.IsPartnerRole(user.Role) {
			_, _ = services.EnsureUserReferralCode(tx, &user)
		}

		return nil
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to register user: " + err.Error()})
		return
	}

	// Gửi email kích hoạt tài khoản
	frontendURL := "http://localhost:3000"
	if config.Env != nil && config.Env.FrontendURL != "" {
		frontendURL = strings.TrimRight(config.Env.FrontendURL, "/")
	}
	verifyLink := fmt.Sprintf("%s/verify-email?token=%s", frontendURL, verificationToken)
	_ = h.emailService.SendVerificationEmail(user.Email, user.FullName, verifyLink)

	resp := gin.H{
		"message":                  "User registered successfully",
		"id":                       user.ID,
		"requireEmailVerification": true,
	}
	if voucher != nil && !isSelfReferral && voucher.FreeMonths > 0 {
		resp["freeMonths"] = voucher.FreeMonths
	}

	c.JSON(http.StatusCreated, resp)
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required"`
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	req.Email = strings.ToLower(strings.TrimSpace(req.Email))

	var user models.User
	if err := h.db.Where("email = ?", req.Email).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
		return
	}

	if user.Status == "locked" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Account is locked"})
		return
	}

	if !user.IsVerified {
		c.JSON(http.StatusForbidden, gin.H{
			"error":        "Tài khoản chưa được kích hoạt qua email. Vui lòng kiểm tra email để kích hoạt tài khoản.",
			"isUnverified": true,
			"email":        user.Email,
		})
		return
	}

	if err := utils.CheckPasswordHash(req.Password, user.PasswordHash); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
		return
	}

	accessToken, err := utils.GenerateAccessToken(user.ID, user.Role, user.Grade)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate access token"})
		return
	}

	refreshToken, err := utils.GenerateRefreshToken(user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate refresh token"})
		return
	}

	// Set cookies
	setAuthCookies(c, accessToken, refreshToken, user.Role, user.Grade, formatExpiresAt(user.ExpiresAt))

	c.JSON(http.StatusOK, gin.H{
		"message":      "Login successful",
		"accessToken":  accessToken,
		"refreshToken": refreshToken,
		"user": gin.H{
			"id":        user.ID,
			"email":     user.Email,
			"fullName":  user.FullName,
			"role":      user.Role,
			"grade":     user.Grade,
			"points":    user.Points,
			"status":    user.Status,
			"expiresAt": user.ExpiresAt,
		},
	})
}

func (h *AuthHandler) Refresh(c *gin.Context) {
	refreshToken, err := c.Cookie("refreshToken")
	if err != nil || refreshToken == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Missing refresh token"})
		return
	}

	claims, err := utils.ValidateRefreshToken(refreshToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired refresh token"})
		return
	}

	var user models.User
	if err := h.db.Where("id = ?", claims.UserID).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	if user.Status == "locked" {
		clearAuthCookies(c)
		c.JSON(http.StatusForbidden, gin.H{"error": "Account is locked"})
		return
	}

	accessToken, err := utils.GenerateAccessToken(user.ID, user.Role, user.Grade)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate new access token"})
		return
	}

	setAuthCookies(c, accessToken, "", user.Role, user.Grade, formatExpiresAt(user.ExpiresAt))

	c.JSON(http.StatusOK, gin.H{
		"message": "Token refreshed successfully",
	})
}

type UpdateGradeRequest struct {
	Grade string `json:"grade" binding:"required"`
}

func (h *AuthHandler) UpdateGrade(c *gin.Context) {
	userID, err := utils.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req UpdateGradeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	if err := h.db.Where("id = ?", userID).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	user.Grade = req.Grade
	if err := h.db.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update grade"})
		return
	}

	// Generate new tokens
	accessToken, err := utils.GenerateAccessToken(user.ID, user.Role, user.Grade)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate access token"})
		return
	}
	
	refreshToken, err := utils.GenerateRefreshToken(user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate refresh token"})
		return
	}

	setAuthCookies(c, accessToken, refreshToken, user.Role, user.Grade, formatExpiresAt(user.ExpiresAt))

	c.JSON(http.StatusOK, gin.H{
		"message":      "Grade updated successfully",
		"grade":        user.Grade,
		"accessToken":  accessToken,
		"refreshToken": refreshToken,
		"user": gin.H{
			"id":        user.ID,
			"email":     user.Email,
			"fullName":  user.FullName,
			"role":      user.Role,
			"grade":     user.Grade,
			"points":    user.Points,
			"status":    user.Status,
			"expiresAt": user.ExpiresAt,
		},
	})
}

type DeductPointsRequest struct {
	Amount int `json:"amount" binding:"required,min=1"`
}

func (h *AuthHandler) DeductPoints(c *gin.Context) {
	userID, err := utils.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req DeductPointsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	if err := h.db.Where("id = ?", userID).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	if user.Points < req.Amount {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Không đủ điểm"})
		return
	}

	user.Points -= req.Amount
	if err := h.db.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to deduct points"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Points deducted successfully",
		"points":  user.Points,
	})
}

func (h *AuthHandler) Logout(c *gin.Context) {
	clearAuthCookies(c)
	c.JSON(http.StatusOK, gin.H{"message": "Logged out successfully"})
}

type ForgotPasswordRequest struct {
	Email string `json:"email" binding:"required,email"`
}

func (h *AuthHandler) ForgotPassword(c *gin.Context) {
	var req ForgotPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Email không hợp lệ"})
		return
	}

	req.Email = strings.ToLower(strings.TrimSpace(req.Email))

	// Check if user exists
	var user models.User
	if err := h.db.Where("email = ?", req.Email).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Email này chưa được đăng ký trong hệ thống"})
		return
	}

	otp := h.otpService.GenerateOTP()
	if err := h.otpService.SaveOTP(req.Email, otp); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể lưu mã OTP"})
		return
	}

	if err := h.emailService.SendOTPEmail(req.Email, otp); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	notifier := services.NewTelegramNotifier()
	msg := fmt.Sprintf("🔐 <b>Mã OTP khôi phục mật khẩu:</b> <code>%s</code>\n\nMã có hiệu lực trong 10 phút. Nếu bạn không yêu cầu mã này, hãy bỏ qua tin nhắn.", otp)
	_ = notifier.SendToUser(&user, msg)

	msgText := "Mã OTP đã được gửi đến email của bạn"
	if user.TelegramID != nil || user.TelegramID2 != nil {
		msgText = "Mã OTP đã được gửi đến email và tài khoản Telegram bot của bạn"
	}

	c.JSON(http.StatusOK, gin.H{
		"message": msgText,
	})
}

type VerifyOTPRequest struct {
	Email string `json:"email" binding:"required,email"`
	OTP   string `json:"otp" binding:"required,len=6"`
}

func (h *AuthHandler) VerifyOTP(c *gin.Context) {
	var req VerifyOTPRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Thông tin nhập không hợp lệ"})
		return
	}

	req.Email = strings.ToLower(strings.TrimSpace(req.Email))

	if !h.otpService.VerifyOTP(req.Email, req.OTP) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Mã OTP không đúng hoặc đã hết hạn"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Xác thực mã OTP thành công",
	})
}

type ResetPasswordRequest struct {
	Email       string `json:"email" binding:"required,email"`
	OTP         string `json:"otp" binding:"required,len=6"`
	NewPassword string `json:"newPassword" binding:"required,min=6"`
}

func (h *AuthHandler) ResetPassword(c *gin.Context) {
	var req ResetPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Thông tin mật khẩu mới không hợp lệ"})
		return
	}

	req.Email = strings.ToLower(strings.TrimSpace(req.Email))

	if !h.otpService.VerifyOTP(req.Email, req.OTP) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Mã OTP không đúng hoặc đã hết hạn"})
		return
	}

	var user models.User
	if err := h.db.Where("email = ?", req.Email).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Không tìm thấy người dùng"})
		return
	}

	hashedPassword, err := utils.HashPassword(req.NewPassword)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể mã hóa mật khẩu mới"})
		return
	}

	user.PasswordHash = hashedPassword
	if err := h.db.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể cập nhật mật khẩu mới"})
		return
	}

	h.otpService.DeleteOTP(req.Email)

	notifier := services.NewTelegramNotifier()
	resetMsg := "⚠️ <b>Thông báo bảo mật:</b> Mật khẩu tài khoản Toán 6789 của bạn vừa được thay đổi thành công. Nếu không phải bạn thực hiện, vui lòng liên hệ quản trị viên ngay."
	_ = notifier.SendToUser(&user, resetMsg)

	c.JSON(http.StatusOK, gin.H{
		"message": "Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại!",
	})
}

type ChangePasswordRequest struct {
	CurrentPassword string `json:"currentPassword"`
	NewPassword     string `json:"newPassword" binding:"required,min=6"`
}

func (h *AuthHandler) ChangePassword(c *gin.Context) {
	userID, err := utils.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Mật khẩu mới phải có ít nhất 6 ký tự"})
		return
	}

	var user models.User
	if err := h.db.Where("id = ?", userID).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Không tìm thấy người dùng"})
		return
	}

	// If user already has a password, current password is required and must match
	if user.PasswordHash != "" {
		if req.CurrentPassword == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Vui lòng nhập mật khẩu hiện tại"})
			return
		}
		if err := utils.CheckPasswordHash(req.CurrentPassword, user.PasswordHash); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Mật khẩu hiện tại không chính xác"})
			return
		}
	}

	hashedPassword, err := utils.HashPassword(req.NewPassword)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể mã hóa mật khẩu"})
		return
	}

	if err := h.db.Model(&user).Update("password_hash", hashedPassword).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể cập nhật mật khẩu"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Đổi mật khẩu thành công"})
}

type VerifyEmailRequest struct {
	Token string `json:"token"`
}

// VerifyEmail xử lý kích hoạt tài khoản qua liên kết email
func (h *AuthHandler) VerifyEmail(c *gin.Context) {
	var req VerifyEmailRequest
	_ = c.ShouldBindJSON(&req)

	token := strings.TrimSpace(req.Token)
	if token == "" {
		token = strings.TrimSpace(c.Query("token"))
	}

	if token == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Mã kích hoạt không hợp lệ"})
		return
	}

	var user models.User
	if err := h.db.Where("verification_token = ?", token).First(&user).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Mã kích hoạt không tồn tại hoặc tài khoản đã được kích hoạt trước đó."})
		return
	}

	if user.VerificationTokenExpiresAt != nil && time.Now().After(*user.VerificationTokenExpiresAt) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Mã kích hoạt đã hết hạn. Vui lòng yêu cầu gửi lại email kích hoạt."})
		return
	}

	// Đánh dấu tài khoản đã kích hoạt
	if err := h.db.Model(&user).Updates(map[string]interface{}{
		"is_verified":                   true,
		"verification_token":            nil,
		"verification_token_expires_at": nil,
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể kích hoạt tài khoản: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Kích hoạt tài khoản thành công! Bây giờ bạn có thể đăng nhập.",
		"email":   user.Email,
	})
}

type ResendVerificationRequest struct {
	Email string `json:"email" binding:"required,email"`
}

// ResendVerificationEmail xử lý gửi lại liên kết kích hoạt tài khoản
func (h *AuthHandler) ResendVerificationEmail(c *gin.Context) {
	var req ResendVerificationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Email không hợp lệ"})
		return
	}

	email := strings.ToLower(strings.TrimSpace(req.Email))

	var user models.User
	if err := h.db.Where("email = ?", email).First(&user).Error; err != nil {
		c.JSON(http.StatusOK, gin.H{"message": "Nếu email tồn tại, liên kết kích hoạt mới đã được gửi."})
		return
	}

	if user.IsVerified {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Tài khoản này đã được kích hoạt trước đó. Bạn có thể đăng nhập ngay."})
		return
	}

	newToken := uuid.New().String()
	newExpires := time.Now().Add(24 * time.Hour)

	if err := h.db.Model(&user).Updates(map[string]interface{}{
		"verification_token":            newToken,
		"verification_token_expires_at": newExpires,
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi khi tạo liên kết kích hoạt"})
		return
	}

	frontendURL := "http://localhost:3000"
	if config.Env != nil && config.Env.FrontendURL != "" {
		frontendURL = strings.TrimRight(config.Env.FrontendURL, "/")
	}
	verifyLink := fmt.Sprintf("%s/verify-email?token=%s", frontendURL, newToken)
	_ = h.emailService.SendVerificationEmail(user.Email, user.FullName, verifyLink)

	c.JSON(http.StatusOK, gin.H{"message": "Đã gửi liên kết kích hoạt mới đến email của bạn. Vui lòng kiểm tra hộp thư."})
}

