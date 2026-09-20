package handlers

import (
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/modeptrai/exam-model-backend/internal/models"
	"github.com/modeptrai/exam-model-backend/internal/services"
	"github.com/modeptrai/exam-model-backend/internal/utils"
	"gorm.io/gorm"
)

func formatExpiresAt(t *time.Time) string {
	if t == nil {
		return ""
	}
	return t.Format(time.RFC3339)
}

func setAuthCookies(c *gin.Context, accessToken, refreshToken, role, grade, expiresAt string) {
	domain := ""
	secure := false
	host := c.Request.Host
	origin := c.GetHeader("Origin")

	if strings.Contains(host, "toan6789.vn") || strings.Contains(origin, "toan6789.vn") {
		domain = ".toan6789.vn"
		secure = true
	} else if os.Getenv("GIN_MODE") == "release" && !strings.Contains(host, "localhost") && !strings.Contains(host, "127.0.0.1") {
		secure = true
	}

	c.SetCookie("accessToken", accessToken, 24*60*60, "/", domain, secure, true)
	if refreshToken != "" {
		c.SetCookie("refreshToken", refreshToken, 7*24*60*60, "/", domain, secure, true)
	}
	c.SetCookie("userRole", role, 24*60*60, "/", domain, secure, false)
	c.SetCookie("userGrade", grade, 24*60*60, "/", domain, secure, false)
	c.SetCookie("userExpiresAt", expiresAt, 24*60*60, "/", domain, secure, false)
}

func clearAuthCookies(c *gin.Context) {
	domain := ""
	secure := false
	host := c.Request.Host
	origin := c.GetHeader("Origin")

	if strings.Contains(host, "toan6789.vn") || strings.Contains(origin, "toan6789.vn") {
		domain = ".toan6789.vn"
		secure = true
	} else if os.Getenv("GIN_MODE") == "release" && !strings.Contains(host, "localhost") && !strings.Contains(host, "127.0.0.1") {
		secure = true
	}

	c.SetCookie("accessToken", "", -1, "/", domain, secure, true)
	c.SetCookie("refreshToken", "", -1, "/", domain, secure, true)
	c.SetCookie("userRole", "", -1, "/", domain, secure, false)
	c.SetCookie("userGrade", "", -1, "/", domain, secure, false)
	c.SetCookie("userExpiresAt", "", -1, "/", domain, secure, false)

	if domain != "" {
		c.SetCookie("accessToken", "", -1, "/", "", false, true)
		c.SetCookie("refreshToken", "", -1, "/", "", false, true)
		c.SetCookie("userRole", "", -1, "/", "", false, false)
		c.SetCookie("userGrade", "", -1, "/", "", false, false)
		c.SetCookie("userExpiresAt", "", -1, "/", "", false, false)
	}
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
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required,min=6"`
	FullName string `json:"fullName" binding:"required"`
	Role     string `json:"role"`
	Grade    string `json:"grade"`
}

func (h *AuthHandler) Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if user already exists
	var existingUser models.User
	if err := h.db.Where("email = ?", req.Email).First(&existingUser).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Email already in use"})
		return
	}

	hashedPassword, err := utils.HashPassword(req.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	// Always default public registration to student role to prevent privilege escalation
	role := "student"

	user := models.User{
		Email:        req.Email,
		PasswordHash: hashedPassword,
		FullName:     req.FullName,
		Role:         role,
		Grade:        req.Grade,
	}

	if err := h.db.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "User registered successfully", "id": user.ID})
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

	var user models.User
	if err := h.db.Where("email = ?", req.Email).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
		return
	}

	if user.Status == "locked" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Account is locked"})
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

	claims, err := utils.ValidateToken(refreshToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired refresh token"})
		return
	}

	var user models.User
	if err := h.db.Where("id = ?", claims.UserID).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
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
	userIDStr, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req UpdateGradeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	if err := h.db.Where("id = ?", userIDStr).First(&user).Error; err != nil {
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
	userIDStr, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req DeductPointsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	if err := h.db.Where("id = ?", userIDStr).First(&user).Error; err != nil {
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

	c.JSON(http.StatusOK, gin.H{
		"message": "Mã OTP đã được gửi đến email của bạn",
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

	c.JSON(http.StatusOK, gin.H{
		"message": "Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại!",
	})
}

type ChangePasswordRequest struct {
	CurrentPassword string `json:"currentPassword"`
	NewPassword     string `json:"newPassword" binding:"required,min=6"`
}

func (h *AuthHandler) ChangePassword(c *gin.Context) {
	userIDStr, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Mật khẩu mới phải có ít nhất 6 ký tự"})
		return
	}

	var user models.User
	if err := h.db.Where("id = ?", userIDStr).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Không tìm thấy người dùng"})
		return
	}

	// If current password was provided, verify it
	if req.CurrentPassword != "" && user.PasswordHash != "" {
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

