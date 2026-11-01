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

	t.Run("TeacherReferrer_Receives50PercentCommission", func(t *testing.T) {
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

		// Verify Teacher CommissionBalance: 300,000 * 50% = 150,000
		var updatedTeacher models.User
		require.NoError(t, db.First(&updatedTeacher, "id = ?", teacher.ID).Error)
		assert.Equal(t, int64(150000), updatedTeacher.CommissionBalance)

		// Verify CommissionTransaction created
		var commTx models.CommissionTransaction
		require.NoError(t, db.First(&commTx, "order_code = ? AND referrer_id = ?", orderCode, teacher.ID).Error)
		assert.Equal(t, teacher.ID, commTx.ReferrerID)
		assert.Equal(t, student.ID, commTx.StudentID)
		assert.Equal(t, 300000, commTx.StudentAmount)
		assert.InDelta(t, float32(50.0), commTx.CommissionRate, 0.01)
		assert.Equal(t, 150000, commTx.CommissionAmount)
		assert.Equal(t, "pending", commTx.Status)
		assert.Equal(t, "direct", commTx.CommissionType)
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

	t.Run("AdminReferrer_Receives60PercentCommission", func(t *testing.T) {
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

		// Verify Admin CommissionBalance: 300,000 * 60% = 180,000
		var updatedAdmin models.User
		require.NoError(t, db.First(&updatedAdmin, "id = ?", admin.ID).Error)
		assert.Equal(t, int64(180000), updatedAdmin.CommissionBalance)

		// Verify CommissionTransaction created
		var commTx models.CommissionTransaction
		require.NoError(t, db.First(&commTx, "order_code = ? AND referrer_id = ?", orderCode, admin.ID).Error)
		assert.Equal(t, admin.ID, commTx.ReferrerID)
		assert.Equal(t, student.ID, commTx.StudentID)
		assert.Equal(t, 300000, commTx.StudentAmount)
		assert.InDelta(t, float32(60.0), commTx.CommissionRate, 0.01)
		assert.Equal(t, 180000, commTx.CommissionAmount)
		assert.Equal(t, "pending", commTx.Status)
		assert.Equal(t, "direct", commTx.CommissionType)
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
		assert.Equal(t, int64(150000), teacherAfterFirst.CommissionBalance)

		// 2nd Webhook Call (Duplicate with same orderCode)
		w2 := sendPayOSWebhookReq(router, payosService, orderCode, 300000)
		assert.Equal(t, http.StatusOK, w2.Code)

		// Verify CommissionBalance is still 150,000 (NOT 300,000)
		var teacherAfterSecond models.User
		require.NoError(t, db.First(&teacherAfterSecond, "id = ?", teacher.ID).Error)
		assert.Equal(t, int64(150000), teacherAfterSecond.CommissionBalance)

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

	t.Run("MultiTier_Scenario1_DirectStudentWithGrade7_PaysTeacher3PercentAndAdmin1Percent", func(t *testing.T) {
		admin := models.User{
			Email:             fmt.Sprintf("admin_sc1_%d@example.com", time.Now().UnixNano()),
			PasswordHash:      "hashed",
			FullName:          "Admin SC1",
			Role:              "admin",
			Status:            "active",
			CommissionBalance: 0,
		}
		require.NoError(t, db.Create(&admin).Error)

		teacher7 := models.User{
			Email:             fmt.Sprintf("teacher7_sc1_%d@example.com", time.Now().UnixNano()),
			PasswordHash:      "hashed",
			FullName:          "Teacher 7 SC1",
			Role:              "teacher",
			Grade:             "7",
			Status:            "active",
			CommissionBalance: 0,
		}
		require.NoError(t, db.Create(&teacher7).Error)

		student := models.User{
			Email:        fmt.Sprintf("student_sc1_%d@example.com", time.Now().UnixNano()),
			PasswordHash: "hashed",
			FullName:     "Student SC1",
			Role:         "student",
			Grade:        "7",
			Status:       "active",
			ReferrerID:   nil,
		}
		require.NoError(t, db.Create(&student).Error)

		orderCode := time.Now().UnixNano() / 1000
		tx := models.Transaction{
			UserID:    student.ID,
			OrderCode: orderCode,
			Amount:    100000,
			Plan:      "1_month",
			Status:    "pending",
		}
		require.NoError(t, db.Create(&tx).Error)

		w := sendPayOSWebhookReq(router, payosService, orderCode, 100000)
		assert.Equal(t, http.StatusOK, w.Code)

		// Teacher 7 receives 3% = 3,000
		var updatedT7 models.User
		require.NoError(t, db.First(&updatedT7, "id = ?", teacher7.ID).Error)
		assert.Equal(t, int64(3000), updatedT7.CommissionBalance)

		// Admin receives 1% = 1,000
		var updatedAdmin models.User
		require.NoError(t, db.First(&updatedAdmin, "id = ?", admin.ID).Error)
		assert.Equal(t, int64(1000), updatedAdmin.CommissionBalance)

		// Exactly 2 commission transactions
		var commTxs []models.CommissionTransaction
		require.NoError(t, db.Where("order_code = ?", orderCode).Find(&commTxs).Error)
		assert.Len(t, commTxs, 2)
	})

	t.Run("MultiTier_Scenario2_TeacherGrade7DirectReferrer_Gets50Percent_SkipsGradeOverride", func(t *testing.T) {
		admin := models.User{
			Email:             fmt.Sprintf("admin_sc2_%d@example.com", time.Now().UnixNano()),
			PasswordHash:      "hashed",
			FullName:          "Admin SC2",
			Role:              "admin",
			Status:            "active",
			CommissionBalance: 0,
		}
		require.NoError(t, db.Create(&admin).Error)

		teacher7 := models.User{
			Email:             fmt.Sprintf("teacher7_sc2_%d@example.com", time.Now().UnixNano()),
			PasswordHash:      "hashed",
			FullName:          "Teacher 7 SC2",
			Role:              "teacher",
			Grade:             "7",
			Status:            "active",
			CommissionBalance: 0,
		}
		require.NoError(t, db.Create(&teacher7).Error)

		student := models.User{
			Email:        fmt.Sprintf("student_sc2_%d@example.com", time.Now().UnixNano()),
			PasswordHash: "hashed",
			FullName:     "Student SC2",
			Role:         "student",
			Grade:        "7",
			Status:       "active",
			ReferrerID:   &teacher7.ID,
		}
		require.NoError(t, db.Create(&student).Error)

		orderCode := time.Now().UnixNano() / 1000
		tx := models.Transaction{
			UserID:    student.ID,
			OrderCode: orderCode,
			Amount:    100000,
			Plan:      "1_month",
			Status:    "pending",
		}
		require.NoError(t, db.Create(&tx).Error)

		w := sendPayOSWebhookReq(router, payosService, orderCode, 100000)
		assert.Equal(t, http.StatusOK, w.Code)

		// Teacher 7 receives 50% = 50,000 (3% skipped)
		var updatedT7 models.User
		require.NoError(t, db.First(&updatedT7, "id = ?", teacher7.ID).Error)
		assert.Equal(t, int64(50000), updatedT7.CommissionBalance)

		// Admin receives 1% = 1,000
		var updatedAdmin models.User
		require.NoError(t, db.First(&updatedAdmin, "id = ?", admin.ID).Error)
		assert.Equal(t, int64(1000), updatedAdmin.CommissionBalance)

		// Exactly 2 commission transactions
		var commTxs []models.CommissionTransaction
		require.NoError(t, db.Where("order_code = ?", orderCode).Find(&commTxs).Error)
		assert.Len(t, commTxs, 2)
	})

	t.Run("MultiTier_Scenario3_TeacherGrade8Referrer_Grade7Student_Gets50PercentAndTeacher7Gets3PercentAndAdmin1Percent", func(t *testing.T) {
		admin := models.User{
			Email:             fmt.Sprintf("admin_sc3_%d@example.com", time.Now().UnixNano()),
			PasswordHash:      "hashed",
			FullName:          "Admin SC3",
			Role:              "admin",
			Status:            "active",
			CommissionBalance: 0,
		}
		require.NoError(t, db.Create(&admin).Error)

		teacher7 := models.User{
			Email:             fmt.Sprintf("teacher7_sc3_%d@example.com", time.Now().UnixNano()),
			PasswordHash:      "hashed",
			FullName:          "Teacher 7 SC3",
			Role:              "teacher",
			Grade:             "7",
			Status:            "active",
			CommissionBalance: 0,
		}
		require.NoError(t, db.Create(&teacher7).Error)

		teacher8 := models.User{
			Email:             fmt.Sprintf("teacher8_sc3_%d@example.com", time.Now().UnixNano()),
			PasswordHash:      "hashed",
			FullName:          "Teacher 8 SC3",
			Role:              "teacher",
			Grade:             "8",
			Status:            "active",
			CommissionBalance: 0,
		}
		require.NoError(t, db.Create(&teacher8).Error)

		student := models.User{
			Email:        fmt.Sprintf("student_sc3_%d@example.com", time.Now().UnixNano()),
			PasswordHash: "hashed",
			FullName:     "Student SC3",
			Role:         "student",
			Grade:        "7",
			Status:       "active",
			ReferrerID:   &teacher8.ID,
		}
		require.NoError(t, db.Create(&student).Error)

		orderCode := time.Now().UnixNano() / 1000
		tx := models.Transaction{
			UserID:    student.ID,
			OrderCode: orderCode,
			Amount:    100000,
			Plan:      "1_month",
			Status:    "pending",
		}
		require.NoError(t, db.Create(&tx).Error)

		w := sendPayOSWebhookReq(router, payosService, orderCode, 100000)
		assert.Equal(t, http.StatusOK, w.Code)

		// Teacher 8 receives 50% = 50,000
		var updatedT8 models.User
		require.NoError(t, db.First(&updatedT8, "id = ?", teacher8.ID).Error)
		assert.Equal(t, int64(50000), updatedT8.CommissionBalance)

		// Teacher 7 receives 3% = 3,000
		var updatedT7 models.User
		require.NoError(t, db.First(&updatedT7, "id = ?", teacher7.ID).Error)
		assert.Equal(t, int64(3000), updatedT7.CommissionBalance)

		// Admin receives 1% = 1,000
		var updatedAdmin models.User
		require.NoError(t, db.First(&updatedAdmin, "id = ?", admin.ID).Error)
		assert.Equal(t, int64(1000), updatedAdmin.CommissionBalance)

		// Exactly 3 commission transactions
		var commTxs []models.CommissionTransaction
		require.NoError(t, db.Where("order_code = ?", orderCode).Find(&commTxs).Error)
		assert.Len(t, commTxs, 3)
	})

	t.Run("MultiTier_Scenario4_AdminDirectReferrer_Gets60Percent_SkipsPlatformOverride", func(t *testing.T) {
		admin := models.User{
			Email:             fmt.Sprintf("admin_sc4_%d@example.com", time.Now().UnixNano()),
			PasswordHash:      "hashed",
			FullName:          "Admin SC4",
			Role:              "admin",
			Status:            "active",
			CommissionBalance: 0,
		}
		require.NoError(t, db.Create(&admin).Error)

		teacher7 := models.User{
			Email:             fmt.Sprintf("teacher7_sc4_%d@example.com", time.Now().UnixNano()),
			PasswordHash:      "hashed",
			FullName:          "Teacher 7 SC4",
			Role:              "teacher",
			Grade:             "7",
			Status:            "active",
			CommissionBalance: 0,
		}
		require.NoError(t, db.Create(&teacher7).Error)

		student := models.User{
			Email:        fmt.Sprintf("student_sc4_%d@example.com", time.Now().UnixNano()),
			PasswordHash: "hashed",
			FullName:     "Student SC4",
			Role:         "student",
			Grade:        "7",
			Status:       "active",
			ReferrerID:   &admin.ID,
		}
		require.NoError(t, db.Create(&student).Error)

		orderCode := time.Now().UnixNano() / 1000
		tx := models.Transaction{
			UserID:    student.ID,
			OrderCode: orderCode,
			Amount:    100000,
			Plan:      "1_month",
			Status:    "pending",
		}
		require.NoError(t, db.Create(&tx).Error)

		w := sendPayOSWebhookReq(router, payosService, orderCode, 100000)
		assert.Equal(t, http.StatusOK, w.Code)

		// Admin receives 60% = 60,000 (1% skipped)
		var updatedAdmin models.User
		require.NoError(t, db.First(&updatedAdmin, "id = ?", admin.ID).Error)
		assert.Equal(t, int64(60000), updatedAdmin.CommissionBalance)

		// Teacher 7 receives 3% = 3,000
		var updatedT7 models.User
		require.NoError(t, db.First(&updatedT7, "id = ?", teacher7.ID).Error)
		assert.Equal(t, int64(3000), updatedT7.CommissionBalance)

		// Exactly 2 commission transactions
		var commTxs []models.CommissionTransaction
		require.NoError(t, db.Where("order_code = ?", orderCode).Find(&commTxs).Error)
		assert.Len(t, commTxs, 2)
	})

	t.Run("MultiTier_Scenario5_AffiliateDirectReferrer_Gets30Percent", func(t *testing.T) {
		admin := models.User{
			Email:             fmt.Sprintf("admin_sc5_%d@example.com", time.Now().UnixNano()),
			PasswordHash:      "hashed",
			FullName:          "Admin SC5",
			Role:              "admin",
			Status:            "active",
			CommissionBalance: 0,
		}
		require.NoError(t, db.Create(&admin).Error)

		teacher7 := models.User{
			Email:             fmt.Sprintf("teacher7_sc5_%d@example.com", time.Now().UnixNano()),
			PasswordHash:      "hashed",
			FullName:          "Teacher 7 SC5",
			Role:              "teacher",
			Grade:             "7",
			Status:            "active",
			CommissionBalance: 0,
		}
		require.NoError(t, db.Create(&teacher7).Error)

		affiliate := models.User{
			Email:             fmt.Sprintf("affiliate_sc5_%d@example.com", time.Now().UnixNano()),
			PasswordHash:      "hashed",
			FullName:          "Affiliate SC5",
			Role:              "affiliate",
			Status:            "active",
			CommissionBalance: 0,
		}
		require.NoError(t, db.Create(&affiliate).Error)

		student := models.User{
			Email:        fmt.Sprintf("student_sc5_%d@example.com", time.Now().UnixNano()),
			PasswordHash: "hashed",
			FullName:     "Student SC5",
			Role:         "student",
			Grade:        "7",
			Status:       "active",
			ReferrerID:   &affiliate.ID,
		}
		require.NoError(t, db.Create(&student).Error)

		orderCode := time.Now().UnixNano() / 1000
		tx := models.Transaction{
			UserID:    student.ID,
			OrderCode: orderCode,
			Amount:    100000,
			Plan:      "1_month",
			Status:    "pending",
		}
		require.NoError(t, db.Create(&tx).Error)

		w := sendPayOSWebhookReq(router, payosService, orderCode, 100000)
		assert.Equal(t, http.StatusOK, w.Code)

		// Affiliate receives 30% = 30,000
		var updatedAff models.User
		require.NoError(t, db.First(&updatedAff, "id = ?", affiliate.ID).Error)
		assert.Equal(t, int64(30000), updatedAff.CommissionBalance)

		// Teacher 7 receives 3% = 3,000
		var updatedT7 models.User
		require.NoError(t, db.First(&updatedT7, "id = ?", teacher7.ID).Error)
		assert.Equal(t, int64(3000), updatedT7.CommissionBalance)

		// Admin receives 1% = 1,000
		var updatedAdmin models.User
		require.NoError(t, db.First(&updatedAdmin, "id = ?", admin.ID).Error)
		assert.Equal(t, int64(1000), updatedAdmin.CommissionBalance)

		// Exactly 3 commission transactions
		var commTxs []models.CommissionTransaction
		require.NoError(t, db.Where("order_code = ?", orderCode).Find(&commTxs).Error)
		assert.Len(t, commTxs, 3)
	})
}
