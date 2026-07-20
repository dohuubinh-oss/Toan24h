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
	if err := config.DB.Order("created_at desc").Find(&exams).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch exams: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": exams})
}
