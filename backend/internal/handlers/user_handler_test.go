package handlers_test

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
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
	"gorm.io/datatypes"
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

	err = db.AutoMigrate(
		&models.User{},
		&models.Voucher{},
		&models.Submission{},
		&models.Notification{},
		&models.LectureBookmark{},
		&models.XPTransaction{},
		&models.VoucherUsage{},
		&models.Transaction{},
	)
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
			users.DELETE("/me", userHandler.DeleteMyAccount)
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

	t.Run("Admin rejects affiliate role with 400 Bad Request", func(t *testing.T) {
		body, _ := json.Marshal(map[string]string{"role": "affiliate"})
		req, _ := http.NewRequest("PUT", "/api/v1/users/"+studentUser.ID.String()+"/role", bytes.NewBuffer(body))
		req.Header.Set("Authorization", "Bearer "+adminToken)
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		if w.Code != http.StatusBadRequest {
			t.Fatalf("Expected 400, got %d. Body: %s", w.Code, w.Body.String())
		}
	})

	t.Run("Admin successfully updates user to student", func(t *testing.T) {
		body, _ := json.Marshal(map[string]string{"role": "student"})
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
		if updated.Role != "student" {
			t.Errorf("Expected role 'student', got '%s'", updated.Role)
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

func TestGetProfile_ReferralCode(t *testing.T) {
	r, db, cleanup := setupUserHandlerTestEnv(t)
	defer cleanup()

	teacherUser := models.User{
		ID:       uuid.New(),
		Email:    "teacher_profile@toan6789.vn",
		FullName: "Teacher Profile",
		Role:     "teacher",
		Status:   "active",
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

	t.Run("Teacher GetProfile auto-generates referral code", func(t *testing.T) {
		req, _ := http.NewRequest("GET", "/api/v1/users/me", nil)
		req.Header.Set("Authorization", "Bearer "+teacherToken)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("Expected 200, got %d. Body: %s", w.Code, w.Body.String())
		}

		var res struct {
			Data struct {
				ID           string  `json:"id"`
				Email        string  `json:"email"`
				Role         string  `json:"role"`
				ReferralCode *string `json:"referralCode"`
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

		// Verify voucher exists in DB
		var voucher models.Voucher
		if err := db.Where("code = ?", *res.Data.ReferralCode).First(&voucher).Error; err != nil {
			t.Fatalf("Expected voucher in DB for referral code, got error: %v", err)
		}
		if voucher.FreeMonths != 1 {
			t.Errorf("Expected voucher freeMonths 1, got %v", voucher.FreeMonths)
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
				ReferralCode *string `json:"referralCode"`
			} `json:"data"`
		}
		if err := json.Unmarshal(w.Body.Bytes(), &res); err != nil {
			t.Fatalf("Failed to parse json: %v", err)
		}

		if res.Data.ReferralCode != nil {
			t.Errorf("Expected nil referral code for student, got %v", *res.Data.ReferralCode)
		}
	})
}

func TestDeleteMyAccount(t *testing.T) {
	r, db, cleanup := setupUserHandlerTestEnv(t)
	defer cleanup()

	t.Run("Unauthorized request rejected", func(t *testing.T) {
		req, _ := http.NewRequest("DELETE", "/api/v1/users/me", nil)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)
		if w.Code != http.StatusUnauthorized {
			t.Fatalf("Expected 401, got %d", w.Code)
		}
	})

	t.Run("Hard delete user and scrubs physical images & personal data", func(t *testing.T) {
		user := models.User{
			Email:    "delete_me@toan6789.vn",
			FullName: "Nguyễn Văn Xóa",
			Role:     "student",
			Status:   "active",
		}
		if err := db.Create(&user).Error; err != nil {
			t.Fatalf("Failed to create test user: %v", err)
		}
		token, _ := utils.GenerateAccessToken(user.ID, user.Role, user.Grade)

		// Create physical test diagram file on disk
		_ = os.MkdirAll("./uploads/diagrams", os.ModePerm)
		testDiagramName := fmt.Sprintf("test_sub_%s.jpg", user.ID.String()[:8])
		testDiagramPath := filepath.Join(".", "uploads", "diagrams", testDiagramName)
		_ = os.WriteFile(testDiagramPath, []byte("fake-image-bytes"), 0644)
		defer os.Remove(testDiagramPath)

		// Create a submission with this diagram URL
		answers := map[string]models.QuestionAnswer{
			"q1": {
				Type:              "Tự luận",
				StudentAnswer:     "Lời giải tự luận viết tay",
				StudentDiagramURL: fmt.Sprintf("/uploads/diagrams/%s", testDiagramName),
			},
		}
		ansBytes, _ := json.Marshal(answers)
		examID := uuid.New()
		sub := models.Submission{
			UserID:      &user.ID,
			ExamID:      examID,
			TotalScore:  9.5,
			AnswersJSON: datatypes.JSON(ansBytes),
			Status:      models.StatusGraded,
		}
		db.Create(&sub)

		// Also create a notification
		db.Create(&models.Notification{
			UserID:  user.ID,
			Title:   "Thông báo",
			Message: "Nội dung",
		})

		// Execute DELETE /api/v1/users/me
		req, _ := http.NewRequest("DELETE", "/api/v1/users/me", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("Expected 200 OK, got %d. Body: %s", w.Code, w.Body.String())
		}

		// 1. Verify user is HARD DELETED (Unscoped query returns 0 rows)
		var checkUser models.User
		err := db.Unscoped().Where("id = ?", user.ID).First(&checkUser).Error
		if err == nil {
			t.Errorf("Expected user to be hard deleted from database, but record still exists")
		}

		// 2. Verify physical diagram file is removed from disk
		if _, err := os.Stat(testDiagramPath); !os.IsNotExist(err) {
			t.Errorf("Expected physical diagram file to be removed from disk, but it still exists")
		}

		// 3. Verify submission is anonymized (UserID is nil, AnswersJSON is scrubbed, but TotalScore is retained for statistics)
		var checkSub models.Submission
		if err := db.Where("id = ?", sub.ID).First(&checkSub).Error; err != nil {
			t.Fatalf("Failed to fetch submission: %v", err)
		}
		if checkSub.UserID != nil {
			t.Errorf("Expected submission UserID to be nil, got %v", checkSub.UserID)
		}
		if string(checkSub.AnswersJSON) != "{}" {
			t.Errorf("Expected answers_json to be scrubbed to '{}', got %s", string(checkSub.AnswersJSON))
		}
		if checkSub.TotalScore != 9.5 {
			t.Errorf("Expected anonymous statistical score 9.5 to be retained, got %f", checkSub.TotalScore)
		}

		// 4. Verify notification is deleted
		var notifCount int64
		db.Unscoped().Model(&models.Notification{}).Where("user_id = ?", user.ID).Count(&notifCount)
		if notifCount != 0 {
			t.Errorf("Expected user notifications to be wiped, found %d", notifCount)
		}
	})
}

