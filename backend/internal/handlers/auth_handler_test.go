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
	"github.com/modeptrai/exam-model-backend/internal/services"
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

	err = db.AutoMigrate(&models.User{}, &models.Voucher{}, &models.VoucherUsage{})
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
	refreshReq.AddCookie(&http.Cookie{Name: "refreshToken", Value: refreshToken})
	refreshW := httptest.NewRecorder()
	r.ServeHTTP(refreshW, refreshReq)

	if refreshW.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK for refresh, got %d. Body: %s", refreshW.Code, refreshW.Body.String())
	}
}

func TestForgotPasswordAndReset_GoogleUser(t *testing.T) {
	r, db, cleanup := setupAuthTestEnv(t)
	defer cleanup()

	authHandler := handlers.NewAuthHandler(db)
	r.POST("/api/v1/auth/forgot-password", authHandler.ForgotPassword)
	r.POST("/api/v1/auth/verify-otp", authHandler.VerifyOTP)
	r.POST("/api/v1/auth/reset-password", authHandler.ResetPassword)

	// User created via Google (PasswordHash is empty)
	googleSub := "google_999888"
	googleUser := models.User{
		Email:    "google_reset@example.com",
		FullName: "Google User",
		Role:     "student",
		GoogleID: &googleSub,
	}
	if err := db.Create(&googleUser).Error; err != nil {
		t.Fatalf("Failed to create user: %v", err)
	}

	// 1. Forgot Password
	body, _ := json.Marshal(map[string]string{"email": "google_reset@example.com"})
	req, _ := http.NewRequest("POST", "/api/v1/auth/forgot-password", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK for forgot-password, got %d. Body: %s", w.Code, w.Body.String())
	}

	// Inject OTP
	otpService := services.NewOTPService()
	otpService.SaveOTP("google_reset@example.com", "123456")

	// 2. Verify OTP
	verifyBody, _ := json.Marshal(map[string]string{
		"email": "google_reset@example.com",
		"otp":   "123456",
	})
	vReq, _ := http.NewRequest("POST", "/api/v1/auth/verify-otp", bytes.NewBuffer(verifyBody))
	vReq.Header.Set("Content-Type", "application/json")
	vW := httptest.NewRecorder()
	r.ServeHTTP(vW, vReq)
	if vW.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK for verify-otp, got %d", vW.Code)
	}

	// 3. Reset Password
	resetBody, _ := json.Marshal(map[string]string{
		"email":       "google_reset@example.com",
		"otp":         "123456",
		"newPassword": "NewPassword123!",
	})
	rReq, _ := http.NewRequest("POST", "/api/v1/auth/reset-password", bytes.NewBuffer(resetBody))
	rReq.Header.Set("Content-Type", "application/json")
	rW := httptest.NewRecorder()
	r.ServeHTTP(rW, rReq)
	if rW.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK for reset-password, got %d", rW.Code)
	}

	// 4. User should now be able to log in with newPassword!
	loginBody, _ := json.Marshal(map[string]string{
		"email":    "google_reset@example.com",
		"password": "NewPassword123!",
	})
	lReq, _ := http.NewRequest("POST", "/api/v1/auth/login", bytes.NewBuffer(loginBody))
	lReq.Header.Set("Content-Type", "application/json")
	lW := httptest.NewRecorder()
	r.ServeHTTP(lW, lReq)
	if lW.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK for login after reset-password, got %d. Body: %s", lW.Code, lW.Body.String())
	}
}

func TestRegisterWithVoucher(t *testing.T) {
	r, db, cleanup := setupAuthTestEnv(t)
	defer cleanup()

	// Seed an active voucher with 3 free months
	validVoucher := models.Voucher{
		Code:        "TOANVIP3M",
		FreeMonths:  3,
		MaxUses:     5,
		UsedCount:   0,
		IsActive:    true,
	}
	db.Create(&validVoucher)

	// Seed an expired/exhausted voucher
	exhaustedVoucher := models.Voucher{
		Code:       "EXHAUSTED",
		FreeMonths: 1,
		MaxUses:    1,
		UsedCount:  1,
		IsActive:   true,
	}
	db.Create(&exhaustedVoucher)

	t.Run("Register with valid voucher grants VIP months and creates usage", func(t *testing.T) {
		registerBody := map[string]interface{}{
			"email":       "student_voucher@toan6789.vn",
			"password":    "password123",
			"fullName":    "Voucher Student",
			"role":        "student",
			"grade":       "9",
			"voucherCode": "toanvip3m", // lowercase test
		}
		bodyBytes, _ := json.Marshal(registerBody)
		req, _ := http.NewRequest("POST", "/api/v1/auth/register", bytes.NewBuffer(bodyBytes))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		if w.Code != http.StatusCreated {
			t.Fatalf("Expected 201 Created, got %d. Body: %s", w.Code, w.Body.String())
		}

		var createdUser models.User
		if err := db.Where("email = ?", "student_voucher@toan6789.vn").First(&createdUser).Error; err != nil {
			t.Fatalf("User was not found in DB: %v", err)
		}

		if createdUser.ExpiresAt == nil {
			t.Fatalf("Expected user ExpiresAt to be set, but got nil")
		}
		// Check that ExpiresAt is roughly 3 months from now (at least 80 days)
		if createdUser.ExpiresAt.Before(time.Now().AddDate(0, 2, 20)) {
			t.Fatalf("ExpiresAt is too soon: %v", createdUser.ExpiresAt)
		}

		// Check voucher used_count increased
		var updatedVoucher models.Voucher
		db.First(&updatedVoucher, validVoucher.ID)
		if updatedVoucher.UsedCount != 1 {
			t.Errorf("Expected voucher usedCount to be 1, got %d", updatedVoucher.UsedCount)
		}

		// Check voucher usage record created
		var usage models.VoucherUsage
		if err := db.Where("voucher_id = ? AND user_id = ?", validVoucher.ID, createdUser.ID).First(&usage).Error; err != nil {
			t.Errorf("Expected VoucherUsage to be created, got err: %v", err)
		}
	})

	t.Run("Register with non-existent voucher fails and does not create user", func(t *testing.T) {
		registerBody := map[string]interface{}{
			"email":       "student_fake@toan6789.vn",
			"password":    "password123",
			"fullName":    "Fake Voucher Student",
			"role":        "student",
			"grade":       "9",
			"voucherCode": "NOSUCHCODE",
		}
		bodyBytes, _ := json.Marshal(registerBody)
		req, _ := http.NewRequest("POST", "/api/v1/auth/register", bytes.NewBuffer(bodyBytes))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		if w.Code != http.StatusBadRequest {
			t.Fatalf("Expected 400 Bad Request, got %d", w.Code)
		}

		var count int64
		db.Model(&models.User{}).Where("email = ?", "student_fake@toan6789.vn").Count(&count)
		if count > 0 {
			t.Errorf("User should not have been created on invalid voucher")
		}
	})

	t.Run("Register with exhausted voucher fails", func(t *testing.T) {
		registerBody := map[string]interface{}{
			"email":       "student_exhausted@toan6789.vn",
			"password":    "password123",
			"fullName":    "Exhausted Student",
			"role":        "student",
			"grade":       "9",
			"voucherCode": "EXHAUSTED",
		}
		bodyBytes, _ := json.Marshal(registerBody)
		req, _ := http.NewRequest("POST", "/api/v1/auth/register", bytes.NewBuffer(bodyBytes))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		if w.Code != http.StatusBadRequest {
			t.Fatalf("Expected 400 Bad Request for exhausted voucher, got %d", w.Code)
		}
	})
}


