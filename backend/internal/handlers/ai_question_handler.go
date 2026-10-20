package handlers

import (
	"io"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/modeptrai/exam-model-backend/internal/services"
	"github.com/modeptrai/exam-model-backend/internal/utils"
)

// ExtractAIQuestions handles multi-image question extraction using Gemini Vision
func ExtractAIQuestions(c *gin.Context) {
	form, err := c.MultipartForm()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Không tìm thấy dữ liệu form ảnh"})
		return
	}

	files := form.File["files"]
	if len(files) == 0 {
		// Fallback check for single "file" field
		if singleFile, ok := form.File["file"]; ok && len(singleFile) > 0 {
			files = singleFile
		} else {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Vui lòng chọn ít nhất 1 ảnh đề thi"})
			return
		}
	}

	if len(files) > 10 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Chỉ được tải lên tối đa 10 ảnh cùng lúc"})
		return
	}

	var fileBytesList [][]byte
	var mimeTypes []string
	var totalSize int64

	for _, fileHeader := range files {
		totalSize += fileHeader.Size
		if totalSize > 25*1024*1024 { // 25MB total limit
			c.JSON(http.StatusBadRequest, gin.H{"error": "Tổng dung lượng ảnh vượt quá 25MB"})
			return
		}

		f, err := fileHeader.Open()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi khi mở file ảnh: " + err.Error()})
			return
		}

		bytes, err := io.ReadAll(f)
		f.Close()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi khi đọc dữ liệu ảnh: " + err.Error()})
			return
		}

		// Kiểm tra Magic Bytes nhị phân để ngăn chặn tập tin giả mạo/độc hại
		if err := utils.ValidateImageBytes(bytes, utils.DefaultImageValidationOptions); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Ảnh không hợp lệ (" + fileHeader.Filename + "): " + err.Error()})
			return
		}

		mime := fileHeader.Header.Get("Content-Type")
		if mime == "" {
			mime = "image/jpeg"
		}

		fileBytesList = append(fileBytesList, bytes)
		mimeTypes = append(mimeTypes, mime)
	}

	targetGrade := ""
	if gradeVals, ok := form.Value["grade"]; ok && len(gradeVals) > 0 {
		targetGrade = gradeVals[0]
	} else {
		targetGrade = c.PostForm("grade")
	}

	blocks, err := services.ExtractQuestionsFromImages(fileBytesList, mimeTypes, targetGrade)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Bóc tách câu hỏi thất bại: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data":   blocks,
	})
}
