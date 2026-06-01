package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

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
	ImageQuestion   *string  `json:"image_question"`
	ImageSolution   *string  `json:"image_solution"`
}

// QuestionGroup DTO cho nhóm câu hỏi
type QuestionGroup struct {
	SharedContent string           `json:"shared_content"`
	ImageShared   *string          `json:"image_shared"`
	Questions     []QuestionDetail `json:"questions"`
}

// processImageUrl checks if an image is in the temp folder, moves it to the final folder, and returns the new URL
func processImageUrl(originalUrl string) string {
	if !strings.HasPrefix(originalUrl, "/uploads/temp/") {
		return originalUrl
	}

	fileName := strings.TrimPrefix(originalUrl, "/uploads/temp/")
	sourcePath := filepath.Join(".", "uploads", "temp", fileName)

	// Thư mục đích: uploads/Question/MM-YYYY
	currentTime := time.Now()
	folderName := fmt.Sprintf("%02d-%d", currentTime.Month(), currentTime.Year())
	finalDir := filepath.Join(".", "uploads", "Question", folderName)

	if err := os.MkdirAll(finalDir, os.ModePerm); err != nil {
		return originalUrl
	}

	finalPath := filepath.Join(finalDir, fileName)

	// Move file
	if err := os.Rename(sourcePath, finalPath); err != nil {
		return originalUrl
	}

	return fmt.Sprintf("/uploads/Question/%s/%s", folderName, fileName)
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
				Content:      group.SharedContent,
			}
			if group.ImageShared != nil && *group.ImageShared != "" {
				processedUrl := processImageUrl(*group.ImageShared)
				parentQ.ImageQuestion = processedUrl
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
				TypeQuestion:    "single",
				Content:         detail.Content,
				Type:            detail.Type,
				Grade:           detail.Grade,
				Topic:           detail.Topic,
				DifficultyLevel: detail.DifficultyLevel,
				DifficultyPoint: detail.DifficultyPoint,
				Point:           detail.Point,
				Tags:            string(tagsBytes),
				Options:         string(optionsBytes),
				CorrectAnswer:   detail.CorrectAnswer,
				SolutionGuide:   detail.SolutionGuide,
				Hint:            detail.Hint,
				QuickSolveTips:  detail.QuickSolveTips,
				GeneralMethod:   detail.GeneralMethod,
				Mistakes:        detail.Mistakes,
			}

			if detail.ImageQuestion != nil && *detail.ImageQuestion != "" {
				childQ.ImageQuestion = processImageUrl(*detail.ImageQuestion)
			}
			if detail.ImageSolution != nil && *detail.ImageSolution != "" {
				childQ.ImageSolution = processImageUrl(*detail.ImageSolution)
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

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset := (page - 1) * limit

	if err := config.DB.Limit(limit).Offset(offset).Order("created_at desc").Find(&questions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, APIResponse{Status: "error", Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, APIResponse{Status: "success", Data: questions})
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
