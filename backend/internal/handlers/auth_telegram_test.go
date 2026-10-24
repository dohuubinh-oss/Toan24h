package handlers_test

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/modeptrai/exam-model-backend/internal/handlers"
	"github.com/modeptrai/exam-model-backend/internal/models"
	"github.com/stretchr/testify/assert"
	"github.com/testcontainers/testcontainers-go"
	"github.com/testcontainers/testcontainers-go/modules/postgres"
	"github.com/testcontainers/testcontainers-go/wait"
	gormpg "gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func setupAuthTelegramTestDB(t *testing.T) (*gorm.DB, func()) {
	ctx := context.Background()

	pgContainer, err := postgres.RunContainer(ctx,
		testcontainers.WithImage("postgres:15-alpine"),
		postgres.WithDatabase("testdb_tg"),
		postgres.WithUsername("testuser"),
		postgres.WithPassword("testpassword"),
		testcontainers.WithWaitStrategy(
			wait.ForLog("database system is ready to accept connections").
				WithOccurrence(2).WithStartupTimeout(15*time.Second),
		),
	)
	if err != nil {
		t.Fatalf("Failed to start postgres container: %v", err)
	}

	connStr, err := pgContainer.ConnectionString(ctx, "sslmode=disable")
	if err != nil {
		t.Fatalf("Failed to get connection string: %v", err)
	}

	db, err := gorm.Open(gormpg.Open(connStr), &gorm.Config{})
	if err != nil {
		t.Fatalf("Failed to connect to test db: %v", err)
	}

	err = db.AutoMigrate(&models.User{})
	if err != nil {
		t.Fatalf("Failed to migrate: %v", err)
	}

	cleanup := func() {
		_ = pgContainer.Terminate(ctx)
	}

	return db, cleanup
}

func TestDualTelegramLinkingAndLogin(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, cleanup := setupAuthTelegramTestDB(t)
	defer cleanup()

	authHandler := handlers.NewAuthHandler(db)

	// Create a test user
	user := models.User{
		ID:       uuid.New(),
		Email:    "student_dual@example.com",
		FullName: "Học Sinh Thử Nghiệm",
		Role:     "student",
	}
	assert.NoError(t, db.Create(&user).Error)

	r := gin.New()
	// Mock AuthMiddleware setting userID
	r.POST("/api/v1/users/me/link-telegram", func(c *gin.Context) {
		c.Set("userID", user.ID.String())
		authHandler.LinkTelegram(c)
	})
	r.POST("/api/v1/users/me/unlink-telegram", func(c *gin.Context) {
		c.Set("userID", user.ID.String())
		authHandler.UnlinkTelegram(c)
	})

	t.Run("Link Slot 1 (Student Telegram)", func(t *testing.T) {
		reqBody := map[string]interface{}{
			"id":       int64(111222333),
			"username": "student_tg",
			"slot":     1,
		}
		bodyBytes, _ := json.Marshal(reqBody)
		req, _ := http.NewRequest(http.MethodPost, "/api/v1/users/me/link-telegram", bytes.NewBuffer(bodyBytes))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var updated models.User
		db.First(&updated, "id = ?", user.ID)
		assert.NotNil(t, updated.TelegramID)
		assert.Equal(t, int64(111222333), *updated.TelegramID)
		assert.Equal(t, "student_tg", *updated.TelegramUser)
	})

	t.Run("Link Slot 2 (Parent Telegram)", func(t *testing.T) {
		reqBody := map[string]interface{}{
			"id":       int64(444555666),
			"username": "parent_tg",
			"slot":     2,
		}
		bodyBytes, _ := json.Marshal(reqBody)
		req, _ := http.NewRequest(http.MethodPost, "/api/v1/users/me/link-telegram", bytes.NewBuffer(bodyBytes))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var updated models.User
		db.First(&updated, "id = ?", user.ID)
		assert.NotNil(t, updated.TelegramID2)
		assert.Equal(t, int64(444555666), *updated.TelegramID2)
		assert.Equal(t, "parent_tg", *updated.TelegramUser2)
	})

	t.Run("Prevent linking same Telegram to another user (Collision)", func(t *testing.T) {
		otherUser := models.User{
			ID:       uuid.New(),
			Email:    "other@example.com",
			FullName: "User Khác",
		}
		db.Create(&otherUser)

		reqBody := map[string]interface{}{
			"id":       int64(444555666), // Parent's TG ID already in use
			"username": "parent_tg",
			"slot":     1,
		}
		bodyBytes, _ := json.Marshal(reqBody)
		req, _ := http.NewRequest(http.MethodPost, "/api/v1/users/me/link-telegram", bytes.NewBuffer(bodyBytes))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		// Serve with otherUser ID
		rOther := gin.New()
		rOther.POST("/api/v1/users/me/link-telegram", func(c *gin.Context) {
			c.Set("userID", otherUser.ID.String())
			authHandler.LinkTelegram(c)
		})
		rOther.ServeHTTP(w, req)

		assert.Equal(t, http.StatusConflict, w.Code)
	})

	t.Run("Unlink Slot 2 (Parent)", func(t *testing.T) {
		reqBody := map[string]interface{}{
			"slot": 2,
		}
		bodyBytes, _ := json.Marshal(reqBody)
		req, _ := http.NewRequest(http.MethodPost, "/api/v1/users/me/unlink-telegram", bytes.NewBuffer(bodyBytes))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var updated models.User
		db.First(&updated, "id = ?", user.ID)
		assert.Nil(t, updated.TelegramID2)
		assert.Nil(t, updated.TelegramUser2)
		assert.NotNil(t, updated.TelegramID) // Slot 1 still remains
	})
}

func TestTelegramQRSessionRequiresLinkUserId(t *testing.T) {
	gin.SetMode(gin.TestMode)
	authHandler := handlers.NewAuthHandler(nil)
	r := gin.New()
	r.POST("/api/v1/auth/telegram-qr/session", authHandler.CreateTelegramQRSession)

	reqBody := map[string]interface{}{}
	bodyBytes, _ := json.Marshal(reqBody)
	req, _ := http.NewRequest(http.MethodPost, "/api/v1/auth/telegram-qr/session", bytes.NewBuffer(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	var resp map[string]string
	err := json.Unmarshal(w.Body.Bytes(), &resp)
	assert.NoError(t, err)
	assert.Contains(t, resp["error"], "Đăng nhập bằng Telegram không còn được hỗ trợ")
}

