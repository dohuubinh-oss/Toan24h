package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/modeptrai/exam-model-backend/internal/services"
	"github.com/stretchr/testify/assert"
)

func TestFAQChatHandler_Validation(t *testing.T) {
	gin.SetMode(gin.TestMode)
	ragService := services.NewFAQRagService(nil)
	handler := NewFAQChatHandler(ragService)

	t.Run("Empty message returns 400", func(t *testing.T) {
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)

		body := bytes.NewBufferString(`{"message": "   "}`)
		c.Request = httptest.NewRequest("POST", "/api/v1/chat/faq", body)
		c.Request.Header.Set("Content-Type", "application/json")

		handler.HandleChatFAQ(c)
		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	t.Run("Too long message returns 400", func(t *testing.T) {
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)

		longMsg := strings.Repeat("A", 501)
		reqBytes, _ := json.Marshal(map[string]string{"message": longMsg})
		c.Request = httptest.NewRequest("POST", "/api/v1/chat/faq", bytes.NewBuffer(reqBytes))
		c.Request.Header.Set("Content-Type", "application/json")

		handler.HandleChatFAQ(c)
		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	t.Run("Valid message succeeds", func(t *testing.T) {
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)

		reqBytes, _ := json.Marshal(map[string]string{"message": "Gói VIP giá bao nhiêu?"})
		c.Request = httptest.NewRequest("POST", "/api/v1/chat/faq", bytes.NewBuffer(reqBytes))
		c.Request.Header.Set("Content-Type", "application/json")

		handler.HandleChatFAQ(c)
		assert.Equal(t, http.StatusOK, w.Code)
		assert.Contains(t, w.Body.String(), `"success":true`)
	})
}
