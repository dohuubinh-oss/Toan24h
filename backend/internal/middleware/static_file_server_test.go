package middleware_test

import (
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/modeptrai/exam-model-backend/internal/middleware"
	"github.com/stretchr/testify/assert"
)

func TestServeUploads(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Create a temp test directory structure
	tmpDir, err := os.MkdirTemp("", "test_uploads_*")
	assert.NoError(t, err)
	defer os.RemoveAll(tmpDir)

	questionsDir := filepath.Join(tmpDir, "questions")
	tempDir := filepath.Join(tmpDir, "temp")
	avatarsDir := filepath.Join(tmpDir, "avatars")
	assert.NoError(t, os.MkdirAll(questionsDir, 0755))
	assert.NoError(t, os.MkdirAll(tempDir, 0755))
	assert.NoError(t, os.MkdirAll(avatarsDir, 0755))

	// Write sample files
	assert.NoError(t, os.WriteFile(filepath.Join(questionsDir, "sample.png"), []byte("pngdata"), 0644))
	assert.NoError(t, os.WriteFile(filepath.Join(tempDir, "temp_img.jpg"), []byte("jpgdata"), 0644))
	assert.NoError(t, os.WriteFile(filepath.Join(avatarsDir, "avt.jpg"), []byte("avtdata"), 0644))

	r := gin.New()
	r.GET("/uploads/*filepath", middleware.ServeUploads(tmpDir))

	t.Run("Permanent asset caching (questions)", func(t *testing.T) {
		req, _ := http.NewRequest("GET", "/uploads/questions/sample.png", nil)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		assert.Equal(t, "nosniff", w.Header().Get("X-Content-Type-Options"))
		assert.Equal(t, "public, max-age=31536000, immutable", w.Header().Get("Cache-Control"))
	})

	t.Run("Permanent asset caching (avatars)", func(t *testing.T) {
		req, _ := http.NewRequest("GET", "/uploads/avatars/avt.jpg", nil)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		assert.Equal(t, "nosniff", w.Header().Get("X-Content-Type-Options"))
		assert.Equal(t, "public, max-age=31536000, immutable", w.Header().Get("Cache-Control"))
	})

	t.Run("Temp upload no-cache header", func(t *testing.T) {
		req, _ := http.NewRequest("GET", "/uploads/temp/temp_img.jpg", nil)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		assert.Equal(t, "nosniff", w.Header().Get("X-Content-Type-Options"))
		assert.Equal(t, "no-cache, no-store, must-revalidate", w.Header().Get("Cache-Control"))
	})

	t.Run("Path traversal prevention", func(t *testing.T) {
		req, _ := http.NewRequest("GET", "/uploads/../secret.txt", nil)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		assert.True(t, w.Code == http.StatusBadRequest || w.Code == http.StatusNotFound)
	})

	t.Run("Non-existent file returns 404", func(t *testing.T) {
		req, _ := http.NewRequest("GET", "/uploads/questions/not_found.png", nil)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusNotFound, w.Code)
	})
}
