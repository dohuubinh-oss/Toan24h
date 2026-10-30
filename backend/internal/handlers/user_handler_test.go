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
	"github.com/modeptrai/exam-model-backend/internal/middleware"
	"github.com/modeptrai/exam-model-backend/internal/models"
	"github.com/modeptrai/exam-model-backend/internal/utils"
	"github.com/testcontainers/testcontainers-go"
	"github.com/testcontainers/testcontainers-go/modules/postgres"
	"github.com/testcontainers/testcontainers-go/wait"
	gormpg "gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func setupUserHandlerTestEnv(t *testing.T) (*gin.Engine, *gorm.DB, func()) {
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

	err = db.AutoMigrate(&models.User{}, &models.Voucher{})
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

	userHandler := handlers.NewUserHandler(db)

	authMiddlewareMock := func(c *gin.Context) {
		tokenHeader := c.GetHeader("Authorization")
		if tokenHeader != "" && len(tokenHeader) > 7 {
			claims, err := utils.ValidateToken(tokenHeader[7:])
			if err == nil {
				c.Set("userID", claims.UserID)
				c.Set("userRole", claims.Role)
			}
		}
		c.Next()
	}

	api := r.Group("/api/v1", authMiddlewareMock)
	{
		users := api.Group("/users")
		{
			users.GET("/me", userHandler.GetProfile)
			users.PUT("/:id/role", middleware.RoleMiddleware("admin"), userHandler.UpdateUserRole)
		}
	}

	return r, db, cleanup
}

func TestUpdateUserRole(t *testing.T) {
	r, db, cleanup := setupUserHandlerTestEnv(t)
	defer cleanup()

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
	studentUser := models.User{
		ID:       uuid.New(),
		Email:    "student@toan6789.vn",
		FullName: "Student User",
		Role:     "student",
		Status:   "active",
	}

	db.Create(&adminUser)
	db.Create(&teacherUser)
	db.Create(&studentUser)

	adminToken, _ := utils.GenerateAccessToken(adminUser.ID, adminUser.Role, "")
	teacherToken, _ := utils.GenerateAccessToken(teacherUser.ID, teacherUser.Role, "")

	t.Run("Admin successfully updates student to teacher", func(t *testing.T) {
		body, _ := json.Marshal(map[string]string{"role": "teacher"})
		req, _ := http.NewRequest("PUT", "/api/v1/users/"+studentUser.ID.String()+"/role", bytes.NewBuffer(body))
		req.Header.Set("Authorization", "Bearer "+adminToken)
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("Expected 200, got %d. Body: %s", w.Code, w.Body.String())
		}

		var updated models.User
		db.First(&updated, studentUser.ID)
		if updated.Role != "teacher" {
			t.Errorf("Expected role 'teacher', got '%s'", updated.Role)
		}
	})

	t.Run("Admin successfully updates user to affiliate", func(t *testing.T) {
		body, _ := json.Marshal(map[string]string{"role": "affiliate"})
		req, _ := http.NewRequest("PUT", "/api/v1/users/"+studentUser.ID.String()+"/role", bytes.NewBuffer(body))
		req.Header.Set("Authorization", "Bearer "+adminToken)
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("Expected 200, got %d. Body: %s", w.Code, w.Body.String())
		}

		var updated models.User
		db.First(&updated, studentUser.ID)
		if updated.Role != "affiliate" {
			t.Errorf("Expected role 'affiliate', got '%s'", updated.Role)
		}
	})

	t.Run("Non-admin receives 403 Forbidden", func(t *testing.T) {
		body, _ := json.Marshal(map[string]string{"role": "teacher"})
		req, _ := http.NewRequest("PUT", "/api/v1/users/"+studentUser.ID.String()+"/role", bytes.NewBuffer(body))
		req.Header.Set("Authorization", "Bearer "+teacherToken)
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		if w.Code != http.StatusForbidden {
			t.Fatalf("Expected 403 Forbidden, got %d", w.Code)
		}
	})

	t.Run("Invalid role returns 400 Bad Request", func(t *testing.T) {
		body, _ := json.Marshal(map[string]string{"role": "invalid_role"})
		req, _ := http.NewRequest("PUT", "/api/v1/users/"+studentUser.ID.String()+"/role", bytes.NewBuffer(body))
		req.Header.Set("Authorization", "Bearer "+adminToken)
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		if w.Code != http.StatusBadRequest {
			t.Fatalf("Expected 400 Bad Request, got %d", w.Code)
		}
	})
}

