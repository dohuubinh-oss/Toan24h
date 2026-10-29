package handlers_test

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/modeptrai/exam-model-backend/internal/handlers"
	"github.com/modeptrai/exam-model-backend/internal/models"
	"github.com/modeptrai/exam-model-backend/internal/services"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/testcontainers/testcontainers-go"
	"github.com/testcontainers/testcontainers-go/modules/postgres"
	"github.com/testcontainers/testcontainers-go/wait"
	gormpg "gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func setupWebhookTestDB(t *testing.T) (*gorm.DB, func()) {
	// 1. Try local postgres first if running
	localDSN := "host=localhost user=admin password=secretpassword dbname=toan24h port=5432 sslmode=disable TimeZone=Asia/Ho_Chi_Minh"
	if db, err := gorm.Open(gormpg.Open(localDSN), &gorm.Config{}); err == nil {
		if sqlDB, err := db.DB(); err == nil {
			ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
			defer cancel()
			if err := sqlDB.PingContext(ctx); err == nil {
				_ = db.AutoMigrate(&models.User{}, &models.Transaction{}, &models.CommissionTransaction{})
				return db, func() {}
			}
		}
	}

	// 2. Try testcontainers if docker is available
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
		t.Skipf("Skipping postgres container test: docker daemon not accessible (%v)", err)
		return nil, func() {}
	}

	connStr, err := pgContainer.ConnectionString(ctx, "sslmode=disable")
	if err != nil {
		t.Fatalf("Failed to get connection string: %v", err)
	}

	db, err := gorm.Open(gormpg.Open(connStr), &gorm.Config{})
	if err != nil {
		t.Fatalf("Failed to connect to test db: %v", err)
	}

	err = db.AutoMigrate(&models.User{}, &models.Transaction{}, &models.CommissionTransaction{})
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

func sendPayOSWebhookReq(r *gin.Engine, ps *services.PayOSService, orderCode int64, amount int) *httptest.ResponseRecorder {
	webhookData := handlers.PayOSWebhookData{
		OrderCode:           orderCode,
		Amount:              amount,
		Description:         fmt.Sprintf("TOAN6789 %d", orderCode),
		AccountNumber:       "1234567890",
		Reference:           fmt.Sprintf("FT_%d", orderCode),
		TransactionDateTime: "2026-03-20 15:30:00",
		Currency:            "VND",
		PaymentLinkID:       fmt.Sprintf("link_%d", orderCode),
		Code:                "00",
		Desc:                "success",
	}

	sig := ps.GenerateWebhookDataSignature(webhookData)

	payload := handlers.PayOSWebhookBody{
		Code:      "00",
		Desc:      "success",
		Data:      webhookData,
		Signature: sig,
	}

	payloadBytes, _ := json.Marshal(payload)
	req, _ := http.NewRequest("POST", "/api/webhook/payos", bytes.NewBuffer(payloadBytes))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	return w
}

