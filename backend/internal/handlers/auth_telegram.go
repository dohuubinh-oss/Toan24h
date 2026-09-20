package handlers

import (
	"fmt"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/modeptrai/exam-model-backend/internal/models"
	"github.com/modeptrai/exam-model-backend/internal/services"
	"github.com/modeptrai/exam-model-backend/internal/utils"
	"gorm.io/gorm"
)

// TelegramLoginRequest represents the payload from Telegram Login Widget
type TelegramLoginRequest struct {
	ID        int64  `json:"id"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Username  string `json:"username"`
	PhotoURL  string `json:"photo_url"`
	AuthDate  int64  `json:"auth_date"`
	Hash      string `json:"hash"`
}

// TelegramLogin handles authentication via Telegram Widget
func (h *AuthHandler) TelegramLogin(c *gin.Context) {
	var req TelegramLoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload"})
		return
	}

	// Prepare data map for verification
	dataMap := map[string]string{
		"id":         fmt.Sprintf("%d", req.ID),
		"first_name": req.FirstName,
		"auth_date":  fmt.Sprintf("%d", req.AuthDate),
		"hash":       req.Hash,
	}
	if req.LastName != "" {
		dataMap["last_name"] = req.LastName
	}
	if req.Username != "" {
		dataMap["username"] = req.Username
	}
	if req.PhotoURL != "" {
		dataMap["photo_url"] = req.PhotoURL
	}

	// Verify Telegram signature
	if !utils.VerifyTelegramAuth(dataMap) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid Telegram authentication data"})
		return
	}

	// Find user by Telegram ID
	var user models.User
	result := h.db.Where("telegram_id = ?", req.ID).First(&user)

	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			// Create a new user if not exists
			fullName := req.FirstName
			if req.LastName != "" {
				fullName = req.FirstName + " " + req.LastName
			}
			
			// We can generate a dummy email if necessary, or leave it blank
			email := fmt.Sprintf("tg_%d@telegram.local", req.ID)

			user = models.User{
				Email:        email,
				FullName:     fullName,
				TelegramID:   &req.ID,
				Role:         "student",
			}
			
			if req.Username != "" {
				user.TelegramUser = &req.Username
			}
			if req.PhotoURL != "" {
				user.TelegramAvt = &req.PhotoURL
			}

			if err := h.db.Create(&user).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user account"})
				return
			}
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
			return
		}
	} else {
		// Update existing user info if needed
		updates := map[string]interface{}{}
		if req.Username != "" && (user.TelegramUser == nil || *user.TelegramUser != req.Username) {
			updates["telegram_user"] = req.Username
		}
		if req.PhotoURL != "" && (user.TelegramAvt == nil || *user.TelegramAvt != req.PhotoURL) {
			updates["telegram_avt"] = req.PhotoURL
		}
		if len(updates) > 0 {
			h.db.Model(&user).Updates(updates)
		}
	}

	// Generate JWT tokens
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
		"message": "Login successful",
		"user": gin.H{
			"id":       user.ID,
			"email":    user.Email,
			"fullName": user.FullName,
			"role":     user.Role,
			"grade":    user.Grade,
			"points":   user.Points,
			"status":   user.Status,
		},
	})
}

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

// LinkTelegram links a Telegram account to an existing user
func (h *AuthHandler) LinkTelegram(c *gin.Context) {
	userIDStr, exists := c.Get("userID")
	if !exists {
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

	if tgID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing telegram ID"})
		return
	}

	// Verify Telegram signature if hash is present
	if req.Hash != "" {
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

	var currentUID string
	switch id := userIDStr.(type) {
	case uuid.UUID:
		currentUID = id.String()
	case string:
		currentUID = id
	default:
		currentUID = fmt.Sprintf("%v", id)
	}

	// Check if Telegram ID is already linked to another user
	var existing models.User
	if err := h.db.Unscoped().Where("telegram_id = ?", tgID).First(&existing).Error; err == nil {
		if existing.ID.String() != currentUID {
			c.JSON(http.StatusConflict, gin.H{"error": "Tài khoản Telegram này đã được liên kết với một người dùng khác"})
			return
		}
		// Already linked to current user, return success directly
		c.JSON(http.StatusOK, gin.H{
			"message":          "Telegram account linked successfully",
			"telegramId":       tgID,
			"telegramUsername": tgUser,
			"telegramAvt":      tgAvt,
		})
		return
	}

	// Update current user
	updates := map[string]interface{}{
		"telegram_id": tgID,
	}
	if tgUser != "" {
		updates["telegram_user"] = tgUser
	}
	if tgAvt != "" {
		updates["telegram_avt"] = tgAvt
	}

	if err := h.db.Model(&models.User{}).Where("id = ?", currentUID).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to link Telegram account: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":          "Telegram account linked successfully",
		"telegramId":       tgID,
		"telegramUsername": tgUser,
		"telegramAvt":      tgAvt,
	})
}

// CreateTelegramQRSession creates a temporary session ID for mobile Telegram QR / Deep link login
func (h *AuthHandler) CreateTelegramQRSession(c *gin.Context) {
	var body struct {
		SessionID  string `json:"sessionId"`
		LinkUserID string `json:"linkUserId"`
	}
	_ = c.ShouldBindJSON(&body)

	botUsername := os.Getenv("TELEGRAM_BOT_USERNAME")
	if botUsername == "" {
		botUsername = "toan6789_bot"
	}

	var sessionID, deepLink string
	if body.SessionID != "" {
		sessionID = body.SessionID
		services.RegisterTelegramQRSessionWithLink(sessionID, body.LinkUserID)
		deepLink = fmt.Sprintf("https://t.me/%s?start=login_%s", botUsername, sessionID)
	} else {
		sessionID, deepLink = services.CreateTelegramQRSessionWithLink(body.LinkUserID)
	}

	c.JSON(http.StatusOK, gin.H{
		"sessionId":   sessionID,
		"botUsername": botUsername,
		"deepLink":    deepLink,
	})
}

// CheckTelegramQRStatus checks if the mobile Telegram login session has completed
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

		// Set cookies
		setAuthCookies(c, data.AccessToken, data.RefreshToken, data.User.Role, data.User.Grade, formatExpiresAt(data.User.ExpiresAt))

		var tgID int64
		if data.User.TelegramID != nil {
			tgID = *data.User.TelegramID
		} else {
			tgID = data.TelegramID
		}
		var tgUser string
		if data.User.TelegramUser != nil {
			tgUser = *data.User.TelegramUser
		} else {
			tgUser = data.TelegramUser
		}
		var tgAvt string
		if data.User.TelegramAvt != nil {
			tgAvt = *data.User.TelegramAvt
		}

		c.JSON(http.StatusOK, gin.H{
			"status":           "completed",
			"accessToken":      data.AccessToken,
			"refreshToken":     data.RefreshToken,
			"telegramId":       tgID,
			"telegramUsername": tgUser,
			"telegramAvt":      tgAvt,
			"user": gin.H{
				"id":               data.User.ID,
				"email":            data.User.Email,
				"fullName":         data.User.FullName,
				"role":             data.User.Role,
				"grade":            data.User.Grade,
				"points":           data.User.Points,
				"status":           data.User.Status,
				"telegramId":       tgID,
				"telegramUsername": tgUser,
				"telegramAvt":      tgAvt,
				"expiresAt":        data.User.ExpiresAt,
				"createdAt":        data.User.CreatedAt,
			},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "waiting"})
}

// CompleteTelegramQRSession completes the login when triggered via mobile deep link / bot or simulated auth
func (h *AuthHandler) CompleteTelegramQRSession(c *gin.Context) {
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

	_, _, _, err := services.CompleteTelegramLoginDirect(
		h.db,
		req.SessionID,
		req.ID,
		req.FirstName,
		"",
		req.Username,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Telegram login completed on mobile"})
}
