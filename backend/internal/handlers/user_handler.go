package handlers

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/modeptrai/exam-model-backend/internal/models"
	"github.com/modeptrai/exam-model-backend/internal/utils"
	"gorm.io/gorm"
)

type UserHandler struct {
	db *gorm.DB
}

func NewUserHandler(db *gorm.DB) *UserHandler {
	return &UserHandler{db: db}
}

// GetUsers trả về danh sách user cho admin dashboard
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

	var users []models.User
	if err := query.Order("created_at desc").Find(&users).Error; err != nil {
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
	adminRole := c.GetString("userRole")
	if adminRole != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Chỉ có Admin mới có quyền thay đổi vai trò người dùng"})
		return
	}

	id := c.Param("id")
	var req UpdateRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dữ liệu không hợp lệ: " + err.Error()})
		return
	}

	newRole := strings.ToLower(strings.TrimSpace(req.Role))
	validRoles := map[string]bool{
		"admin":     true,
		"teacher":   true,
		"affiliate": true,
		"student":   true,
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

	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{
			"id":                user.ID,
			"email":             user.Email,
			"fullName":          user.FullName,
			"role":              user.Role,
			"grade":             user.Grade,
			"points":            user.Points,
			"status":            user.Status,
			"telegramId":        user.TelegramID,
			"telegramUsername":  user.TelegramUser,
			"telegramAvt":       user.TelegramAvt,
			"telegramId2":       user.TelegramID2,
			"telegramUsername2": user.TelegramUser2,
			"telegramAvt2":      user.TelegramAvt2,
			"expiresAt":         user.ExpiresAt,
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

	// 3. Tự động resize ảnh về max 400x400 và nén JPEG 85% để tối ưu kích thước, đồng thời xóa bỏ EXIF nhạy cảm
	compBytes, _, err := utils.CompressAndResizeImage(fileBytes, 400)
	if err != nil {
		compBytes = fileBytes
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

