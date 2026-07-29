package handlers

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/modeptrai/exam-model-backend/internal/models"
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

	// Set HttpOnly cookies
	c.SetCookie("accessToken", accessToken, 24*60*60, "/", "", false, true)
	c.SetCookie("refreshToken", refreshToken, 7*24*60*60, "/", "", false, true)
	// Set normal cookies for frontend routing (middleware.ts)
	c.SetCookie("userRole", user.Role, 24*60*60, "/", "", false, false)
	c.SetCookie("userGrade", user.Grade, 24*60*60, "/", "", false, false)

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

// LinkTelegram handles linking a Telegram account to an existing user
func (h *AuthHandler) LinkTelegram(c *gin.Context) {
	// Require authentication
	userIDStr, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

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

	// Check if Telegram ID is already linked to another user
	var existing models.User
	if err := h.db.Where("telegram_id = ?", req.ID).First(&existing).Error; err == nil {
		if existing.ID.String() != userIDStr.(string) {
			c.JSON(http.StatusConflict, gin.H{"error": "Telegram account is already linked to another user"})
			return
		}
	}

	// Update current user
	updates := map[string]interface{}{
		"telegram_id": req.ID,
	}
	if req.Username != "" {
		updates["telegram_user"] = req.Username
	}
	if req.PhotoURL != "" {
		updates["telegram_avt"] = req.PhotoURL
	}

	if err := h.db.Model(&models.User{}).Where("id = ?", userIDStr).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to link Telegram account"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Telegram account linked successfully"})
}
