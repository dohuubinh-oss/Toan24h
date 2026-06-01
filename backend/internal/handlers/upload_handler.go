package handlers

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// UploadTempImage xử lý upload ảnh vào thư mục tạm thời
func UploadTempImage(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file uploaded"})
		return
	}

	// Kiểm tra dung lượng (Max 5MB)
	if file.Size > 5*1024*1024 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File size exceeds 5MB limit"})
		return
	}

	// Kiểm tra định dạng (Chỉ cho phép jpg, jpeg, png, webp)
	ext := strings.ToLower(filepath.Ext(file.Filename))
	if ext != ".jpg" && ext != ".jpeg" && ext != ".png" && ext != ".webp" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid file format, only jpg, jpeg, png, webp allowed"})
		return
	}

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
