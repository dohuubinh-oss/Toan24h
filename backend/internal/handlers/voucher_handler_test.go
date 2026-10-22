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
	"github.com/google/uuid"
	"github.com/modeptrai/exam-model-backend/internal/handlers"
	"github.com/modeptrai/exam-model-backend/internal/models"
	"github.com/modeptrai/exam-model-backend/internal/utils"
	"github.com/testcontainers/testcontainers-go"
	"github.com/testcontainers/testcontainers-go/modules/postgres"
	"github.com/testcontainers/testcontainers-go/wait"
	gormpg "gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func setupVoucherHandlerTestEnv(t *testing.T) (*gin.Engine, *gorm.DB, func()) {
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
	r := gin.New()

	voucherHandler := handlers.NewVoucherHandler(db)

	authMiddlewareMock := func(c *gin.Context) {
		tokenHeader := c.GetHeader("Authorization")
		if tokenHeader != "" {
			claims, err := utils.ValidateToken(tokenHeader[7:])
			if err == nil {
				c.Set("userID", claims.UserID)
				c.Set("userRole", claims.Role)
			}
		}
		c.Next()
	}

	api := r.Group("/api", authMiddlewareMock)
	{
		api.POST("/vouchers", voucherHandler.CreateVoucher)
		api.GET("/vouchers", voucherHandler.GetVouchers)
	}

	return r, db, cleanup
}

