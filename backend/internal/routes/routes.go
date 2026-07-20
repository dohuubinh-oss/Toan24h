package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/modeptrai/exam-model-backend/internal/config"
	"github.com/modeptrai/exam-model-backend/internal/controllers"
	"github.com/modeptrai/exam-model-backend/internal/handlers"
	"github.com/modeptrai/exam-model-backend/internal/repository"
	"github.com/modeptrai/exam-model-backend/internal/services"
)

// SetupRouter thiết lập toàn bộ Endpoint API cho ứng dụng
func SetupRouter() *gin.Engine {
	r := gin.Default()

	// Cấu hình CORS
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	// Phục vụ các file tĩnh (ảnh đã upload)
	r.Static("/uploads", "./uploads")

	// Dependencies
	lectureRepo := repository.NewLectureRepository(config.DB)
	lectureService := services.NewLectureService(lectureRepo)
	lectureController := controllers.NewLectureController(lectureService)

	// API Version 1
	v1 := r.Group("/api/v1")
	{
		v1.POST("/uploads/temp", handlers.UploadTempImage)

		v1.POST("/questions/bulk", handlers.BulkCreateQuestions)
		v1.GET("/questions", handlers.GetQuestions)
		v1.GET("/questions/:id", handlers.GetQuestionByID)
		v1.PUT("/questions/:id", handlers.UpdateQuestion)
		v1.DELETE("/questions/:id", handlers.DeleteQuestion)
		
		// Exams
		v1.POST("/exams", handlers.CreateExam)
		v1.GET("/exams", handlers.GetExams)
		
		// Lectures
		v1.POST("/lectures", lectureController.CreateLecture)
		v1.GET("/lectures/grade/:grade", lectureController.GetLecturesByGrade)
		v1.GET("/lectures/:id", lectureController.GetLectureByID)
	}

	return r
}
