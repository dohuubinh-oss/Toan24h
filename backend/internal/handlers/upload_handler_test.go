package handlers_test

import (
	"bytes"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"testing"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/modeptrai/exam-model-backend/internal/routes"
)

func TestUploadTempImage(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := routes.SetupRouter()

	// Ensure temp directory exists for testing, but let's mock the request
	os.MkdirAll("../../uploads/temp", 0755)

	body := new(bytes.Buffer)
	writer := multipart.NewWriter(body)
	
	// Create a dummy file
	part, err := writer.CreateFormFile("file", "test.jpg")
	if err != nil {
		t.Fatal(err)
	}
	part.Write([]byte("dummy image content"))
	writer.Close()

	req, _ := http.NewRequest("POST", "/api/v1/uploads/temp", body)
	req.Header.Set("Content-Type", writer.FormDataContentType())

	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("Expected status 201 Created, got %d. Body: %s", w.Code, w.Body.String())
	}
}
