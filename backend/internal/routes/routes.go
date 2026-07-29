package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/modeptrai/exam-model-backend/internal/config"
	"github.com/modeptrai/exam-model-backend/internal/controllers"
	"github.com/modeptrai/exam-model-backend/internal/handlers"
	"github.com/modeptrai/exam-model-backend/internal/middleware"
	"github.com/modeptrai/exam-model-backend/internal/repository"
	"github.com/modeptrai/exam-model-backend/internal/services"
)

// SetupRouter thiết lập toàn bộ Endpoint API cho ứng dụng
func SetupRouter() *gin.Engine {
	r := gin.Default()

	// Cấu hình CORS
	r.Use(func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")
		if origin != "" {
			c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
		} else {
			c.Writer.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
		}
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
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

	// Auth & other Handlers
	authHandler := handlers.NewAuthHandler(config.DB)
	userHandler := handlers.NewUserHandler(config.DB)

	// API Version 1
	v1 := r.Group("/api/v1")
	{
		// Auth routes
		v1.POST("/auth/register", authHandler.Register)
		v1.POST("/auth/login", authHandler.Login)
		v1.POST("/auth/refresh", authHandler.Refresh)
		v1.POST("/auth/telegram-login", authHandler.TelegramLogin)
		v1.POST("/auth/logout", authHandler.Logout)

		v1.POST("/uploads/temp", handlers.UploadTempImage)

		v1.POST("/questions/bulk", handlers.BulkCreateQuestions)
		v1.GET("/questions", handlers.GetQuestions)

		// Notifications
		v1.GET("/notifications", handlers.GetMyNotifications)
		v1.POST("/notifications/:id/read", handlers.MarkNotificationRead)
		v1.POST("/notifications/cheat", handlers.CreateCheatNotification)
		
		v1.GET("/questions/:id", handlers.GetQuestionByID)
		v1.PUT("/questions/:id", handlers.UpdateQuestion)
		v1.DELETE("/questions/:id", handlers.DeleteQuestion)
		
		// Exams
		v1.POST("/exams", handlers.CreateExam)
		v1.GET("/exams", handlers.GetExams)
		v1.GET("/exams/:id", handlers.GetExamByID)
		v1.DELETE("/exams/:id", handlers.DeleteExam)
		v1.POST("/exams/:id/submit", handlers.SubmitExam)

		v1.GET("/exam-results", handlers.GetMyExamResults)
		v1.GET("/exam-results/:id", handlers.GetExamResultByID)
		v1.POST("/exam-results/:id/appeal", handlers.AppealExamResult)
		
		// Lectures
		v1.POST("/lectures", lectureController.CreateLecture)
		v1.GET("/lectures", lectureController.GetAllLectures)
		v1.GET("/lectures/grade/:grade", lectureController.GetLecturesByGrade)
		v1.GET("/lectures/:id", lectureController.GetLectureByID)
	}

	// Protected API routes
	protected := r.Group("/api/v1")
	protected.Use(middleware.AuthMiddleware())
	{
		// User Routes
		users := protected.Group("/users")
		{
			users.GET("/me", userHandler.GetProfile)
			users.GET("", middleware.RoleMiddleware("admin"), userHandler.GetUsers)
			users.PUT("/:id/status", middleware.RoleMiddleware("admin"), userHandler.UpdateUserStatus)
			users.POST("/:id/recharge", middleware.RoleMiddleware("admin"), userHandler.RechargeUser)
			
			users.PUT("/me/grade", authHandler.UpdateGrade)
			users.POST("/me/deduct-points", authHandler.DeductPoints)
			users.POST("/me/link-telegram", authHandler.LinkTelegram)
		}

		bookmarkHandler := handlers.NewBookmarkHandler(config.DB)
		protected.POST("/lectures/:id/bookmark", bookmarkHandler.ToggleLectureBookmark)
		protected.GET("/bookmarks/lectures", bookmarkHandler.GetBookmarkedLectures)
	}

	return r
}
