package controllers

import (
	"io"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/modeptrai/exam-model-backend/internal/services"
)

type OCRController struct{}

func NewOCRController() *OCRController {
	return &OCRController{}
}

func (ctrl *OCRController) ExtractText(c *gin.Context) {
	// Receive file from multipart form data
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Không tìm thấy file ảnh"})
		return
	}
	defer file.Close()

	// Read file bytes
	fileBytes, err := io.ReadAll(file)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi khi đọc file ảnh"})
		return
	}

	mimeType := header.Header.Get("Content-Type")
	if mimeType == "" {
		mimeType = "image/jpeg" // Fallback
	}

	// Call OCR Service
	result, err := services.ExtractTextFromImageWithGemini(fileBytes, mimeType)
	if err != nil {
		// Log the error in reality
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Đã xảy ra lỗi trong quá trình nhận dạng ảnh"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"text": result.Text})
}
