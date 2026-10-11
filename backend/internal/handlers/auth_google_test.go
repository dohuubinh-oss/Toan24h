package handlers_test

import (
	"bytes"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/modeptrai/exam-model-backend/internal/handlers"
	"github.com/modeptrai/exam-model-backend/internal/models"
	"github.com/stretchr/testify/assert"
	"gorm.io/gorm"
)

func setupTestDBForGoogle(t *testing.T) (*gorm.DB, func()) {
	// Re-use setupAuthTelegramTestDB or sqlite/in-memory if postgres container is slow,
	// but setupAuthTelegramTestDB works with testcontainers
	return setupAuthTelegramTestDB(t)
}

func TestGoogleLogin(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, cleanup := setupTestDBForGoogle(t)
	defer cleanup()

	authHandler := handlers.NewAuthHandler(db)
	r := gin.New()
	r.POST("/api/v1/auth/google", authHandler.GoogleLogin)

	// Preserve original validator
	origValidator := handlers.VerifyGoogleIDToken
	defer func() {
		handlers.VerifyGoogleIDToken = origValidator
	}()

	t.Run("Invalid Token returns 401", func(t *testing.T) {
		handlers.VerifyGoogleIDToken = func(credential string) (*handlers.GoogleClaims, error) {
			return nil, errors.New("invalid google token")
		}

		body, _ := json.Marshal(map[string]string{"credential": "bad_token"})
		req, _ := http.NewRequest(http.MethodPost, "/api/v1/auth/google", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusUnauthorized, w.Code)
	})

	t.Run("New User Auto-Registers as Student", func(t *testing.T) {
		handlers.VerifyGoogleIDToken = func(credential string) (*handlers.GoogleClaims, error) {
			return &handlers.GoogleClaims{
				Sub:           "google_123456",
				Email:         "new_student@gmail.com",
				EmailVerified: true,
				Name:          "Nguyễn Văn Học Sinh",
				Picture:       "https://lh3.googleusercontent.com/avatar.jpg",
			}, nil
		}

		body, _ := json.Marshal(map[string]string{"credential": "valid_token_new"})
		req, _ := http.NewRequest(http.MethodPost, "/api/v1/auth/google", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var res struct {
			Message string `json:"message"`
			User    struct {
				ID       string `json:"id"`
				Email    string `json:"email"`
				FullName string `json:"fullName"`
				Role     string `json:"role"`
				GoogleID string `json:"googleId"`
			} `json:"user"`
		}
		err := json.Unmarshal(w.Body.Bytes(), &res)
		assert.NoError(t, err)
		assert.Equal(t, "new_student@gmail.com", res.User.Email)
		assert.Equal(t, "Nguyễn Văn Học Sinh", res.User.FullName)
		assert.Equal(t, "student", res.User.Role)

		// Verify saved in DB
		var dbUser models.User
		err = db.Where("email = ?", "new_student@gmail.com").First(&dbUser).Error
		assert.NoError(t, err)
		assert.NotNil(t, dbUser.GoogleID)
		assert.Equal(t, "google_123456", *dbUser.GoogleID)
	})

	t.Run("Existing User Links Google ID", func(t *testing.T) {
		existing := models.User{
			ID:       uuid.New(),
			Email:    "teacher_existing@gmail.com",
			FullName: "Cô Giáo Thảo",
			Role:     "teacher",
		}
		assert.NoError(t, db.Create(&existing).Error)

		handlers.VerifyGoogleIDToken = func(credential string) (*handlers.GoogleClaims, error) {
			return &handlers.GoogleClaims{
				Sub:           "google_teacher_789",
				Email:         "teacher_existing@gmail.com",
				EmailVerified: true,
				Name:          "Cô Giáo Thảo (Google)",
			}, nil
		}

		body, _ := json.Marshal(map[string]string{"credential": "valid_token_existing"})
		req, _ := http.NewRequest(http.MethodPost, "/api/v1/auth/google", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var res struct {
			User struct {
				Role string `json:"role"`
			} `json:"user"`
		}
		json.Unmarshal(w.Body.Bytes(), &res)
		assert.Equal(t, "teacher", res.User.Role) // Preserves existing role!

		var updated models.User
		db.First(&updated, "id = ?", existing.ID)
		assert.NotNil(t, updated.GoogleID)
		assert.Equal(t, "google_teacher_789", *updated.GoogleID)
	})
}
