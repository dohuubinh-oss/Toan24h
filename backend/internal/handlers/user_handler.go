package handlers

import (
	json "encoding/json/v2"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/modeptrai/exam-model-backend/internal/models"
	"github.com/modeptrai/exam-model-backend/internal/services"
	"github.com/modeptrai/exam-model-backend/internal/utils"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

type UserHandler struct {
	db *gorm.DB
}

func NewUserHandler(db *gorm.DB) *UserHandler {
	return &UserHandler{db: db}
}

// GetUsers trả về danh sách user cho admin dashboard với phân trang an toàn (15 users/trang)
func (h *UserHandler) GetUsers(c *gin.Context) {
	// Lấy params
	q := c.Query("q")
	role := c.Query("role")
	
	// Khởi tạo query
	query := h.db.Model(&models.User{})

	if q != "" {
		query = query.Where("email ILIKE ? OR full_name ILIKE ?", "%"+q+"%", "%"+q+"%")
	}
	if role != "" {
		query = query.Where("role = ?", role)
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi đếm số lượng người dùng"})
		return
	}

	limit := 15 // Mặc định 15 người dùng/trang theo cấu hình an toàn
	if l := c.Query("limit"); l != "" {
		if parsedL, err := strconv.Atoi(l); err == nil && parsedL > 0 {
			if parsedL > 100 {
				limit = 100
			} else {
				limit = parsedL
			}
		}
	} else if c.Query("all") == "true" {
		limit = 500
	}

	page := 1
	if p := c.Query("page"); p != "" {
		if parsedP, err := strconv.Atoi(p); err == nil && parsedP > 0 {
			page = parsedP
		}
	}

	offset := (page - 1) * limit

	var users []models.User
	if err := query.Order("created_at desc").Limit(limit).Offset(offset).Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi lấy danh sách người dùng"})
		return
	}

	// Xử lý status 'expired' (tính toán động)
	now := time.Now()
	for i := range users {
		if users[i].Status == "active" && users[i].ExpiresAt != nil && users[i].ExpiresAt.Before(now) {
			users[i].Status = "expired"
		}
	}

	totalPages := (total + int64(limit) - 1) / int64(limit)
	if totalPages == 0 {
		totalPages = 1
	}

	c.Header("X-Total-Count", strconv.FormatInt(total, 10))
	c.Header("X-Page", strconv.Itoa(page))
	c.Header("X-Limit", strconv.Itoa(limit))
	c.Header("X-Total-Pages", strconv.FormatInt(totalPages, 10))

	if c.Query("format") == "paginated" {
		c.JSON(http.StatusOK, gin.H{
			"users":      users,
			"total":      total,
			"page":       page,
			"limit":      limit,
			"totalPages": totalPages,
		})
		return
	}

	c.JSON(http.StatusOK, users)
}

type UpdateStatusRequest struct {
	Status string `json:"status" binding:"required"`
}

// UpdateUserStatus dùng để đổi trạng thái (vd: Khóa tài khoản)
func (h *UserHandler) UpdateUserStatus(c *gin.Context) {
	id := c.Param("id")
	
	var req UpdateStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	if err := h.db.Where("id = ?", id).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Không tìm thấy người dùng"})
		return
	}

	user.Status = req.Status
	if err := h.db.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi cập nhật trạng thái"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Cập nhật thành công", "user": user})
}

type UpdateRoleRequest struct {
	Role string `json:"role" binding:"required"`
}

// UpdateUserRole cập nhật vai trò người dùng (Chỉ dành cho Admin)
func (h *UserHandler) UpdateUserRole(c *gin.Context) {
	id := c.Param("id")
	var req UpdateRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dữ liệu không hợp lệ: " + err.Error()})
		return
	}

	newRole := strings.ToLower(strings.TrimSpace(req.Role))
	validRoles := map[string]bool{
		"admin":   true,
		"teacher": true,
		"student": true,
	}

	if !validRoles[newRole] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Vai trò không hợp lệ"})
		return
	}

	var user models.User
	if err := h.db.Where("id = ?", id).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Không tìm thấy người dùng"})
		return
	}

	user.Role = newRole
	if err := h.db.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi cập nhật vai trò: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Cập nhật vai trò thành công",
		"user":    user,
	})
}

type RechargeRequest struct {
	Months int `json:"months" binding:"required,min=1"`
}

