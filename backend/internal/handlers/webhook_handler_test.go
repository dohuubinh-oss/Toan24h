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
	"github.com/modeptrai/exam-model-backend/internal/handlers"
	"github.com/modeptrai/exam-model-backend/internal/models"
	"github.com/testcontainers/testcontainers-go"
	"github.com/testcontainers/testcontainers-go/modules/postgres"
	"github.com/testcontainers/testcontainers-go/wait"
	gormpg "gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func setupWebhookTestDB(t *testing.T) (*gorm.DB, func()) {
	ctx := context.Background()

	pgContainer, err := postgres.RunContainer(ctx,
		testcontainers.WithImage("postgres:15-alpine"),
		postgres.WithDatabase("testdb"),
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

	err = db.AutoMigrate(&models.User{}, &models.Transaction{})
	if err != nil {
		t.Fatalf("Failed to migrate: %v", err)
	}

	cleanup := func() {
		if err := pgContainer.Terminate(ctx); err != nil {
			t.Fatalf("Failed to terminate container: %v", err)
		}
	}

	return db, cleanup
}

func TestHandleSePayWebhook(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, cleanup := setupWebhookTestDB(t)
	defer cleanup()

	// Setup data
	u := models.User{
		Email:        "student@example.com",
		PasswordHash: "hashed",
		FullName:     "Student",
		ExpiresAt:    nil, // not subscribed yet
	}
	db.Create(&u)

	tx := models.Transaction{
		UserID: u.ID,
		Amount: 450000,
		Plan:   "3_months",
		Status: "pending",
	}
	db.Create(&tx)

	// Setup handler and router
	webhookHandler := handlers.NewWebhookHandler(db)
	router := gin.Default()
	router.POST("/webhooks/sepay", webhookHandler.HandleSePayWebhook)

	// Create payload
	payload := handlers.SePayWebhookPayload{
		ID:             1,
		Gateway:        "Sepay",
		TransferAmount: 450000,
		TransferType:   "in",
		Content:        "T24H " + tx.ID.String(),
	}

	payloadBytes, _ := json.Marshal(payload)
	req, _ := http.NewRequest("POST", "/webhooks/sepay", bytes.NewBuffer(payloadBytes))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	// Perform request
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Expected status 200, got %v. Body: %v", w.Code, w.Body.String())
	}

	// Verify Transaction Status
	var updatedTx models.Transaction
	db.First(&updatedTx, "id = ?", tx.ID)
	if updatedTx.Status != "completed" {
		t.Errorf("Expected transaction status to be completed, got %v", updatedTx.Status)
	}

	// Verify User ExpiresAt
	var updatedUser models.User
	db.First(&updatedUser, "id = ?", u.ID)
	if updatedUser.ExpiresAt == nil {
		t.Fatalf("Expected user ExpiresAt to be updated, got nil")
	}

	// Should be around 3 months from now
	expectedEnd := time.Now().AddDate(0, 3, 0)
	diff := updatedUser.ExpiresAt.Sub(expectedEnd)
	if diff < -time.Minute || diff > time.Minute {
		t.Errorf("Expected expires at ~%v, got %v", expectedEnd, updatedUser.ExpiresAt)
	}
}
