package services_test

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/stretchr/testify/assert"

	"github.com/modeptrai/exam-model-backend/internal/services"
)

func TestExtractQuestionImageURLs(t *testing.T) {
	html1 := `<p>Câu hỏi 1: Tìm x</p><img src="/uploads/questions/9/image1.png" alt="hinh 1" /><p>Nội dung thêm</p>`
	html2 := `<p>Hướng dẫn giải</p><img src="/uploads/questions/9/image2.jpg" /><img src="/uploads/questions/9/image1.png" />`
	html3 := `<p>Không có ảnh hoặc ảnh khác domain</p><img src="https://example.com/test.png" /><img src="/uploads/avatars/user.png" />`

	urls := services.ExtractQuestionImageURLs(html1, html2, html3)

	assert.Len(t, urls, 2)
	assert.Contains(t, urls, "/uploads/questions/9/image1.png")
	assert.Contains(t, urls, "/uploads/questions/9/image2.jpg")
	assert.NotContains(t, urls, "https://example.com/test.png")
	assert.NotContains(t, urls, "/uploads/avatars/user.png")
}

func TestDeletePhysicalImages(t *testing.T) {
	// Create temporary fake directory structure for testing
	tempDir := filepath.Join(".", "test_uploads_cleanup")
	defer os.RemoveAll(tempDir)

	subDir := filepath.Join(tempDir, "questions", "9")
	err := os.MkdirAll(subDir, 0755)
	assert.NoError(t, err)

	filePath := filepath.Join(subDir, "sample.png")
	err = os.WriteFile(filePath, []byte("fake image data"), 0644)
	assert.NoError(t, err)

	assert.FileExists(t, filePath)

	// Custom base dir deletion
	services.DeletePhysicalImagesWithBaseDir(tempDir, []string{"/uploads/questions/9/sample.png"})

	assert.NoFileExists(t, filePath)
}
