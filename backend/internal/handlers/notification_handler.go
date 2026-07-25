package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/modeptrai/exam-model-backend/internal/config"
	"github.com/modeptrai/exam-model-backend/internal/models"
)

// GetMyNotifications returns the latest notifications for the current user
func GetMyNotifications(c *gin.Context) {
	// For testing, hardcode user ID or extract from auth
	userID := "00000000-0000-0000-0000-000000000001" // Assuming fixed user 1 for now

	var notifications []models.Notification
	if err := config.DB.Where("user_id = ?", userID).Order("created_at desc").Limit(10).Find(&notifications).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi lấy thông báo"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "data": notifications})
}

// MarkNotificationRead marks a notification as read
func MarkNotificationRead(c *gin.Context) {
	id := c.Param("id")
	config.DB.Model(&models.Notification{}).Where("id = ?", id).Update("is_read", true)
	c.JSON(http.StatusOK, gin.H{"status": "success"})
}

type CheatNotificationRequest struct {
	ExamID string `json:"examId"`
	Level  int    `json:"level"`
}

// CreateCheatNotification creates a Zalo-mock warning notification
func CreateCheatNotification(c *gin.Context) {
	var req CheatNotificationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	userIDStr := "00000000-0000-0000-0000-000000000001" // Assuming fixed user for testing
	userUUID, _ := uuid.Parse(userIDStr)

	var title, message string
	if req.Level == 2 {
		title = "⚠️ Cảnh báo: Học sinh mất tập trung"
		message = "Hệ thống phát hiện con bạn đang rời khỏi màn hình bài thi. Vui lòng nhắc nhở!"
	} else if req.Level == 3 {
		title = "❌ Đã thu bài tự động: Vi phạm quy chế"
		message = "Bài thi đã bị hệ thống tự động thu do học sinh rời khỏi màn hình bài thi quá thời gian hoặc số lần cho phép."
	} else {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid level"})
		return
	}

	notification := models.Notification{
		UserID:  userUUID,
		Title:   title,
		Message: message,
		IsRead:  false,
		Link:    "/student",
	}

	if err := config.DB.Create(&notification).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create notification"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "success"})
}
