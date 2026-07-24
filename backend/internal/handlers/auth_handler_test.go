package handlers_test

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
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

func setupAuthTestEnv(t *testing.T) (*gin.Engine, *gorm.DB, func()) {
	os.Setenv("JWT_SECRET", "supersecret")
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

	err = db.AutoMigrate(&models.User{})
	if err != nil {
		t.Fatalf("Failed to migrate: %v", err)
	}

	cleanup := func() {
		if err := pgContainer.Terminate(ctx); err != nil {
			t.Fatalf("Failed to terminate container: %v", err)
		}
	}

	gin.SetMode(gin.TestMode)
	r := gin.Default()
	r.Use(func(c *gin.Context) {
		c.Set("db", db) // simple way to pass db to handler in this mock setup without DI if handler extracts from ctx or global
		c.Next()
	})
	
	// Register routes
	authHandler := handlers.NewAuthHandler(db)
	r.POST("/api/v1/auth/register", authHandler.Register)
	r.POST("/api/v1/auth/login", authHandler.Login)
	r.POST("/api/v1/auth/refresh", authHandler.Refresh)

	return r, db, cleanup
}

func TestAuthRegisterAndLogin(t *testing.T) {
	r, _, cleanup := setupAuthTestEnv(t)
	defer cleanup()

	// 1. Register
	registerBody := map[string]interface{}{
		"email":    "test@student.com",
		"password": "password123",
		"fullName": "Test Student",
		"role":     "student",
		"grade":    "9",
	}
	bodyBytes, _ := json.Marshal(registerBody)
	req, _ := http.NewRequest("POST", "/api/v1/auth/register", bytes.NewBuffer(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("Expected 201 Created for registration, got %d. Body: %s", w.Code, w.Body.String())
	}

	// 2. Login
	loginBody := map[string]interface{}{
		"email":    "test@student.com",
		"password": "password123",
	}
	loginBodyBytes, _ := json.Marshal(loginBody)
	loginReq, _ := http.NewRequest("POST", "/api/v1/auth/login", bytes.NewBuffer(loginBodyBytes))
	loginReq.Header.Set("Content-Type", "application/json")
	loginW := httptest.NewRecorder()
	r.ServeHTTP(loginW, loginReq)

	if loginW.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK for login, got %d. Body: %s", loginW.Code, loginW.Body.String())
	}

	var loginResp map[string]interface{}
	json.Unmarshal(loginW.Body.Bytes(), &loginResp)
	
	accessToken, ok := loginResp["accessToken"].(string)
	if !ok || accessToken == "" {
		t.Fatalf("Expected accessToken in response")
	}

	refreshToken, ok := loginResp["refreshToken"].(string)
	if !ok || refreshToken == "" {
		t.Fatalf("Expected refreshToken in response")
	}

	// 3. Refresh Token
	refreshBody := map[string]interface{}{
		"refreshToken": refreshToken,
	}
	refreshBodyBytes, _ := json.Marshal(refreshBody)
	refreshReq, _ := http.NewRequest("POST", "/api/v1/auth/refresh", bytes.NewBuffer(refreshBodyBytes))
	refreshReq.Header.Set("Content-Type", "application/json")
	refreshW := httptest.NewRecorder()
	r.ServeHTTP(refreshW, refreshReq)

	if refreshW.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK for refresh, got %d. Body: %s", refreshW.Code, refreshW.Body.String())
	}
}