// RechargeUser thêm thời hạn sử dụng cho người dùng
func (h *UserHandler) RechargeUser(c *gin.Context) {
	id := c.Param("id")

	var req RechargeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	if err := h.db.Where("id = ?", id).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Không tìm thấy người dùng"})
		return
	}

	now := time.Now()
	var newExpiresAt time.Time
	
	if user.ExpiresAt != nil && user.ExpiresAt.After(now) {
		// Cộng thêm vào thời gian còn lại
		newExpiresAt = user.ExpiresAt.AddDate(0, req.Months, 0)
	} else {
		// Tính từ hiện tại
		newExpiresAt = now.AddDate(0, req.Months, 0)
	}

	user.ExpiresAt = &newExpiresAt
	user.Status = "active" // Tự động active lại nếu đang khóa hoặc hết hạn

	if err := h.db.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi cập nhật thời hạn"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":   "Nạp thêm thành công",
		"expiresAt": user.ExpiresAt,
		"status":    user.Status,
	})
}

// GetProfile trả về thông tin cá nhân của user đang đăng nhập
func (h *UserHandler) GetProfile(c *gin.Context) {
	userID, err := utils.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var user models.User
	if err := h.db.Where("id = ?", userID).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Tự động cấp mã referral nếu role là admin hoặc teacher mà chưa có mã
	if services.IsPartnerRole(user.Role) {
		if user.ReferralCode == nil || strings.TrimSpace(*user.ReferralCode) == "" {
			_, _ = services.EnsureUserReferralCode(h.db, &user)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{
			"id":                      user.ID,
			"email":                   user.Email,
			"fullName":                user.FullName,
			"role":                    user.Role,
			"grade":                   user.Grade,
			"points":                  user.Points,
			"status":                  user.Status,
			"telegramId":              user.TelegramID,
			"telegramUsername":        user.TelegramUser,
			"telegramAvt":             user.TelegramAvt,
			"telegramId2":             user.TelegramID2,
			"telegramUsername2":       user.TelegramUser2,
			"telegramAvt2":            user.TelegramAvt2,
			"expiresAt":         user.ExpiresAt,
			"referralCode":      user.ReferralCode,
			"createdAt":         user.CreatedAt,
		},
	})
}

// UploadAvatar xử lý tải ảnh đại diện của người dùng, tự động nén về 400x400 và dọn dẹp ảnh cũ
func (h *UserHandler) UploadAvatar(c *gin.Context) {
	userID, err := utils.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file uploaded"})
		return
	}

	// 1. Kiểm tra định dạng nhị phân và dung lượng qua Magic Bytes
	if err := utils.ValidateImageHeader(file, utils.AvatarImageValidationOptions); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid file format: " + err.Error()})
		return
	}

	// 2. Đọc dữ liệu file ảnh vào bộ nhớ
	srcFile, err := file.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to open uploaded file"})
		return
	}
	fileBytes, err := io.ReadAll(srcFile)
	srcFile.Close()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read uploaded file"})
		return
	}

	// 3. Khử mã độc, xóa bỏ 100% EXIF và nén JPEG 85% về max 400x400
	compBytes, err := utils.SanitizeAndCompressImage(fileBytes, 400)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dữ liệu ảnh đại diện không hợp lệ hoặc chứa mã độc: " + err.Error()})
		return
	}

	// 4. Tạo thư mục nếu chưa tồn tại
	avatarDir := "./uploads/avatars"
	if err := os.MkdirAll(avatarDir, os.ModePerm); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create avatars directory"})
		return
	}

	newFileName := uuid.New().String() + ".jpg"
	dst := filepath.Join(avatarDir, newFileName)
	if err := os.WriteFile(dst, compBytes, 0644); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save avatar file"})
		return
	}

	avatarURL := fmt.Sprintf("/uploads/avatars/%s", newFileName)

	// 5. Cập nhật database và dọn dẹp file avatar cũ trên đĩa cứng
	if h.db != nil {
		var user models.User
		if err := h.db.Where("id = ?", userID).First(&user).Error; err == nil {
			if user.TelegramAvt != nil && strings.HasPrefix(*user.TelegramAvt, "/uploads/avatars/") {
				oldRel := strings.TrimPrefix(*user.TelegramAvt, "/uploads/")
				oldRelClean := filepath.Clean(oldRel)
				if !strings.HasPrefix(oldRelClean, "..") {
					oldFullPath := filepath.Join(".", "uploads", oldRelClean)
					_ = os.Remove(oldFullPath)
				}
			}
			user.TelegramAvt = &avatarURL
			h.db.Save(&user)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Avatar uploaded successfully",
		"data": gin.H{
			"avatarUrl": avatarURL,
		},
	})
}

