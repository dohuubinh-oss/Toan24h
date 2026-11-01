package handlers_test

import (
	"bytes"
	"encoding/json"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/modeptrai/exam-model-backend/internal/handlers"
	"github.com/modeptrai/exam-model-backend/internal/services"
	"github.com/stretchr/testify/assert"
)

func mockExtractor(text string) handlers.TextExtractorFunc {
	return func(fileBytes []byte, mimeType string) (*services.OCRResult, error) {
		return &services.OCRResult{Text: text}, nil
	}
}

var validJpegHeader = []byte{0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01}

func TestMobileUpload_MagicBytesValidation(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := handlers.NewMobileUploadHandler()
	h.SetExtractor(mockExtractor("fake ocr"))

	r := gin.New()
	r.POST("/api/v1/mobile-upload/:sessionId", h.UploadFromMobile)

	body := new(bytes.Buffer)
	writer := multipart.NewWriter(body)
	part, _ := writer.CreateFormFile("file", "photo.jpg")
	part.Write([]byte("not a real image"))
	writer.Close()

	req, _ := http.NewRequest("POST", "/api/v1/mobile-upload/session-1", body)
	req.Header.Set("Content-Type", writer.FormDataContentType())
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	assert.Contains(t, w.Body.String(), "không hợp lệ")
}

func TestMobileUpload_RateLimit(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := handlers.NewMobileUploadHandler()
	h.SetExtractor(mockExtractor("test ocr result"))

	r := gin.New()
	r.POST("/api/v1/mobile-upload/:sessionId", h.UploadFromMobile)

	sessionID := "session-rate-limit"

	// Make 5 successful uploads
	for i := 0; i < 5; i++ {
		body := new(bytes.Buffer)
		writer := multipart.NewWriter(body)
		part, _ := writer.CreateFormFile("file", "photo.jpg")
		part.Write(validJpegHeader)
		writer.Close()

		req, _ := http.NewRequest("POST", "/api/v1/mobile-upload/"+sessionID, body)
		req.Header.Set("Content-Type", writer.FormDataContentType())
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code, "Request %d should succeed", i+1)
	}

	// 6th request within 1 min should be rate limited (429)
	body := new(bytes.Buffer)
	writer := multipart.NewWriter(body)
	part, _ := writer.CreateFormFile("file", "photo.jpg")
	part.Write(validJpegHeader)
	writer.Close()

	req, _ := http.NewRequest("POST", "/api/v1/mobile-upload/"+sessionID, body)
	req.Header.Set("Content-Type", writer.FormDataContentType())
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusTooManyRequests, w.Code)
}

func TestMobileUpload_MultiPageAppend(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := handlers.NewMobileUploadHandler()
	count := 0
	h.SetExtractor(func(fileBytes []byte, mimeType string) (*services.OCRResult, error) {
		count++
		if count == 1 {
			return &services.OCRResult{Text: "Nội dung trang 1"}, nil
		}
		return &services.OCRResult{Text: "Nội dung trang 2"}, nil
	})

	r := gin.New()
	r.POST("/api/v1/mobile-upload/:sessionId", h.UploadFromMobile)
	r.GET("/api/v1/mobile-upload/:sessionId/status", h.CheckUploadStatus)

	sessionID := "session-multipage"

	// Upload page 1
	body1 := new(bytes.Buffer)
	w1 := multipart.NewWriter(body1)
	p1, _ := w1.CreateFormFile("file", "page1.jpg")
	p1.Write(validJpegHeader)
	w1.Close()

	req1, _ := http.NewRequest("POST", "/api/v1/mobile-upload/"+sessionID, body1)
	req1.Header.Set("Content-Type", w1.FormDataContentType())
	rec1 := httptest.NewRecorder()
	r.ServeHTTP(rec1, req1)
	assert.Equal(t, http.StatusOK, rec1.Code)

	// Upload page 2
	body2 := new(bytes.Buffer)
	w2 := multipart.NewWriter(body2)
	p2, _ := w2.CreateFormFile("file", "page2.jpg")
	p2.Write(validJpegHeader)
	w2.Close()

	req2, _ := http.NewRequest("POST", "/api/v1/mobile-upload/"+sessionID, body2)
	req2.Header.Set("Content-Type", w2.FormDataContentType())
	rec2 := httptest.NewRecorder()
	r.ServeHTTP(rec2, req2)
	assert.Equal(t, http.StatusOK, rec2.Code)

	// Check status
	reqStatus, _ := http.NewRequest("GET", "/api/v1/mobile-upload/"+sessionID+"/status", nil)
	recStatus := httptest.NewRecorder()
	r.ServeHTTP(recStatus, reqStatus)
	assert.Equal(t, http.StatusOK, recStatus.Code)

	var res map[string]interface{}
	err := json.Unmarshal(recStatus.Body.Bytes(), &res)
	assert.NoError(t, err)
	assert.Equal(t, "completed", res["status"])
	assert.Equal(t, float64(2), res["pageCount"])
	assert.Contains(t, res["text"], "Nội dung trang 1")
	assert.Contains(t, res["text"], "--- Trang 2 ---")
	assert.Contains(t, res["text"], "Nội dung trang 2")
}

func TestMobileUpload_TTL_Expiry(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := handlers.NewMobileUploadHandler()

	r := gin.New()
	r.GET("/api/v1/mobile-upload/:sessionId/status", h.CheckUploadStatus)

	sessionID := "session-expired"
	// Giả lập phiên tạo từ 11 phút trước
	h.InjectSessionForTest(sessionID, "Old text", time.Now().Add(-11*time.Minute))

	req, _ := http.NewRequest("GET", "/api/v1/mobile-upload/"+sessionID+"/status", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	var res map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &res)
	assert.Equal(t, "expired", res["status"])
}
