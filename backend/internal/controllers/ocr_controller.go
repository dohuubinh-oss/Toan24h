package controllers

import (
	"io"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/modeptrai/exam-model-backend/internal/services"
	"github.com/modeptrai/exam-model-backend/internal/utils"
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

	// Limit file size to 10MB to prevent DoS RAM exhaustion
	if header.Size > 10*1024*1024 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File ảnh vượt quá dung lượng tối đa 10MB"})
		return
	}

	// Read file bytes
	fileBytes, err := io.ReadAll(file)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi khi đọc file ảnh"})
		return
	}

	// Validate actual binary magic bytes
	if err := utils.ValidateImageBytes(fileBytes, utils.MobileImageValidationOptions); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Định dạng file không hợp lệ hoặc bị hỏng (chỉ chấp nhận ảnh PNG/JPEG/WEBP): " + err.Error()})
		return
	}

	mimeType := http.DetectContentType(fileBytes)
	if mimeType == "application/octet-stream" && len(fileBytes) >= 12 && string(fileBytes[0:4]) == "RIFF" && string(fileBytes[8:12]) == "WEBP" {
		mimeType = "image/webp"
	}

	// Call OCR Service
	result, err := services.ExtractTextFromImageWithGemini(fileBytes, mimeType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Đã xảy ra lỗi trong quá trình nhận dạng ảnh"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"text": result.Text})
}
