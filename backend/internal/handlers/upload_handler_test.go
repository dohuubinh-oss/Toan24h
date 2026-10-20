package handlers_test

import (
	"bytes"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/modeptrai/exam-model-backend/internal/routes"
	"github.com/modeptrai/exam-model-backend/internal/utils"
)

func TestUploadTempImage(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := routes.SetupRouter()

	// Ensure temp directory exists for testing, but let's mock the request
	os.MkdirAll("../../uploads/temp", 0755)

	body := new(bytes.Buffer)
	writer := multipart.NewWriter(body)
	
	// Valid JPEG magic bytes
	validJpegBytes := []byte{0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01}
	part, err := writer.CreateFormFile("file", "test.jpg")
	if err != nil {
		t.Fatal(err)
	}
	part.Write(validJpegBytes)
	writer.Close()

	req, _ := http.NewRequest("POST", "/api/v1/uploads/temp", body)
	req.Header.Set("Content-Type", writer.FormDataContentType())

	userToken, _ := utils.GenerateAccessToken(uuid.New(), "student", "12")
	req.Header.Set("Authorization", "Bearer "+userToken)

	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("Expected status 201 Created, got %d. Body: %s", w.Code, w.Body.String())
	}

	// Negative test: invalid content with .jpg extension
	badBody := new(bytes.Buffer)
	badWriter := multipart.NewWriter(badBody)
	badPart, err := badWriter.CreateFormFile("file", "fake.jpg")
	if err != nil {
		t.Fatal(err)
	}
	badPart.Write([]byte("not an image at all"))
	badWriter.Close()

	badReq, _ := http.NewRequest("POST", "/api/v1/uploads/temp", badBody)
	badReq.Header.Set("Content-Type", badWriter.FormDataContentType())
	badReq.Header.Set("Authorization", "Bearer "+userToken)

	badW := httptest.NewRecorder()
	r.ServeHTTP(badW, badReq)

	if badW.Code != http.StatusBadRequest {
		t.Fatalf("Expected status 400 Bad Request for fake image, got %d", badW.Code)
	}
}
