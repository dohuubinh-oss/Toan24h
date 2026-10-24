package handlers

import (
	"fmt"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/modeptrai/exam-model-backend/internal/models"
	"github.com/modeptrai/exam-model-backend/internal/services"
	"github.com/modeptrai/exam-model-backend/internal/utils"
)

type LinkTelegramRequest struct {
	ID               interface{} `json:"id"`
	TelegramID       interface{} `json:"telegramId"`
	Username         string      `json:"username"`
	TelegramUsername string      `json:"telegramUsername"`
	PhotoURL         string      `json:"photo_url"`
	TelegramAvt      string      `json:"telegramAvt"`
	FirstName        string      `json:"first_name"`
	LastName         string      `json:"last_name"`
	AuthDate         int64       `json:"auth_date"`
	Hash             string      `json:"hash"`
	Slot             interface{} `json:"slot"`
}

func parseTelegramID(v interface{}) int64 {
	switch val := v.(type) {
	case float64:
		return int64(val)
	case int64:
		return val
	case int:
		return int64(val)
	case string:
		var n int64
		fmt.Sscanf(val, "%d", &n)
		return n
	default:
		return 0
	}
}

// LinkTelegram links a Telegram account to an existing user (Slot 1 or Slot 2)
func (h *AuthHandler) LinkTelegram(c *gin.Context) {
	currentUID, err := utils.GetUserIDString(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req LinkTelegramRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload: " + err.Error()})
		return
	}

	tgID := parseTelegramID(req.ID)
	if tgID == 0 {
		tgID = parseTelegramID(req.TelegramID)
	}

	tgUser := req.Username
	if tgUser == "" {
		tgUser = req.TelegramUsername
	}

	tgAvt := req.PhotoURL
	if tgAvt == "" {
		tgAvt = req.TelegramAvt
	}

	slot := int(parseTelegramID(req.Slot))
	if slot != 2 {
		slot = 1
	}

	if tgID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing telegram ID"})
		return
	}

	// Verify Telegram signature
	if req.Hash == "" {
		if os.Getenv("GIN_MODE") == "release" || os.Getenv("TELEGRAM_BOT_TOKEN") != "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Chữ ký xác thực Telegram là bắt buộc"})
			return
		}
	} else {
		dataMap := map[string]string{
			"id":         fmt.Sprintf("%d", tgID),
			"first_name": req.FirstName,
			"auth_date":  fmt.Sprintf("%d", req.AuthDate),
			"hash":       req.Hash,
		}
		if req.LastName != "" {
			dataMap["last_name"] = req.LastName
		}
		if tgUser != "" {
			dataMap["username"] = tgUser
		}
		if tgAvt != "" {
			dataMap["photo_url"] = tgAvt
		}

		if !utils.VerifyTelegramAuth(dataMap) {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid Telegram authentication data"})
			return
		}
	}


	// Check if Telegram ID is already linked to another user across either slot 1 or slot 2
	var existing models.User
	if err := h.db.Unscoped().Where("(telegram_id = ? OR telegram_id2 = ?) AND id != ?", tgID, tgID, currentUID).First(&existing).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Tài khoản Telegram này đã được liên kết với một người dùng khác"})
		return
	}

	// Update current user for the selected slot
	updates := map[string]interface{}{}
	if slot == 2 {
		updates["telegram_id2"] = tgID
		if tgUser != "" {
			updates["telegram_user2"] = tgUser
		}
		if tgAvt != "" {
			updates["telegram_avt2"] = tgAvt
		}
	} else {
		updates["telegram_id"] = tgID
		if tgUser != "" {
			updates["telegram_user"] = tgUser
		}
		if tgAvt != "" {
			updates["telegram_avt"] = tgAvt
		}
	}

	if err := h.db.Model(&models.User{}).Where("id = ?", currentUID).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to link Telegram account: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":          "Telegram account linked successfully",
		"slot":             slot,
		"telegramId":       tgID,
		"telegramUsername": tgUser,
		"telegramAvt":      tgAvt,
	})
}

type UnlinkTelegramRequest struct {
	Slot int `json:"slot"`
}

// UnlinkTelegram removes a linked Telegram account from slot 1 or slot 2
func (h *AuthHandler) UnlinkTelegram(c *gin.Context) {
	currentUID, err := utils.GetUserIDString(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req UnlinkTelegramRequest
	_ = c.ShouldBindJSON(&req)
	if req.Slot != 2 {
		req.Slot = 1
	}

	updates := map[string]interface{}{}
	if req.Slot == 2 {
		updates["telegram_id2"] = nil
		updates["telegram_user2"] = nil
		updates["telegram_avt2"] = nil
	} else {
		updates["telegram_id"] = nil
		updates["telegram_user"] = nil
		updates["telegram_avt"] = nil
	}

	if err := h.db.Model(&models.User{}).Where("id = ?", currentUID).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi hủy liên kết Telegram: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Hủy liên kết Telegram thành công",
		"slot":    req.Slot,
	})
}