func TestVoucherHandler_CreateAndList(t *testing.T) {
	r, db, cleanup := setupVoucherHandlerTestEnv(t)
	defer cleanup()

	// 1. Seed Admin and Teacher users
	adminUser := models.User{
		ID:       uuid.New(),
		Email:    "admin@toan6789.vn",
		FullName: "Admin User",
		Role:     "admin",
		Status:   "active",
	}
	teacherUser := models.User{
		ID:       uuid.New(),
		Email:    "teacher@toan6789.vn",
		FullName: "Teacher User",
		Role:     "teacher",
		Status:   "active",
	}
	db.Create(&adminUser)
	db.Create(&teacherUser)

	adminToken, _ := utils.GenerateAccessToken(adminUser.ID, adminUser.Role, "")
	teacherToken, _ := utils.GenerateAccessToken(teacherUser.ID, teacherUser.Role, "")

	t.Run("Admin creates voucher successfully", func(t *testing.T) {
		reqBody := handlers.CreateVoucherRequest{
			Code:            "TOANVIP3M",
			FreeMonths:      3,
			DiscountPercent: 20,
			MaxUses:         50,
		}
		jsonBody, _ := json.Marshal(reqBody)

		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/api/vouchers", bytes.NewBuffer(jsonBody))
		req.Header.Set("Authorization", "Bearer "+adminToken)
		req.Header.Set("Content-Type", "application/json")
		r.ServeHTTP(w, req)

		if w.Code != http.StatusCreated {
			t.Fatalf("Expected status 201, got %d. Body: %s", w.Code, w.Body.String())
		}

		var resp struct {
			Message string         `json:"message"`
			Voucher models.Voucher `json:"voucher"`
		}
		_ = json.Unmarshal(w.Body.Bytes(), &resp)

		if resp.Voucher.Code != "TOANVIP3M" {
			t.Errorf("Expected code TOANVIP3M, got %s", resp.Voucher.Code)
		}
		if resp.Voucher.FreeMonths != 3 {
			t.Errorf("Expected freeMonths 3, got %d", resp.Voucher.FreeMonths)
		}
	})

	t.Run("Create duplicate voucher code returns 400", func(t *testing.T) {
		reqBody := handlers.CreateVoucherRequest{
			Code:       "toanvip3m", // lowercase will be normalized to uppercase and detect duplicate
			FreeMonths: 1,
		}
		jsonBody, _ := json.Marshal(reqBody)

		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/api/vouchers", bytes.NewBuffer(jsonBody))
		req.Header.Set("Authorization", "Bearer "+adminToken)
		req.Header.Set("Content-Type", "application/json")
		r.ServeHTTP(w, req)

		if w.Code != http.StatusBadRequest && w.Code != http.StatusConflict {
			t.Fatalf("Expected 400 or 409 for duplicate code, got %d", w.Code)
		}
	})

	t.Run("Teacher creates voucher defaults affiliateId to teacher ID", func(t *testing.T) {
		reqBody := handlers.CreateVoucherRequest{
			Code:       "TEACHER10",
			FreeMonths: 1,
		}
		jsonBody, _ := json.Marshal(reqBody)

		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/api/vouchers", bytes.NewBuffer(jsonBody))
		req.Header.Set("Authorization", "Bearer "+teacherToken)
		req.Header.Set("Content-Type", "application/json")
		r.ServeHTTP(w, req)

		if w.Code != http.StatusCreated {
			t.Fatalf("Expected 201, got %d. Body: %s", w.Code, w.Body.String())
		}

		var resp struct {
			Voucher models.Voucher `json:"voucher"`
		}
		_ = json.Unmarshal(w.Body.Bytes(), &resp)

		if resp.Voucher.AffiliateID == nil || *resp.Voucher.AffiliateID != teacherUser.ID {
			t.Errorf("Expected affiliateId to be teacher ID %v, got %v", teacherUser.ID, resp.Voucher.AffiliateID)
		}
		if resp.Voucher.CommissionPercent != 50.0 {
			t.Errorf("Expected teacher commissionPercent to default to 50%%, got %f", resp.Voucher.CommissionPercent)
		}
	})

	t.Run("Admin creates voucher defaults commissionPercent to 30%", func(t *testing.T) {
		reqBody := handlers.CreateVoucherRequest{
			Code:       "DEFAULT30",
			FreeMonths: 1,
		}
		jsonBody, _ := json.Marshal(reqBody)

		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/api/vouchers", bytes.NewBuffer(jsonBody))
		req.Header.Set("Authorization", "Bearer "+adminToken)
		req.Header.Set("Content-Type", "application/json")
		r.ServeHTTP(w, req)

		if w.Code != http.StatusCreated {
			t.Fatalf("Expected 201, got %d. Body: %s", w.Code, w.Body.String())
		}

		var resp struct {
			Voucher models.Voucher `json:"voucher"`
		}
		_ = json.Unmarshal(w.Body.Bytes(), &resp)

		if resp.Voucher.CommissionPercent != 30.0 {
			t.Errorf("Expected default commissionPercent to be 30%%, got %f", resp.Voucher.CommissionPercent)
		}
	})

	t.Run("Admin GET /vouchers sees all vouchers", func(t *testing.T) {
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", "/api/vouchers", nil)
		req.Header.Set("Authorization", "Bearer "+adminToken)
		r.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("Expected 200, got %d", w.Code)
		}

		var resp struct {
			Vouchers []models.Voucher `json:"vouchers"`
		}
		_ = json.Unmarshal(w.Body.Bytes(), &resp)

		if len(resp.Vouchers) < 2 {
			t.Errorf("Expected at least 2 vouchers for admin, got %d", len(resp.Vouchers))
		}
	})

	t.Run("Teacher GET /vouchers only sees their vouchers", func(t *testing.T) {
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", "/api/vouchers", nil)
		req.Header.Set("Authorization", "Bearer "+teacherToken)
		r.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("Expected 200, got %d", w.Code)
		}

		var resp struct {
			Vouchers []models.Voucher `json:"vouchers"`
		}
		_ = json.Unmarshal(w.Body.Bytes(), &resp)

		for _, v := range resp.Vouchers {
			if v.AffiliateID == nil || *v.AffiliateID != teacherUser.ID {
				t.Errorf("Teacher should only see their vouchers, but got voucher with affiliateId: %v", v.AffiliateID)
			}
		}
	})
}
