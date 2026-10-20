package handlers

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/modeptrai/exam-model-backend/internal/utils"
)

// UploadTempImage xử lý upload ảnh vào thư mục tạm thời
func UploadTempImage(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file uploaded"})
		return
	}

	// Kiểm tra dung lượng, định dạng và chữ ký nhị phân (Magic Bytes)
	if err := utils.ValidateImageHeader(file, utils.DefaultImageValidationOptions); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ext := strings.ToLower(filepath.Ext(file.Filename))

	// Tạo tên file an toàn với UUID
	newFileName := uuid.New().String() + ext
	tempDir := "./uploads/temp"

	// Đảm bảo thư mục tồn tại
	if err := os.MkdirAll(tempDir, os.ModePerm); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create temp directory"})
		return
	}

	dst := filepath.Join(tempDir, newFileName)
	if err := c.SaveUploadedFile(file, dst); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"status": "success",
		"data": map[string]string{
			"url": fmt.Sprintf("/uploads/temp/%s", newFileName),
		},
	})
}