func TestGetProfile_ReferralAndCommission(t *testing.T) {
	r, db, cleanup := setupUserHandlerTestEnv(t)
	defer cleanup()

	teacherUser := models.User{
		ID:                      uuid.New(),
		Email:                   "teacher_profile@toan6789.vn",
		FullName:                "Teacher Profile",
		Role:                    "teacher",
		Status:                  "active",
		CommissionBalance:       180000,
		TotalCommissionReceived: 1500000,
	}
	studentUser := models.User{
		ID:       uuid.New(),
		Email:    "student_profile@toan6789.vn",
		FullName: "Student Profile",
		Role:     "student",
		Status:   "active",
	}

	db.Create(&teacherUser)
	db.Create(&studentUser)

	teacherToken, _ := utils.GenerateAccessToken(teacherUser.ID, teacherUser.Role, "")
	studentToken, _ := utils.GenerateAccessToken(studentUser.ID, studentUser.Role, "")

	t.Run("Teacher GetProfile auto-generates referral code and returns commission fields", func(t *testing.T) {
		req, _ := http.NewRequest("GET", "/api/v1/users/me", nil)
		req.Header.Set("Authorization", "Bearer "+teacherToken)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("Expected 200, got %d. Body: %s", w.Code, w.Body.String())
		}

		var res struct {
			Data struct {
				ID                      string  `json:"id"`
				Email                   string  `json:"email"`
				Role                    string  `json:"role"`
				ReferralCode            *string `json:"referralCode"`
				CommissionBalance       int64   `json:"commissionBalance"`
				TotalCommissionReceived int64   `json:"totalCommissionReceived"`
			} `json:"data"`
		}
		if err := json.Unmarshal(w.Body.Bytes(), &res); err != nil {
			t.Fatalf("Failed to parse json: %v", err)
		}

		if res.Data.ReferralCode == nil || len(*res.Data.ReferralCode) != 10 || (*res.Data.ReferralCode)[:2] != "GT" {
			val := "<nil>"
			if res.Data.ReferralCode != nil {
				val = *res.Data.ReferralCode
			}
			t.Errorf("Expected referral code starting with GT (length 10), got %s", val)
		}
		if res.Data.CommissionBalance != 180000 {
			t.Errorf("Expected CommissionBalance 180000, got %d", res.Data.CommissionBalance)
		}
		if res.Data.TotalCommissionReceived != 1500000 {
			t.Errorf("Expected TotalCommissionReceived 1500000, got %d", res.Data.TotalCommissionReceived)
		}

		// Verify voucher exists in DB
		var voucher models.Voucher
		if err := db.Where("code = ?", *res.Data.ReferralCode).First(&voucher).Error; err != nil {
			t.Fatalf("Expected voucher in DB for referral code, got error: %v", err)
		}
		if voucher.CommissionPercent != 60 {
			t.Errorf("Expected voucher commission 60%%, got %v", voucher.CommissionPercent)
		}
	})

	t.Run("Student GetProfile does not generate referral code", func(t *testing.T) {
		req, _ := http.NewRequest("GET", "/api/v1/users/me", nil)
		req.Header.Set("Authorization", "Bearer "+studentToken)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("Expected 200, got %d. Body: %s", w.Code, w.Body.String())
		}

		var res struct {
			Data struct {
				ReferralCode            *string `json:"referralCode"`
				CommissionBalance       int64   `json:"commissionBalance"`
				TotalCommissionReceived int64   `json:"totalCommissionReceived"`
			} `json:"data"`
		}
		if err := json.Unmarshal(w.Body.Bytes(), &res); err != nil {
			t.Fatalf("Failed to parse json: %v", err)
		}

		if res.Data.ReferralCode != nil {
			t.Errorf("Expected nil referral code for student, got %v", *res.Data.ReferralCode)
		}
		if res.Data.CommissionBalance != 0 {
			t.Errorf("Expected 0 CommissionBalance, got %d", res.Data.CommissionBalance)
		}
	})
}
