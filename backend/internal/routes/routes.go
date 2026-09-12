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

	// Cấu hình CORS an toàn
	r.Use(func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")
		allowedOrigin := "http://localhost:3000"
		if config.Env != nil && config.Env.FrontendURL != "" {
			allowedOrigin = config.Env.FrontendURL
		}

		if origin == allowedOrigin || origin == "http://localhost:3000" || origin == "http://127.0.0.1:3000" {
			c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
		} else {
			c.Writer.Header().Set("Access-Control-Allow-Origin", allowedOrigin)
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
	ocrController := controllers.NewOCRController()
	mobileUploadController := controllers.NewMobileUploadController()

	// Auth & other Handlers
	authHandler := handlers.NewAuthHandler(config.DB)
	userHandler := handlers.NewUserHandler(config.DB)
	paymentHandler := handlers.NewPaymentHandler(config.DB)
	webhookHandler := handlers.NewWebhookHandler(config.DB)

	// API Version 1 (Public Routes)
	v1 := r.Group("/api/v1")
	{
		// Auth routes
		v1.POST("/auth/register", authHandler.Register)
		v1.POST("/auth/login", authHandler.Login)
		v1.POST("/auth/refresh", authHandler.Refresh)
		v1.POST("/auth/telegram-login", authHandler.TelegramLogin)
		v1.POST("/auth/logout", authHandler.Logout)

		v1.POST("/webhooks/bank", webhookHandler.HandleSePayWebhook)

		// Read-only Public Questions
		v1.GET("/questions", handlers.GetQuestions)
		v1.GET("/questions/:id", handlers.GetQuestionByID)

		// Read-only Public Exams
		v1.GET("/exams", handlers.GetExams)
		v1.GET("/exams/:id", handlers.GetExamByID)

		// Read-only Public Lectures
		v1.GET("/lectures", lectureController.GetAllLectures)
		v1.GET("/lectures/grade/:grade", lectureController.GetLecturesByGrade)
		v1.GET("/lectures/:id", lectureController.GetLectureByID)

		// Mobile QR Upload & Sync
		v1.POST("/mobile-upload/:sessionId", mobileUploadController.UploadFromMobile)
		v1.GET("/mobile-upload/:sessionId", mobileUploadController.CheckUploadStatus)
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

		// Upload Temp Image (requires authenticated user)
		protected.POST("/uploads/temp", handlers.UploadTempImage)

		// Report question (authenticated student)
		protected.POST("/questions/:id/report", handlers.ReportQuestion)

		// Notifications
		protected.GET("/notifications", handlers.GetMyNotifications)
		protected.POST("/notifications/:id/read", handlers.MarkNotificationRead)
		protected.DELETE("/notifications", handlers.DeleteAllNotifications)
		protected.POST("/notifications/cheat", handlers.CreateCheatNotification)

		payments := protected.Group("/payments")
		{
			payments.POST("/create", paymentHandler.CreatePayment)
			payments.GET("/my-transactions", paymentHandler.GetMyTransactions)
		}

		bookmarkHandler := handlers.NewBookmarkHandler(config.DB)
		protected.POST("/lectures/:id/bookmark", bookmarkHandler.ToggleLectureBookmark)
		protected.GET("/bookmarks/lectures", bookmarkHandler.GetBookmarkedLectures)

		protected.POST("/exams/:id/submit", handlers.SubmitExam)
		protected.GET("/exam-results", handlers.GetMyExamResults)
		protected.GET("/exam-results/:id", handlers.GetExamResultByID)
		protected.POST("/exam-results/:id/appeal", handlers.AppealExamResult)

		// Admin Management Group
		admin := protected.Group("")
		admin.Use(middleware.RoleMiddleware("admin"))
		{
			// Questions admin
			admin.POST("/questions/bulk", handlers.BulkCreateQuestions)
			admin.PUT("/questions/:id", handlers.UpdateQuestion)
			admin.DELETE("/questions/:id", handlers.DeleteQuestion)

			// Exams admin
			admin.POST("/exams", handlers.CreateExam)
			admin.DELETE("/exams/:id", handlers.DeleteExam)

			// Lectures admin
			admin.POST("/lectures", lectureController.CreateLecture)
			admin.PUT("/lectures/:id", lectureController.UpdateLecture)

			// Appeals admin
			admin.GET("/appeals", handlers.GetAppeals)
			admin.POST("/appeals/:id/resolve", handlers.ResolveAppeal)

			// Submissions needs review admin
			admin.GET("/submissions/needs-review", handlers.GetNeedsReviewSubmissions)
			admin.POST("/submissions/:id/grade-review", handlers.ResolveSubmissionReview)

			// Reported questions admin
			admin.GET("/questions/reported", handlers.GetReportedQuestions)
			admin.POST("/questions/reported/:id/resolve", handlers.ResolveReportQuestion)
		}

		protected.POST("/ocr", ocrController.ExtractText)
	}

	return r
}
