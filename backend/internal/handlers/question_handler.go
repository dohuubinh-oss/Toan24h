package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/modeptrai/exam-model-backend/internal/config"
	"github.com/modeptrai/exam-model-backend/internal/models"
)

// APIResponse là định dạng gói tin trả về chuẩn
type APIResponse struct {
	Status string      `json:"status"`
	Data   interface{} `json:"data,omitempty"`
	Error  string      `json:"error,omitempty"`
}

// CreateQuestion xử lý tạo câu hỏi mới
func CreateQuestion(c *gin.Context) {
	var q models.Question
	if err := c.ShouldBindJSON(&q); err != nil {
		c.JSON(http.StatusBadRequest, APIResponse{Status: "error", Error: err.Error()})
		return
	}

	if err := config.DB.Create(&q).Error; err != nil {
		c.JSON(http.StatusInternalServerError, APIResponse{Status: "error", Error: err.Error()})
		return
	}

	c.JSON(http.StatusCreated, APIResponse{Status: "success", Data: q})
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
