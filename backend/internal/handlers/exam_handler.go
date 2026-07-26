package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/modeptrai/exam-model-backend/internal/config"
	"github.com/modeptrai/exam-model-backend/internal/models"
)

func CreateExam(c *gin.Context) {
	var exam models.Exam
	if err := c.ShouldBindJSON(&exam); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := config.DB.Create(&exam).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create exam: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, exam)
}

func GetExams(c *gin.Context) {
	var exams []models.Exam
	query := config.DB.Order("created_at desc")
	if lectureID := c.Query("lecture_id"); lectureID != "" {
		query = query.Where("lecture_id = ?", lectureID)
	}
	if err := query.Find(&exams).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch exams: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": exams})
}

func GetExamByID(c *gin.Context) {
	id := c.Param("id")

	var exam models.Exam
	if err := config.DB.Where("id = ?", id).First(&exam).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Exam not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": exam})
}

func DeleteExam(c *gin.Context) {
	id := c.Param("id")

	// Hard delete the exam
	if err := config.DB.Unscoped().Where("id = ?", id).Delete(&models.Exam{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete exam"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Exam deleted successfully"})
}