// DeleteMyAccount xử lý yêu cầu xóa tài khoản vĩnh viễn (Hard delete) theo Luật BVQLNTD 2023 & Nghị định 13/2023/NĐ-CP
// Quét sạch họ tên, email, và đặc biệt là toàn bộ lịch sử hình ảnh bài tự luận mà người dùng đã tải lên.
func (h *UserHandler) DeleteMyAccount(c *gin.Context) {
	userID, err := utils.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	if h.db == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database connection not available"})
		return
	}

	// 1. Quét sạch tất cả các file ảnh bài tự luận (diagrams / uploads) do học sinh này tải lên
	var submissions []models.Submission
	if err := h.db.Where("user_id = ?", userID).Find(&submissions).Error; err == nil {
		for _, sub := range submissions {
			var answers map[string]models.QuestionAnswer
			if len(sub.AnswersJSON) > 0 && json.Unmarshal(sub.AnswersJSON, &answers) == nil {
				for _, ans := range answers {
					if ans.StudentDiagramURL != "" {
						deletePhysicalUploadFile(ans.StudentDiagramURL)
					}
					for _, imgURL := range ans.ImageURLs {
						deletePhysicalUploadFile(imgURL)
					}
				}
			}
		}
	}

	// 2. Quét sạch file ảnh đại diện (avatar) nếu có
	var user models.User
	if err := h.db.Where("id = ?", userID).First(&user).Error; err == nil {
		if user.TelegramAvt != nil && *user.TelegramAvt != "" {
			deletePhysicalUploadFile(*user.TelegramAvt)
		}
		if user.TelegramAvt2 != nil && *user.TelegramAvt2 != "" {
			deletePhysicalUploadFile(*user.TelegramAvt2)
		}
	}

	// 3. Ẩn danh hóa các bản ghi điểm số để phục vụ thống kê chung (giữ lại điểm, gỡ bỏ thông tin định danh và bài làm)
	h.db.Model(&models.Submission{}).
		Where("user_id = ?", userID).
		Updates(map[string]interface{}{
			"user_id":                        nil,
			"answers_json":                   datatypes.JSON([]byte("{}")),
			"overall_essay_feedback":         "",
			"overall_comprehension_feedback": "",
		})

	// 4. Gỡ bỏ liên kết người giới thiệu để tránh orphan references
	h.db.Model(&models.Voucher{}).Where("affiliate_id = ?", userID).Update("affiliate_id", nil)
	h.db.Model(&models.User{}).Where("referrer_id = ?", userID).Update("referrer_id", nil)

	// 5. Thực hiện Hard Delete (xóa vật lý hoàn toàn khỏi CSDL) các dữ liệu liên quan
	h.db.Unscoped().Where("user_id = ?", userID).Delete(&models.LectureBookmark{})
	h.db.Unscoped().Where("user_id = ?", userID).Delete(&models.Notification{})
	h.db.Unscoped().Where("user_id = ?", userID).Delete(&models.XPTransaction{})
	h.db.Unscoped().Where("user_id = ?", userID).Delete(&models.VoucherUsage{})
	h.db.Unscoped().Where("user_id = ?", userID).Delete(&models.Transaction{})

	// 6. Xóa vật lý bản ghi người dùng (quét sạch họ tên, email, mật khẩu, tài khoản)
	if err := h.db.Unscoped().Where("id = ?", userID).Delete(&models.User{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể xóa tài khoản: " + err.Error()})
		return
	}

	// 7. Xóa cookie phiên làm việc
	c.SetCookie("accessToken", "", -1, "/", "", false, true)
	c.SetCookie("refreshToken", "", -1, "/", "", false, true)
	c.SetCookie("userRole", "", -1, "/", "", false, false)
	c.SetCookie("userGrade", "", -1, "/", "", false, false)

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Tài khoản và toàn bộ dữ liệu định danh của bạn đã được xóa vĩnh viễn khỏi hệ thống.",
	})
}

// deletePhysicalUploadFile kiểm tra an toàn đường dẫn và xóa file vật lý trên đĩa cứng
func deletePhysicalUploadFile(rawURL string) {
	clean := strings.TrimPrefix(rawURL, "/")
	cleanPath := filepath.Clean(clean)
	// Ngăn chặn Path Traversal
	if strings.HasPrefix(cleanPath, "..") {
		return
	}
	if strings.HasPrefix(cleanPath, "uploads/") {
		filePath := filepath.Join(".", cleanPath)
		_ = os.Remove(filePath)
	}
}


