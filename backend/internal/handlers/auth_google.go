package handlers

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/modeptrai/exam-model-backend/internal/models"
	"github.com/modeptrai/exam-model-backend/internal/utils"
	"gorm.io/gorm"
)

type GoogleClaims struct {
	Sub           string `json:"sub"`
	Email         string `json:"email"`
	EmailVerified bool   `json:"email_verified"`
	Name          string `json:"name"`
	Picture       string `json:"picture"`
	Aud           string `json:"aud"`
}

type GoogleLoginRequest struct {
	Credential string `json:"credential" binding:"required"`
}

// defaultVerifyGoogleIDToken verifies the Google ID token using Google's tokeninfo endpoint
func defaultVerifyGoogleIDToken(credential string) (*GoogleClaims, error) {
	if credential == "" {
		return nil, errors.New("empty credential")
	}

	client := &http.Client{Timeout: 5 * time.Second}
	url := fmt.Sprintf("https://oauth2.googleapis.com/tokeninfo?id_token=%s", credential)
	resp, err := client.Get(url)
	if err != nil {
		return nil, fmt.Errorf("failed to verify google token: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("google token verification failed with status: %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read tokeninfo response: %w", err)
	}

	var raw map[string]interface{}
	if err := json.Unmarshal(body, &raw); err != nil {
		return nil, fmt.Errorf("failed to decode google token: %w", err)
	}

	sub, _ := raw["sub"].(string)
	email, _ := raw["email"].(string)
	name, _ := raw["name"].(string)
	picture, _ := raw["picture"].(string)
	aud, _ := raw["aud"].(string)

	emailVerified := false
	if ev, ok := raw["email_verified"].(bool); ok {
		emailVerified = ev
	} else if evStr, ok := raw["email_verified"].(string); ok && evStr == "true" {
		emailVerified = true
	}

	if sub == "" || email == "" {
		return nil, errors.New("missing required claims in google token")
	}

	if !emailVerified {
		return nil, errors.New("email is not verified by Google")
	}

	expectedAud := os.Getenv("GOOGLE_CLIENT_ID")
	if os.Getenv("GIN_MODE") == "release" || expectedAud != "" {
		if expectedAud == "" {
			return nil, errors.New("GOOGLE_CLIENT_ID is not configured")
		}
		if aud != expectedAud {
			return nil, errors.New("google client id mismatch")
		}
	}

	return &GoogleClaims{
		Sub:           sub,
		Email:         email,
		EmailVerified: emailVerified,
		Name:          name,
		Picture:       picture,
		Aud:           aud,
	}, nil
}

// VerifyGoogleIDToken can be overridden in tests
var VerifyGoogleIDToken = defaultVerifyGoogleIDToken

// GoogleLogin handles user authentication via Google Identity Services
func (h *AuthHandler) GoogleLogin(c *gin.Context) {
	var req GoogleLoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Yêu cầu đăng nhập không hợp lệ: thiếu mã credential"})
		return
	}

	claims, err := VerifyGoogleIDToken(req.Credential)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Xác thực tài khoản Google không thành công: " + err.Error()})
		return
	}

	email := strings.ToLower(strings.TrimSpace(claims.Email))

	var user models.User
	result := h.db.Where("email = ?", email).First(&user)

	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			// Auto create new student user
			fullName := strings.TrimSpace(claims.Name)
			if fullName == "" {
				fullName = email
			}

			user = models.User{
				Email:      email,
				FullName:   fullName,
				GoogleID:   &claims.Sub,
				Role:       "student",
				Status:     "active",
				IsVerified: true, // Google đã xác thực email
			}

			if err := h.db.Create(&user).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể tạo tài khoản người dùng: " + err.Error()})
				return
			}
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi cơ sở dữ liệu: " + result.Error.Error()})
			return
		}
	} else {
		// Existing user: Check if account is locked
		if user.Status == "locked" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Tài khoản của bạn đã bị khóa"})
			return
		}

		// Link Google ID if not already linked
		updates := map[string]interface{}{}
		if user.GoogleID == nil || *user.GoogleID != claims.Sub {
			updates["google_id"] = claims.Sub
		}
		if len(updates) > 0 {
			h.db.Model(&user).Updates(updates)
		}
	}

	// Generate access & refresh tokens
	accessToken, err := utils.GenerateAccessToken(user.ID, user.Role, user.Grade)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể tạo mã truy cập access token"})
		return
	}

	refreshToken, err := utils.GenerateRefreshToken(user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể tạo mã refresh token"})
		return
	}

	// Set auth cookies
	setAuthCookies(c, accessToken, refreshToken, user.Role, user.Grade, formatExpiresAt(user.ExpiresAt))

	c.JSON(http.StatusOK, gin.H{
		"message":      "Đăng nhập với Google thành công",
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
			"googleId":  user.GoogleID,
			"expiresAt": user.ExpiresAt,
		},
	})
}
