package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/modeptrai/exam-model-backend/internal/handlers"
)

// SetupRouter thiết lập toàn bộ Endpoint API cho ứng dụng
func SetupRouter() *gin.Engine {
	r := gin.Default()

	// Cấu hình CORS và các middleware khác có thể nằm ở đây

	// Phục vụ các file tĩnh (ảnh đã upload)
	r.Static("/uploads", "./uploads")

	// API Version 1
	v1 := r.Group("/api/v1")
	{
		v1.POST("/uploads/temp", handlers.UploadTempImage)

		v1.POST("/questions/bulk", handlers.BulkCreateQuestions)
		v1.GET("/questions", handlers.GetQuestions)
		v1.GET("/questions/:id", handlers.GetQuestionByID)
		v1.PUT("/questions/:id", handlers.UpdateQuestion)
		v1.DELETE("/questions/:id", handlers.DeleteQuestion)
	}

	return r
}
