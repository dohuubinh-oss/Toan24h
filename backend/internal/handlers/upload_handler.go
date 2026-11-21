package handlers

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/modeptrai/exam-model-backend/internal/utils"
)

// UploadTempImage xử lý upload ảnh vào thư mục tạm thời sau khi đã giải mã và khử mã độc
func UploadTempImage(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file uploaded"})
		return
	}

	// 1. Kiểm tra dung lượng (Max 5MB), định dạng và chữ ký nhị phân (Magic Bytes)
	if err := utils.ValidateImageHeader(file, utils.DefaultImageValidationOptions); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	srcFile, err := file.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to open uploaded file"})
		return
	}
	defer srcFile.Close()

	fileBytes, err := io.ReadAll(srcFile)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read uploaded file"})
		return
	}

	// 2. Khử mã độc (Webshell, polyglot PHP, EXIF metadata backdoor) & nén ảnh
	// Quá trình này đọc pixel thực tế và tái mã hóa toàn bộ dữ liệu, triệt tiêu mọi mã độc ẩn giấu
	sanitizedBytes, err := utils.SanitizeAndCompressImage(fileBytes, 1920)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Ảnh không hợp lệ hoặc chứa dữ liệu hỏng: " + err.Error()})
		return
	}

	// 3. Đặt tên an toàn hoàn toàn bằng UUID .jpg, không dùng tên file gốc từ client
	newFileName := uuid.New().String() + ".jpg"
	tempDir := "./uploads/temp"

	if err := os.MkdirAll(tempDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create temp directory"})
		return
	}

	dst := filepath.Join(tempDir, newFileName)
	if err := os.WriteFile(dst, sanitizedBytes, 0644); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save sanitized file"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"status": "success",
		"data": map[string]string{
			"url": fmt.Sprintf("/uploads/temp/%s", newFileName),
		},
	})
}
