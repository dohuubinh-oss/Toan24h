package handlers_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/modeptrai/exam-model-backend/internal/routes"
	"github.com/modeptrai/exam-model-backend/internal/utils"
	"github.com/stretchr/testify/assert"
)

func TestRefineGeometryDiagram_RequiresAuth(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := routes.SetupRouter()

	payload, _ := json.Marshal(map[string]string{
		"content": "Cho tam giác ABC vuông tại A",
	})
	req, _ := http.NewRequest("POST", "/api/v1/questions/refine-diagram-svg", bytes.NewBuffer(payload))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestRefineGeometryDiagram_EmptyValidation(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := routes.SetupRouter()

	payload, _ := json.Marshal(map[string]string{
		"content":        "",
		"solution_guide": "",
		"custom_prompt":  "",
	})
	req, _ := http.NewRequest("POST", "/api/v1/questions/refine-diagram-svg", bytes.NewBuffer(payload))
	req.Header.Set("Content-Type", "application/json")

	token, _ := utils.GenerateAccessToken(uuid.New(), "teacher", "12")
	req.Header.Set("Authorization", "Bearer "+token)

	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	assert.Contains(t, w.Body.String(), "Vui lòng cung cấp nội dung đề bài")
}
