package handlers

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/modeptrai/exam-model-backend/internal/config"
	"github.com/modeptrai/exam-model-backend/internal/models"
	"github.com/modeptrai/exam-model-backend/internal/services"
	"github.com/modeptrai/exam-model-backend/internal/utils"
)

// GetMyNotifications returns the latest notifications for the current user
func GetMyNotifications(c *gin.Context) {
	userID, err := utils.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var notifications []models.Notification
	if err := config.DB.Where("user_id = ?", userID).Order("created_at desc").Limit(10).Find(&notifications).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi lấy thông báo"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "data": notifications})
}

// MarkNotificationRead marks a notification as read
func MarkNotificationRead(c *gin.Context) {
	userID, err := utils.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	id := c.Param("id")
	result := config.DB.Model(&models.Notification{}).Where("id = ? AND user_id = ?", id, userID).Update("is_read", true)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi cập nhật thông báo"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "success"})
}

// DeleteAllNotifications deletes all notifications for the current user
func DeleteAllNotifications(c *gin.Context) {
	userID, err := utils.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	if err := config.DB.Where("user_id = ?", userID).Delete(&models.Notification{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete notifications"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "success"})
}

type CheatNotificationRequest struct {
	ExamID string `json:"examId"`
	Level  int    `json:"level"`
}

// CreateCheatNotification creates a cheat warning notification and dispatches to linked Telegram
func CreateCheatNotification(c *gin.Context) {
	var req CheatNotificationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	userUUID, err := utils.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var title, message string
	switch req.Level {
	case 2:
		title = "⚠️ Cảnh báo: Học sinh mất tập trung"
		message = "Hệ thống phát hiện học sinh đang rời khỏi màn hình bài thi. Vui lòng tập trung làm bài!"
	case 3:
		title = "❌ Đã thu bài tự động: Vi phạm quy chế"
		message = "Bài thi đã bị hệ thống tự động thu do học sinh rời khỏi màn hình bài thi quá thời gian hoặc số lần cho phép."
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid level"})
		return
	}

	if req.Level == 3 && req.ExamID != "" {
		if examUUID, err := uuid.Parse(req.ExamID); err == nil {
			config.DB.Model(&models.Submission{}).
				Where("user_id = ? AND exam_id = ? AND status = ?", userUUID, examUUID, models.StatusInProgress).
				Updates(map[string]interface{}{
					"status":      "void",
					"total_score": 0,
				})
		}
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

	var user models.User
	if err := config.DB.First(&user, "id = ?", userUUID).Error; err == nil {
		notifier := services.NewTelegramNotifier()
		tgText := fmt.Sprintf("%s\n%s", title, message)
		go notifier.SendToUser(&user, tgText)
	}

	c.JSON(http.StatusOK, gin.H{"status": "success"})
}
