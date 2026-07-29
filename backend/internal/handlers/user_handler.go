package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/modeptrai/exam-model-backend/internal/models"
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
	userIDStr, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var user models.User
	if err := h.db.Where("id = ?", userIDStr).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{
			"id":               user.ID,
			"email":            user.Email,
			"fullName":         user.FullName,
			"role":             user.Role,
			"grade":            user.Grade,
			"points":           user.Points,
			"status":           user.Status,
			"telegramId":       user.TelegramID,
			"telegramUsername": user.TelegramUser,
			"telegramAvt":      user.TelegramAvt,
		},
	})
}
