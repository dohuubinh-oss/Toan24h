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

	t.Run("EducationServiceTaxStrategy_ConstantsAndNaming", func(t *testing.T) {
		// Category & VAT policy for 2% PIT education service tax regime
		assert.Contains(t, handlers.EducationServiceCategory, "Dịch vụ hỗ trợ giáo dục")
		assert.Contains(t, handlers.EducationServiceCategory, "Khóa học trực tuyến")
		assert.Contains(t, handlers.EducationServiceVATPolicy, "Không chịu thuế GTGT")
		assert.Contains(t, handlers.EducationServiceVATPolicy, "Khoản 13 Điều 5 Luật Thuế GTGT")

		// Plan names should use "Khóa học trực tuyến & Dịch vụ hỗ trợ giáo dục"
		plans := []string{"1_month", "3_months", "9_months", "1_year", "12_months"}
		for _, p := range plans {
			serviceName := handlers.GetPlanEducationServiceName(p)
			assert.Contains(t, serviceName, "Khóa học trực tuyến")
			assert.Contains(t, serviceName, "Dịch vụ hỗ trợ giáo dục")

			// Must NOT contain digital software / goods keywords (which trigger 7% tax)
			assert.NotContains(t, serviceName, "phần mềm")
			assert.NotContains(t, serviceName, "tài liệu số")
			assert.NotContains(t, serviceName, "sản phẩm số")
		}
	})

	t.Run("CreatePaymentRequest_WithTermsAgreedAt", func(t *testing.T) {
		body, _ := json.Marshal(map[string]interface{}{
			"plan":          "3_months",
			"termsAgreedAt": "2026-11-16T12:00:00Z",
		})
		var req handlers.CreatePaymentRequest
		err := json.Unmarshal(body, &req)
		assert.NoError(t, err)
		assert.Equal(t, "3_months", req.Plan)
		assert.NotNil(t, req.TermsAgreedAt)
	})
}