// CreateTelegramQRSession creates a temporary session ID for mobile Telegram QR / Deep link linking
func (h *AuthHandler) CreateTelegramQRSession(c *gin.Context) {
	var body struct {
		SessionID  string `json:"sessionId"`
		LinkUserID string `json:"linkUserId"`
		LinkSlot   string `json:"linkSlot"`
	}
	_ = c.ShouldBindJSON(&body)

	// If linkUserId is missing from body, try to extract from authenticated context
	if body.LinkUserID == "" {
		if uid, err := utils.GetUserIDString(c); err == nil {
			body.LinkUserID = uid
		}
	}

	if body.LinkUserID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Đăng nhập bằng Telegram không còn được hỗ trợ. Telegram chỉ dùng để nhận thông báo từ trang cá nhân.",
		})
		return
	}

	botUsername := os.Getenv("TELEGRAM_BOT_USERNAME")
	if botUsername == "" {
		botUsername = "toan6789_bot"
	}

	var sessionID, deepLink string
	if body.SessionID != "" {
		sessionID = body.SessionID
		services.RegisterTelegramQRSessionWithLink(sessionID, body.LinkUserID, body.LinkSlot)
		deepLink = fmt.Sprintf("https://t.me/%s?start=login_%s", botUsername, sessionID)
	} else {
		sessionID, deepLink = services.CreateTelegramQRSessionWithLink(body.LinkUserID, body.LinkSlot)
	}

	c.JSON(http.StatusOK, gin.H{
		"sessionId":   sessionID,
		"botUsername": botUsername,
		"deepLink":    deepLink,
	})
}

// CheckTelegramQRStatus checks if the mobile Telegram linking session has completed
func (h *AuthHandler) CheckTelegramQRStatus(c *gin.Context) {
	sessionID := c.Param("sessionId")
	if sessionID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing sessionId"})
		return
	}

	data, ok := services.GetTelegramQRSession(sessionID)
	if !ok {
		c.JSON(http.StatusOK, gin.H{"status": "waiting"})
		return
	}

	if data.Status == "completed" && data.User != nil {
		// Delete session after single use
		services.DeleteTelegramQRSession(sessionID)

		var tgID int64
		if data.LinkSlot == "2" && data.User.TelegramID2 != nil {
			tgID = *data.User.TelegramID2
		} else if data.User.TelegramID != nil {
			tgID = *data.User.TelegramID
		} else {
			tgID = data.TelegramID
		}

		var tgUser string
		if data.LinkSlot == "2" && data.User.TelegramUser2 != nil {
			tgUser = *data.User.TelegramUser2
		} else if data.User.TelegramUser != nil {
			tgUser = *data.User.TelegramUser
		} else {
			tgUser = data.TelegramUser
		}

		var tgAvt string
		if data.LinkSlot == "2" && data.User.TelegramAvt2 != nil {
			tgAvt = *data.User.TelegramAvt2
		} else if data.User.TelegramAvt != nil {
			tgAvt = *data.User.TelegramAvt
		}

		c.JSON(http.StatusOK, gin.H{
			"status":           "completed",
			"slot":             data.LinkSlot,
			"telegramId":       tgID,
			"telegramUsername": tgUser,
			"telegramAvt":      tgAvt,
			"message":          "Liên kết Telegram nhận thông báo thành công!",
			"user": gin.H{
				"id":                data.User.ID,
				"telegramId":        data.User.TelegramID,
				"telegramUsername":  data.User.TelegramUser,
				"telegramId2":       data.User.TelegramID2,
				"telegramUsername2": data.User.TelegramUser2,
			},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "waiting"})
}

// CompleteTelegramQRSession completes the linking when triggered via mobile deep link / bot
func (h *AuthHandler) CompleteTelegramQRSession(c *gin.Context) {
	secretToken := os.Getenv("TELEGRAM_BOT_SECRET_TOKEN")
	authHeader := c.GetHeader("X-Telegram-Bot-Secret")

	// In release mode or if secretToken is configured, enforce secret token validation
	if os.Getenv("GIN_MODE") == "release" || secretToken != "" {
		if secretToken == "" || authHeader != secretToken {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized telegram QR completion request"})
			return
		}
	}

	var req struct {
		SessionID string `json:"sessionId" binding:"required"`
		ID        int64  `json:"id"`
		FirstName string `json:"first_name"`
		Username  string `json:"username"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload"})
		return
	}

	_, err := services.CompleteTelegramLinkDirect(
		h.db,
		req.SessionID,
		req.ID,
		req.FirstName,
		"",
		req.Username,
	)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Liên kết Telegram thành công"})
}
