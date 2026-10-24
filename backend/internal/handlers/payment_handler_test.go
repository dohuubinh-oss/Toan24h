package handlers_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/modeptrai/exam-model-backend/internal/handlers"
	"github.com/stretchr/testify/assert"
)

func TestPaymentHandler_ValidationAndAuth(t *testing.T) {
	gin.SetMode(gin.TestMode)

	payosService := handlers.NewPayOSService("", "", "")
	paymentHandler := handlers.NewPaymentHandler(nil, payosService)

	r := gin.New()

	// Endpoints without user context (Unauthorized tests)
	r.POST("/api/v1/payments/create", paymentHandler.CreatePayment)
	r.GET("/api/v1/payments/status/:orderCode", paymentHandler.GetPaymentStatus)
	r.GET("/api/v1/payments/my-transactions", paymentHandler.GetMyTransactions)

	t.Run("CreatePayment_Unauthorized", func(t *testing.T) {
		body, _ := json.Marshal(map[string]string{"plan": "3_months"})
		req, _ := http.NewRequest(http.MethodPost, "/api/v1/payments/create", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusUnauthorized, w.Code)
	})

	t.Run("GetPaymentStatus_Unauthorized", func(t *testing.T) {
		req, _ := http.NewRequest(http.MethodGet, "/api/v1/payments/status/123456", nil)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusUnauthorized, w.Code)
	})

	t.Run("GetMyTransactions_Unauthorized", func(t *testing.T) {
		req, _ := http.NewRequest(http.MethodGet, "/api/v1/payments/my-transactions", nil)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusUnauthorized, w.Code)
	})

	// Authenticated router tests for input validation
	authRouter := gin.New()
	authMiddleware := func(c *gin.Context) {
		c.Set("userID", "550e8400-e29b-41d4-a716-446655440000")
		c.Next()
	}
	authRouter.POST("/api/v1/payments/create", authMiddleware, paymentHandler.CreatePayment)
	authRouter.GET("/api/v1/payments/status/:orderCode", authMiddleware, paymentHandler.GetPaymentStatus)

	t.Run("CreatePayment_InvalidPayload", func(t *testing.T) {
		req, _ := http.NewRequest(http.MethodPost, "/api/v1/payments/create", bytes.NewBuffer([]byte("invalid json")))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		authRouter.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	t.Run("CreatePayment_InvalidPlan", func(t *testing.T) {
		body, _ := json.Marshal(map[string]string{"plan": "unknown_plan"})
		req, _ := http.NewRequest(http.MethodPost, "/api/v1/payments/create", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		authRouter.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
		assert.Contains(t, w.Body.String(), "Gói nâng cấp không hợp lệ")
	})

	t.Run("GetPaymentStatus_InvalidOrderCodeFormat", func(t *testing.T) {
		req, _ := http.NewRequest(http.MethodGet, "/api/v1/payments/status/not-a-number-or-uuid", nil)
		w := httptest.NewRecorder()
		authRouter.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
		assert.Contains(t, w.Body.String(), "Invalid orderCode format")
	})
}