func TestHandlePayOSWebhook(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, cleanup := setupWebhookTestDB(t)
	defer cleanup()

	// Setup data
	u := models.User{
		Email:        fmt.Sprintf("payos_student_%d@example.com", time.Now().UnixNano()),
		PasswordHash: "hashed",
		FullName:     "PayOS Student",
		ExpiresAt:    nil,
	}
	db.Create(&u)

	orderCode := time.Now().UnixNano() / 1000
	tx := models.Transaction{
		UserID:    u.ID,
		OrderCode: orderCode,
		Amount:    1080000,
		Plan:      "9_months",
		Status:    "pending",
	}
	db.Create(&tx)

	checksumKey := "0d54020a13ee42a8b9f71c4c8d55a7ee"
	payosService := handlers.NewPayOSService("client_id", "api_key", checksumKey)
	webhookHandler := handlers.NewWebhookHandler(db, payosService)
	router := gin.Default()
	router.POST("/api/webhook/payos", webhookHandler.HandlePayOSWebhook)

	w := sendPayOSWebhookReq(router, payosService, orderCode, 1080000)

	if w.Code != http.StatusOK {
		t.Fatalf("Expected status 200, got %v. Body: %v", w.Code, w.Body.String())
	}

	// Verify Transaction Status
	var updatedTx models.Transaction
	db.First(&updatedTx, "order_code = ?", orderCode)
	if updatedTx.Status != "completed" {
		t.Errorf("Expected transaction status to be completed, got %v", updatedTx.Status)
	}

	// Verify User ExpiresAt updated for 9 months
	var updatedUser models.User
	db.First(&updatedUser, "id = ?", u.ID)
	if updatedUser.ExpiresAt == nil {
		t.Fatalf("Expected user ExpiresAt to be updated, got nil")
	}

	expectedEnd := time.Now().AddDate(0, 9, 0)
	diff := updatedUser.ExpiresAt.Sub(expectedEnd)
	if diff < -time.Minute || diff > time.Minute {
		t.Errorf("Expected expires at ~%v, got %v", expectedEnd, updatedUser.ExpiresAt)
	}
}

func TestHandlePayOSWebhook_SignatureValidation(t *testing.T) {
	gin.SetMode(gin.TestMode)
	checksumKey := "0d54020a13ee42a8b9f71c4c8d55a7ee"
	payosService := handlers.NewPayOSService("client_id", "api_key", checksumKey)
	webhookHandler := handlers.NewWebhookHandler(nil, payosService)
	router := gin.New()
	router.POST("/api/webhook/payos", webhookHandler.HandlePayOSWebhook)

	t.Run("InvalidSignature_Returns401", func(t *testing.T) {
		payload := map[string]interface{}{
			"code": "00",
			"desc": "success",
			"data": map[string]interface{}{
				"orderCode": 123,
				"amount":    3000,
			},
			"signature": "invalid_sig",
		}
		bodyBytes, _ := json.Marshal(payload)
		req, _ := http.NewRequest("POST", "/api/webhook/payos", bytes.NewBuffer(bodyBytes))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		if w.Code != http.StatusUnauthorized {
			t.Errorf("Expected status 401, got %d", w.Code)
		}
	})

	t.Run("IgnoredNonSuccess_Returns200WithPayOSFormat", func(t *testing.T) {
		data := map[string]interface{}{
			"orderCode": 123,
			"amount":    3000,
			"code":      "01",
		}
		sig := payosService.GenerateWebhookSignatureFromMap(data)
		payload := map[string]interface{}{
			"code":      "01",
			"desc":      "cancelled",
			"data":      data,
			"signature": sig,
		}
		bodyBytes, _ := json.Marshal(payload)
		req, _ := http.NewRequest("POST", "/api/webhook/payos", bytes.NewBuffer(bodyBytes))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Errorf("Expected status 200, got %d", w.Code)
		}
		var resp map[string]interface{}
		_ = json.Unmarshal(w.Body.Bytes(), &resp)
		if resp["error"] != float64(0) {
			t.Errorf("Expected error to be 0, got %v", resp["error"])
		}
	})
}

