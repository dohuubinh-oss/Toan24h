package handlers

import (
	"io"
	"log"
	"net/http"
	"strings"

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

// RefineGeometryDiagram handles on-demand geometry SVG generation or refinement
func RefineGeometryDiagram(c *gin.Context) {
	var req services.GeometryVisualizerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "error": "Dữ liệu yêu cầu không hợp lệ. Thầy cô vui lòng kiểm tra lại nội dung."})
		return
	}

	if req.Content == "" && req.SolutionGuide == "" && req.CustomPrompt == "" {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "error": "Vui lòng cung cấp nội dung đề bài hoặc lời giải để AI dựng hình"})
		return
	}

	svg, err := services.GenerateGeometrySVG(req)
	if err != nil {
		log.Printf("[Geometry Visualizer] Generation error: %v", err)

		errMsg := "Chưa thể dựng hình vẽ minh họa tự động từ bài toán này."
		errStr := strings.ToLower(err.Error())
		if strings.Contains(errStr, "quota") || strings.Contains(errStr, "429") || strings.Contains(errStr, "resource_exhausted") {
			errMsg = "Hệ thống AI đang tiếp nhận lượng yêu cầu lớn. Thầy cô vui lòng thử lại sau giây lát hoặc dán ảnh chụp từ GeoGebra."
		} else if strings.Contains(errStr, "deadline") || strings.Contains(errStr, "timeout") {
			errMsg = "Quá thời gian phản hồi từ máy chủ AI. Thầy cô vui lòng bấm 'Thử lại' hoặc bổ sung chỉ dẫn ngắn gọn."
		} else if strings.Contains(errStr, "no points") || strings.Contains(errStr, "valid geometry model") {
			errMsg = "AI chưa nhận diện đủ các đỉnh và đoạn thẳng của bài toán. Thầy cô vui lòng ghi rõ thêm hình dạng tại ô 'Chỉ dẫn bổ sung' (ví dụ: 'Tam giác ABC vuông tại A, đường cao AH')."
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"status": "error",
			"error":  errMsg,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":      "success",
		"diagram_svg": svg,
	})
}

