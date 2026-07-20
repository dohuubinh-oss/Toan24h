package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/modeptrai/exam-model-backend/internal/config"
	"github.com/modeptrai/exam-model-backend/internal/models"
)

// APIResponse là định dạng gói tin trả về chuẩn
type APIResponse struct {
	Status string      `json:"status"`
	Data   interface{} `json:"data,omitempty"`
	Error  string      `json:"error,omitempty"`
}

// QuestionDetail DTO cho từng câu hỏi con
type QuestionDetail struct {
	BookName        string   `json:"book_name"`
	Content         string   `json:"content"`
	Type            string   `json:"type"`
	Grade           int      `json:"grade"`
	Topic           string   `json:"topic"`
	DifficultyLevel string   `json:"difficulty_level"`
	DifficultyPoint float32  `json:"difficulty_point"`
	Point           float32  `json:"point"`
	Tags            []string `json:"tags"`
	Options         []string `json:"options"`
	CorrectAnswer   string   `json:"correct_answer"`
	SolutionGuide   string   `json:"solution_guide"`
	Hint            string   `json:"hint"`
	QuickSolveTips  string   `json:"quick_solve_tips"`
	GeneralMethod   string   `json:"general_method"`
	Mistakes        string   `json:"mistakes"`
}

// QuestionGroup DTO cho nhóm câu hỏi
type QuestionGroup struct {
	SharedContent string           `json:"shared_content"`
	Questions     []QuestionDetail `json:"questions"`
}

// processImageUrl checks if an image is in the temp folder, moves it to the final folder, and returns the new URL
func processImageUrl(originalUrl string, grade int) string {
	if !strings.HasPrefix(originalUrl, "/uploads/temp/") {
		return originalUrl
	}

	fileName := strings.TrimPrefix(originalUrl, "/uploads/temp/")
	sourcePath := filepath.Join(".", "uploads", "temp", fileName)

	// Thư mục đích: uploads/questions/grade/{grade}
	folderName := fmt.Sprintf("%d", grade)
	finalDir := filepath.Join(".", "uploads", "questions", "grade", folderName)

	if err := os.MkdirAll(finalDir, os.ModePerm); err != nil {
		return originalUrl
	}

	finalPath := filepath.Join(finalDir, fileName)

	// Move file
	if err := os.Rename(sourcePath, finalPath); err != nil {
		return originalUrl
	}

	return fmt.Sprintf("/uploads/questions/grade/%s/%s", folderName, fileName)
}

// processHtmlImages quét và chuyển tất cả ảnh trong mã HTML
func processHtmlImages(htmlContent string, grade int) string {
	if htmlContent == "" {
		return htmlContent
	}
	re := regexp.MustCompile(`src="/uploads/temp/([^"]+)"`)
	updatedContent := re.ReplaceAllStringFunc(htmlContent, func(match string) string {
		parts := re.FindStringSubmatch(match)
		if len(parts) > 1 {
			originalUrl := "/uploads/temp/" + parts[1]
			newUrl := processImageUrl(originalUrl, grade)
			return fmt.Sprintf(`src="%s"`, newUrl)
		}
		return match
	})
	return updatedContent
}

