package controllers

import (
	"net/http"
	"strconv"

	"github.com/modeptrai/exam-model-backend/internal/services"
	"github.com/gin-gonic/gin"
)

type LectureController struct {
	service services.LectureService
}

func NewLectureController(service services.LectureService) *LectureController {
	return &LectureController{service: service}
}

func (ctrl *LectureController) CreateLecture(c *gin.Context) {
	var req services.CreateLectureRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid JSON payload",
			"details": err.Error(),
		})
		return
	}

	if err := ctrl.service.CreateLecture(c.Request.Context(), req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Lecture created successfully",
	})
}

func (ctrl *LectureController) GetLecturesByGrade(c *gin.Context) {
	grade := c.Param("grade")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "9"))

	res, err := ctrl.service.GetLecturesByGrade(c.Request.Context(), grade, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, res)
}

func (ctrl *LectureController) GetAllLectures(c *gin.Context) {
	res, err := ctrl.service.GetAllLectures(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": res})
}

func (ctrl *LectureController) GetLectureByID(c *gin.Context) {
	id := c.Param("id")
	res, err := ctrl.service.GetLectureByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "lecture not found"})
		return
	}

	c.JSON(http.StatusOK, res)
}
