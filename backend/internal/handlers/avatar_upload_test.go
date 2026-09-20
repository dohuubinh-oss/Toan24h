package handlers

import (
	"bytes"
	"encoding/json"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

func TestUploadAvatarValidation(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()

	handler := &UserHandler{}

	r.POST("/api/v1/users/me/avatar", func(c *gin.Context) {
		c.Set("userID", uuid.New().String())
		handler.UploadAvatar(c)
	})

	// Request without file
	req, _ := http.NewRequest(http.MethodPost, "/api/v1/users/me/avatar", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestUploadAvatarInvalidFormat(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()

	handler := &UserHandler{}

	r.POST("/api/v1/users/me/avatar", func(c *gin.Context) {
		c.Set("userID", uuid.New().String())
		handler.UploadAvatar(c)
	})

	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)
	part, _ := writer.CreateFormFile("file", "test.txt")
	part.Write([]byte("not an image"))
	writer.Close()

	req, _ := http.NewRequest(http.MethodPost, "/api/v1/users/me/avatar", body)
	req.Header.Set("Content-Type", writer.FormDataContentType())
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	assert.Contains(t, resp["error"], "Invalid file format")
}