// BulkCreateQuestions xử lý tạo hàng loạt câu hỏi (bao gồm câu đơn và câu chùm)
func BulkCreateQuestions(c *gin.Context) {
	var payload []QuestionGroup
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, APIResponse{Status: "error", Error: err.Error()})
		return
	}

	tx := config.DB.Begin()
	if tx.Error != nil {
		c.JSON(http.StatusInternalServerError, APIResponse{Status: "error", Error: "Could not start transaction"})
		return
	}

	var createdCount int

	for _, group := range payload {
		var parentID *uuid.UUID

		if group.SharedContent != "" {
			parentQ := models.Question{
				TypeQuestion: "group",
				Content:      processHtmlImages(group.SharedContent, group.Questions[0].Grade), // Dùng grade của câu hỏi đầu tiên
				Tags:         "[]",
				Options:      "[]",
			}

			if err := tx.Create(&parentQ).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, APIResponse{Status: "error", Error: "Failed to create group parent: " + err.Error()})
				return
			}
			parentID = &parentQ.ID
			createdCount++
		}

		for _, detail := range group.Questions {
			tagsBytes, _ := json.Marshal(detail.Tags)
			optionsBytes, _ := json.Marshal(detail.Options)

			childQ := models.Question{
				ParentID:        parentID,
				BookName:        detail.BookName,
				TypeQuestion:    "single",
				Content:         processHtmlImages(detail.Content, detail.Grade),
				Type:            detail.Type,
				Grade:           detail.Grade,
				Topic:           detail.Topic,
				DifficultyLevel: detail.DifficultyLevel,
				DifficultyPoint: detail.DifficultyPoint,
				Point:           detail.Point,
				Tags:            string(tagsBytes),
				Options:         string(optionsBytes),
				CorrectAnswer:   processHtmlImages(detail.CorrectAnswer, detail.Grade),
				SolutionGuide:   processHtmlImages(detail.SolutionGuide, detail.Grade),
				Hint:            processHtmlImages(detail.Hint, detail.Grade),
				QuickSolveTips:  processHtmlImages(detail.QuickSolveTips, detail.Grade),
				GeneralMethod:   processHtmlImages(detail.GeneralMethod, detail.Grade),
				Mistakes:        processHtmlImages(detail.Mistakes, detail.Grade),
			}

			if err := tx.Create(&childQ).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, APIResponse{Status: "error", Error: "Failed to create question: " + err.Error()})
				return
			}
			createdCount++
		}
	}

	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, APIResponse{Status: "error", Error: "Failed to commit transaction"})
		return
	}

	c.JSON(http.StatusCreated, APIResponse{
		Status: "success", 
		Data: map[string]interface{}{
			"message": "Bulk creation successful",
			"count":   createdCount,
		},
	})
}

// GetQuestions xử lý lấy danh sách câu hỏi có phân trang
func GetQuestions(c *gin.Context) {
	var questions []models.Question
	var total int64

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	
	idsParam := c.Query("ids")
	var ids []string
	if idsParam != "" {
		ids = strings.Split(idsParam, ",")
	}

	query := config.DB.Model(&models.Question{}).Where("parent_id IS NULL")
	
	if len(ids) > 0 {
		query = query.Where("id IN ?", ids)
		limit = 1000 // If specific IDs are requested, override limit to fetch them all
	}
	
	offset := (page - 1) * limit

	if err := query.Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, APIResponse{Status: "error", Error: err.Error()})
		return
	}

	if err := query.Preload("SubQuestions").Limit(limit).Offset(offset).Order("created_at desc").Find(&questions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, APIResponse{Status: "error", Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, APIResponse{
		Status: "success", 
		Data: map[string]interface{}{
			"items": questions,
			"total": total,
			"page":  page,
			"limit": limit,
		},
	})
}

// GetQuestionByID xử lý lấy chi tiết 1 câu hỏi
func GetQuestionByID(c *gin.Context) {
	id := c.Param("id")
	var q models.Question

	if err := config.DB.First(&q, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, APIResponse{Status: "error", Error: "Question not found"})
		return
	}

	c.JSON(http.StatusOK, APIResponse{Status: "success", Data: q})
}

// UpdateQuestion xử lý cập nhật câu hỏi
func UpdateQuestion(c *gin.Context) {
	id := c.Param("id")
	var q models.Question

	if err := config.DB.First(&q, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, APIResponse{Status: "error", Error: "Question not found"})
		return
	}

	var updateData models.Question
	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, APIResponse{Status: "error", Error: err.Error()})
		return
	}

	if err := config.DB.Model(&q).Updates(updateData).Error; err != nil {
		c.JSON(http.StatusInternalServerError, APIResponse{Status: "error", Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, APIResponse{Status: "success", Data: q})
}

// DeleteQuestion xử lý xoá câu hỏi (xoá mềm)
func DeleteQuestion(c *gin.Context) {
	id := c.Param("id")
	
	// Soft delete the question
	if err := config.DB.Delete(&models.Question{}, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, APIResponse{Status: "error", Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, APIResponse{Status: "success"})
}