func TestWebhookCommission(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, cleanup := setupWebhookTestDB(t)
	defer cleanup()

	checksumKey := "0d54020a13ee42a8b9f71c4c8d55a7ee"
	payosService := handlers.NewPayOSService("client_id", "api_key", checksumKey)
	webhookHandler := handlers.NewWebhookHandler(db, payosService)
	router := gin.Default()
	router.POST("/api/webhook/payos", webhookHandler.HandlePayOSWebhook)

	t.Run("TeacherReferrer_Receives60PercentCommission", func(t *testing.T) {
		teacher := models.User{
			Email:             fmt.Sprintf("teacher_%d@example.com", time.Now().UnixNano()),
			PasswordHash:      "hashed",
			FullName:          "Teacher Referrer",
			Role:              "teacher",
			Status:            "active",
			CommissionBalance: 0,
		}
		require.NoError(t, db.Create(&teacher).Error)

		student := models.User{
			Email:        fmt.Sprintf("student_t_%d@example.com", time.Now().UnixNano()),
			PasswordHash: "hashed",
			FullName:     "Student T",
			Role:         "student",
			Status:       "active",
			ReferrerID:   &teacher.ID,
		}
		require.NoError(t, db.Create(&student).Error)

		orderCode := time.Now().UnixNano() / 1000
		tx := models.Transaction{
			UserID:    student.ID,
			OrderCode: orderCode,
			Amount:    300000,
			Plan:      "1_month",
			Status:    "pending",
		}
		require.NoError(t, db.Create(&tx).Error)

		w := sendPayOSWebhookReq(router, payosService, orderCode, 300000)
		assert.Equal(t, http.StatusOK, w.Code)

		// Verify Student VIP activated
		var updatedStudent models.User
		require.NoError(t, db.First(&updatedStudent, "id = ?", student.ID).Error)
		assert.NotNil(t, updatedStudent.ExpiresAt)

		// Verify Teacher CommissionBalance: 300,000 * 60% = 180,000
		var updatedTeacher models.User
		require.NoError(t, db.First(&updatedTeacher, "id = ?", teacher.ID).Error)
		assert.Equal(t, int64(180000), updatedTeacher.CommissionBalance)

		// Verify CommissionTransaction created
		var commTx models.CommissionTransaction
		require.NoError(t, db.First(&commTx, "order_code = ?", orderCode).Error)
		assert.Equal(t, teacher.ID, commTx.ReferrerID)
		assert.Equal(t, student.ID, commTx.StudentID)
		assert.Equal(t, 300000, commTx.StudentAmount)
		assert.InDelta(t, float32(60.0), commTx.CommissionRate, 0.01)
		assert.Equal(t, 180000, commTx.CommissionAmount)
		assert.Equal(t, "pending", commTx.Status)
	})

	t.Run("AffiliateReferrer_Receives30PercentCommission", func(t *testing.T) {
		affiliate := models.User{
			Email:             fmt.Sprintf("affiliate_%d@example.com", time.Now().UnixNano()),
			PasswordHash:      "hashed",
			FullName:          "Affiliate Partner",
			Role:              "affiliate",
			Status:            "active",
			CommissionBalance: 0,
		}
		require.NoError(t, db.Create(&affiliate).Error)

		student := models.User{
			Email:        fmt.Sprintf("student_a_%d@example.com", time.Now().UnixNano()),
			PasswordHash: "hashed",
			FullName:     "Student A",
			Role:         "student",
			Status:       "active",
			ReferrerID:   &affiliate.ID,
		}
		require.NoError(t, db.Create(&student).Error)

		orderCode := time.Now().UnixNano() / 1000
		tx := models.Transaction{
			UserID:    student.ID,
			OrderCode: orderCode,
			Amount:    300000,
			Plan:      "1_month",
			Status:    "pending",
		}
		require.NoError(t, db.Create(&tx).Error)

		w := sendPayOSWebhookReq(router, payosService, orderCode, 300000)
		assert.Equal(t, http.StatusOK, w.Code)

		// Verify Affiliate CommissionBalance: 300,000 * 30% = 90,000
		var updatedAffiliate models.User
		require.NoError(t, db.First(&updatedAffiliate, "id = ?", affiliate.ID).Error)
		assert.Equal(t, int64(90000), updatedAffiliate.CommissionBalance)

		// Verify CommissionTransaction created
		var commTx models.CommissionTransaction
		require.NoError(t, db.First(&commTx, "order_code = ?", orderCode).Error)
		assert.Equal(t, affiliate.ID, commTx.ReferrerID)
		assert.Equal(t, student.ID, commTx.StudentID)
		assert.Equal(t, 300000, commTx.StudentAmount)
		assert.InDelta(t, float32(30.0), commTx.CommissionRate, 0.01)
		assert.Equal(t, 90000, commTx.CommissionAmount)
		assert.Equal(t, "pending", commTx.Status)
	})

	t.Run("AdminReferrer_Receives70PercentCommission", func(t *testing.T) {
		admin := models.User{
			Email:             fmt.Sprintf("admin_%d@example.com", time.Now().UnixNano()),
			PasswordHash:      "hashed",
			FullName:          "Admin Partner",
			Role:              "admin",
			Status:            "active",
			CommissionBalance: 0,
		}
		require.NoError(t, db.Create(&admin).Error)

		student := models.User{
			Email:        fmt.Sprintf("student_ad_%d@example.com", time.Now().UnixNano()),
			PasswordHash: "hashed",
			FullName:     "Student AD",
			Role:         "student",
			Status:       "active",
			ReferrerID:   &admin.ID,
		}
		require.NoError(t, db.Create(&student).Error)

		orderCode := time.Now().UnixNano() / 1000
		tx := models.Transaction{
			UserID:    student.ID,
			OrderCode: orderCode,
			Amount:    300000,
			Plan:      "1_month",
			Status:    "pending",
		}
		require.NoError(t, db.Create(&tx).Error)

		w := sendPayOSWebhookReq(router, payosService, orderCode, 300000)
		assert.Equal(t, http.StatusOK, w.Code)

		// Verify Admin CommissionBalance: 300,000 * 70% = 210,000
		var updatedAdmin models.User
		require.NoError(t, db.First(&updatedAdmin, "id = ?", admin.ID).Error)
		assert.Equal(t, int64(210000), updatedAdmin.CommissionBalance)

		// Verify CommissionTransaction created
		var commTx models.CommissionTransaction
		require.NoError(t, db.First(&commTx, "order_code = ?", orderCode).Error)
		assert.Equal(t, admin.ID, commTx.ReferrerID)
		assert.Equal(t, student.ID, commTx.StudentID)
		assert.Equal(t, 300000, commTx.StudentAmount)
		assert.InDelta(t, float32(70.0), commTx.CommissionRate, 0.01)
		assert.Equal(t, 210000, commTx.CommissionAmount)
		assert.Equal(t, "pending", commTx.Status)
	})

	t.Run("StudentWithoutReferrer_NoCommissionGenerated", func(t *testing.T) {
		student := models.User{
			Email:        fmt.Sprintf("student_noref_%d@example.com", time.Now().UnixNano()),
			PasswordHash: "hashed",
			FullName:     "Student No Ref",
			Role:         "student",
			Status:       "active",
			ReferrerID:   nil,
		}
		require.NoError(t, db.Create(&student).Error)

		orderCode := time.Now().UnixNano() / 1000
		tx := models.Transaction{
			UserID:    student.ID,
			OrderCode: orderCode,
			Amount:    300000,
			Plan:      "1_month",
			Status:    "pending",
		}
		require.NoError(t, db.Create(&tx).Error)

		w := sendPayOSWebhookReq(router, payosService, orderCode, 300000)
		assert.Equal(t, http.StatusOK, w.Code)

		// Student VIP activated
		var updatedStudent models.User
		require.NoError(t, db.First(&updatedStudent, "id = ?", student.ID).Error)
		assert.NotNil(t, updatedStudent.ExpiresAt)

		// No CommissionTransaction created
		var count int64
		require.NoError(t, db.Model(&models.CommissionTransaction{}).Where("order_code = ?", orderCode).Count(&count).Error)
		assert.Equal(t, int64(0), count)
	})

	t.Run("WebhookIdempotency_DuplicateWebhookDoesNotDoubleCommission", func(t *testing.T) {
		teacher := models.User{
			Email:             fmt.Sprintf("teacher_idem_%d@example.com", time.Now().UnixNano()),
			PasswordHash:      "hashed",
			FullName:          "Teacher Idem",
			Role:              "teacher",
			Status:            "active",
			CommissionBalance: 0,
		}
		require.NoError(t, db.Create(&teacher).Error)

		student := models.User{
			Email:        fmt.Sprintf("student_idem_%d@example.com", time.Now().UnixNano()),
			PasswordHash: "hashed",
			FullName:     "Student Idem",
			Role:         "student",
			Status:       "active",
			ReferrerID:   &teacher.ID,
		}
		require.NoError(t, db.Create(&student).Error)

		orderCode := time.Now().UnixNano() / 1000
		tx := models.Transaction{
			UserID:    student.ID,
			OrderCode: orderCode,
			Amount:    300000,
			Plan:      "1_month",
			Status:    "pending",
		}
		require.NoError(t, db.Create(&tx).Error)

		// 1st Webhook Call
		w1 := sendPayOSWebhookReq(router, payosService, orderCode, 300000)
		assert.Equal(t, http.StatusOK, w1.Code)

		var teacherAfterFirst models.User
		require.NoError(t, db.First(&teacherAfterFirst, "id = ?", teacher.ID).Error)
		assert.Equal(t, int64(180000), teacherAfterFirst.CommissionBalance)

		// 2nd Webhook Call (Duplicate with same orderCode)
		w2 := sendPayOSWebhookReq(router, payosService, orderCode, 300000)
		assert.Equal(t, http.StatusOK, w2.Code)

		// Verify CommissionBalance is still 180,000 (NOT 360,000)
		var teacherAfterSecond models.User
		require.NoError(t, db.First(&teacherAfterSecond, "id = ?", teacher.ID).Error)
		assert.Equal(t, int64(180000), teacherAfterSecond.CommissionBalance)

		// Exactly 1 CommissionTransaction exists
		var commCount int64
		require.NoError(t, db.Model(&models.CommissionTransaction{}).Where("order_code = ?", orderCode).Count(&commCount).Error)
		assert.Equal(t, int64(1), commCount)
	})

	t.Run("Safety_InactiveOrNonExistentReferrerDoesNotBreakVIPActivation", func(t *testing.T) {
		bannedUser := models.User{
			Email:             fmt.Sprintf("banned_%d@example.com", time.Now().UnixNano()),
			PasswordHash:      "hashed",
			FullName:          "Banned Teacher",
			Role:              "teacher",
			Status:            "banned",
			CommissionBalance: 0,
		}
		require.NoError(t, db.Create(&bannedUser).Error)

		student := models.User{
			Email:        fmt.Sprintf("student_safe_%d@example.com", time.Now().UnixNano()),
			PasswordHash: "hashed",
			FullName:     "Student Safe",
			Role:         "student",
			Status:       "active",
			ReferrerID:   &bannedUser.ID,
		}
		require.NoError(t, db.Create(&student).Error)

		orderCode := time.Now().UnixNano() / 1000
		tx := models.Transaction{
			UserID:    student.ID,
			OrderCode: orderCode,
			Amount:    300000,
			Plan:      "1_month",
			Status:    "pending",
		}
		require.NoError(t, db.Create(&tx).Error)

		w := sendPayOSWebhookReq(router, payosService, orderCode, 300000)
		assert.Equal(t, http.StatusOK, w.Code)

		// Student VIP activated successfully
		var updatedStudent models.User
		require.NoError(t, db.First(&updatedStudent, "id = ?", student.ID).Error)
		assert.NotNil(t, updatedStudent.ExpiresAt)

		// Banned user receives 0 commission
		var updatedBanned models.User
		require.NoError(t, db.First(&updatedBanned, "id = ?", bannedUser.ID).Error)
		assert.Equal(t, int64(0), updatedBanned.CommissionBalance)

		// No CommissionTransaction created
		var count int64
		require.NoError(t, db.Model(&models.CommissionTransaction{}).Where("order_code = ?", orderCode).Count(&count).Error)
		assert.Equal(t, int64(0), count)
	})
}
