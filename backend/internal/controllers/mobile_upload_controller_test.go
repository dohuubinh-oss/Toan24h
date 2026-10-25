package controllers_test

import (
	"bytes"
	"encoding/json"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/modeptrai/exam-model-backend/internal/controllers"
	"github.com/modeptrai/exam-model-backend/internal/services"
	"github.com/stretchr/testify/assert"
)

func mockExtractor(text string) controllers.TextExtractorFunc {
	return func(fileBytes []byte, mimeType string) (*services.OCRResult, error) {
		return &services.OCRResult{Text: text}, nil
	}
}

var validJpegHeader = []byte{0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01}

func TestMobileUpload_MagicBytesValidation(t *testing.T) {
	gin.SetMode(gin.TestMode)
	ctrl := controllers.NewMobileUploadController()
	ctrl.SetExtractor(mockExtractor("fake ocr"))

	r := gin.New()
	r.POST("/api/v1/mobile-upload/:sessionId", ctrl.UploadFromMobile)

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
	ctrl := controllers.NewMobileUploadController()
	ctrl.SetExtractor(mockExtractor("test ocr result"))

	r := gin.New()
	r.POST("/api/v1/mobile-upload/:sessionId", ctrl.UploadFromMobile)

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
	ctrl := controllers.NewMobileUploadController()
	count := 0
	ctrl.SetExtractor(func(fileBytes []byte, mimeType string) (*services.OCRResult, error) {
		count++
		if count == 1 {
			return &services.OCRResult{Text: "Nội dung trang 1"}, nil
		}
		return &services.OCRResult{Text: "Nội dung trang 2"}, nil
	})

	r := gin.New()
	r.POST("/api/v1/mobile-upload/:sessionId", ctrl.UploadFromMobile)
	r.GET("/api/v1/mobile-upload/:sessionId", ctrl.CheckUploadStatus)

	sessionID := "session-multipage"

	// Upload page 1
	body1 := new(bytes.Buffer)
	w1 := multipart.NewWriter(body1)
	p1, _ := w1.CreateFormFile("file", "p1.jpg")
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
	p2, _ := w2.CreateFormFile("file", "p2.jpg")
	p2.Write(validJpegHeader)
	w2.Close()

	req2, _ := http.NewRequest("POST", "/api/v1/mobile-upload/"+sessionID, body2)
	req2.Header.Set("Content-Type", w2.FormDataContentType())
	rec2 := httptest.NewRecorder()
	r.ServeHTTP(rec2, req2)
	assert.Equal(t, http.StatusOK, rec2.Code)

	// Check status: should contain both pages
	checkReq, _ := http.NewRequest("GET", "/api/v1/mobile-upload/"+sessionID, nil)
	checkRec := httptest.NewRecorder()
	r.ServeHTTP(checkRec, checkReq)

	assert.Equal(t, http.StatusOK, checkRec.Code)
	var resp map[string]interface{}
	err := json.Unmarshal(checkRec.Body.Bytes(), &resp)
	assert.NoError(t, err)
	assert.Equal(t, "completed", resp["status"])

	text := resp["text"].(string)
	assert.Contains(t, text, "Nội dung trang 1")
	assert.Contains(t, text, "Trang 2")
	assert.Contains(t, text, "Nội dung trang 2")
}

func TestMobileUpload_TTL_Expiration(t *testing.T) {
	gin.SetMode(gin.TestMode)
	ctrl := controllers.NewMobileUploadController()
	ctrl.SetExtractor(mockExtractor("some text"))

	sessionID := "expired-session"
	// Manually inject expired session
	ctrl.InjectSessionForTest(sessionID, "cũ", time.Now().Add(-11*time.Minute))

	r := gin.New()
	r.GET("/api/v1/mobile-upload/:sessionId", ctrl.CheckUploadStatus)

	checkReq, _ := http.NewRequest("GET", "/api/v1/mobile-upload/"+sessionID, nil)
	checkRec := httptest.NewRecorder()
	r.ServeHTTP(checkRec, checkReq)

	assert.Equal(t, http.StatusOK, checkRec.Code)
	var resp map[string]interface{}
	err := json.Unmarshal(checkRec.Body.Bytes(), &resp)
	assert.NoError(t, err)
	assert.Equal(t, "expired", resp["status"])
}

func TestMobileUpload_DiagramTemp(t *testing.T) {
	gin.SetMode(gin.TestMode)
	ctrl := controllers.NewMobileUploadController()

	r := gin.New()
	r.POST("/api/v1/mobile-upload/:sessionId", ctrl.UploadFromMobile)
	r.GET("/api/v1/mobile-upload/:sessionId", ctrl.CheckUploadStatus)

	sessionID := "session-diagram-test"

	body := new(bytes.Buffer)
	writer := multipart.NewWriter(body)
	part, _ := writer.CreateFormFile("file", "diagram.jpg")
	part.Write(validJpegHeader)
	part.Write([]byte("fake diagram image payload"))
	writer.Close()

	req, _ := http.NewRequest("POST", "/api/v1/mobile-upload/"+sessionID+"?type=diagram", body)
	req.Header.Set("Content-Type", writer.FormDataContentType())
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	var uploadResp map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &uploadResp)
	assert.NoError(t, err)

	diagramUrl, ok := uploadResp["diagramUrl"].(string)
	assert.True(t, ok, "Expected diagramUrl in response")
	assert.Contains(t, diagramUrl, "/uploads/temp/session-diagram-test_diagram")

	// Verify CheckUploadStatus returns the diagramUrl
	checkReq, _ := http.NewRequest("GET", "/api/v1/mobile-upload/"+sessionID, nil)
	checkW := httptest.NewRecorder()
	r.ServeHTTP(checkW, checkReq)

	assert.Equal(t, http.StatusOK, checkW.Code)
	var checkResp map[string]interface{}
	err = json.Unmarshal(checkW.Body.Bytes(), &checkResp)
	assert.NoError(t, err)
	assert.Equal(t, "completed", checkResp["status"])
	assert.Equal(t, diagramUrl, checkResp["diagramUrl"])
}

