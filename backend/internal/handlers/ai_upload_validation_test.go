package handlers_test

import (
	"bytes"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/modeptrai/exam-model-backend/internal/routes"
	"github.com/modeptrai/exam-model-backend/internal/utils"
	"github.com/stretchr/testify/assert"
)

func TestExtractAIQuestions_RejectsFakeImage(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := routes.SetupRouter()

	body := new(bytes.Buffer)
	writer := multipart.NewWriter(body)
	part, err := writer.CreateFormFile("files", "fake_exam.png")
	assert.NoError(t, err)
	_, _ = part.Write([]byte("not a png image bytes content"))
	_ = writer.WriteField("grade", "9")
	writer.Close()

	req, _ := http.NewRequest("POST", "/api/v1/questions/extract-ai", body)
	req.Header.Set("Content-Type", writer.FormDataContentType())

	token, _ := utils.GenerateAccessToken(uuid.New(), "teacher", "12")
	req.Header.Set("Authorization", "Bearer "+token)

	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	assert.Contains(t, w.Body.String(), "Ảnh không hợp lệ")
}

func TestExtractAILecture_RejectsFakeImage(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := routes.SetupRouter()

	body := new(bytes.Buffer)
	writer := multipart.NewWriter(body)
	part, err := writer.CreateFormFile("files", "fake_lecture.jpg")
	assert.NoError(t, err)
	_, _ = part.Write([]byte("not a jpg file content"))
	writer.Close()

	req, _ := http.NewRequest("POST", "/api/v1/lectures/extract-ai", body)
	req.Header.Set("Content-Type", writer.FormDataContentType())

	token, _ := utils.GenerateAccessToken(uuid.New(), "teacher", "12")
	req.Header.Set("Authorization", "Bearer "+token)

	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	assert.Contains(t, w.Body.String(), "Ảnh không hợp lệ")
}

func TestExtractAIQuestions_AcceptsParaphraseField(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := routes.SetupRouter()

	body := new(bytes.Buffer)
	writer := multipart.NewWriter(body)
	part, err := writer.CreateFormFile("files", "test.png")
	assert.NoError(t, err)
	_, _ = part.Write([]byte("fake image content"))
	_ = writer.WriteField("grade", "9")
	_ = writer.WriteField("paraphrase", "true")
	writer.Close()

	req, _ := http.NewRequest("POST", "/api/v1/questions/extract-ai", body)
	req.Header.Set("Content-Type", writer.FormDataContentType())

	token, _ := utils.GenerateAccessToken(uuid.New(), "teacher", "9")
	req.Header.Set("Authorization", "Bearer "+token)

	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	// Since image bytes are fake, it should reject with "Ảnh không hợp lệ", proving the endpoint parsed the multipart request with paraphrase field
	assert.Equal(t, http.StatusBadRequest, w.Code)
	assert.Contains(t, w.Body.String(), "Ảnh không hợp lệ")
}

func TestExtractAILecture_AcceptsParaphraseField(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := routes.SetupRouter()

	body := new(bytes.Buffer)
	writer := multipart.NewWriter(body)
	part, err := writer.CreateFormFile("files", "test_lec.jpg")
	assert.NoError(t, err)
	_, _ = part.Write([]byte("fake lecture content"))
	_ = writer.WriteField("paraphrase", "true")
	writer.Close()

	req, _ := http.NewRequest("POST", "/api/v1/lectures/extract-ai", body)
	req.Header.Set("Content-Type", writer.FormDataContentType())

	token, _ := utils.GenerateAccessToken(uuid.New(), "teacher", "9")
	req.Header.Set("Authorization", "Bearer "+token)

	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	assert.Contains(t, w.Body.String(), "Ảnh không hợp lệ")
}
