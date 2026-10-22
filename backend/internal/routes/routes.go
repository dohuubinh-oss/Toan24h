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

	// Thiết lập danh sách Proxy đáng tin cậy (ngăn IP spoofing qua X-Forwarded-For)
	_ = r.SetTrustedProxies([]string{"127.0.0.1", "::1"})

	// Cấu hình CORS an toàn
	r.Use(func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")
		allowedOrigin := "https://toan6789.vn"
		if config.Env != nil && config.Env.FrontendURL != "" {
			allowedOrigin = config.Env.FrontendURL
		}

		if origin == allowedOrigin || origin == "https://toan6789.vn" || origin == "https://www.toan6789.vn" || origin == "http://localhost:3000" || origin == "http://127.0.0.1:3000" {
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

	// Root & Health Check Endpoint
	r.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "ok",
			"message": "Toan6789.vn API Backend is running!",
			"version": "1.0.0",
		})
	})
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "UP"})
	})

	// Phục vụ các file tĩnh (ảnh đã upload) với bảo mật chống path traversal và Cache-Control thông minh
	r.GET("/uploads/*filepath", middleware.ServeUploads("./uploads"))
	r.HEAD("/uploads/*filepath", middleware.ServeUploads("./uploads"))

	// Dependencies
	lectureRepo := repository.NewLectureRepository(config.DB)
	lectureService := services.NewLectureService(lectureRepo)
	lectureController := controllers.NewLectureController(lectureService)
	ocrController := controllers.NewOCRController()
	mobileUploadController := controllers.NewMobileUploadController()

	// Services
	var payosClientID, payosAPIKey, payosChecksumKey string
	if config.Env != nil {
		payosClientID = config.Env.PayOSClientID
		payosAPIKey = config.Env.PayOSAPIKey
		payosChecksumKey = config.Env.PayOSChecksumKey
	}
	payosService := services.NewPayOSService(payosClientID, payosAPIKey, payosChecksumKey)

	// Auth & other Handlers
	authHandler := handlers.NewAuthHandler(config.DB)
	userHandler := handlers.NewUserHandler(config.DB)
	paymentHandler := handlers.NewPaymentHandler(config.DB, payosService)
	webhookHandler := handlers.NewWebhookHandler(config.DB, payosService)

	// Direct root Webhook endpoints for external gateways
	r.POST("/webhook/payos", webhookHandler.HandlePayOSWebhook)
	r.POST("/webhook/sepay", webhookHandler.HandleSePayWebhook)


	// API Version 1 (Public Routes)
	v1 := r.Group("/api/v1")
	{
		// Auth routes
		v1.POST("/auth/register", authHandler.Register)
		v1.POST("/auth/login", authHandler.Login)
		v1.POST("/auth/google", authHandler.GoogleLogin)
		v1.POST("/auth/refresh", authHandler.Refresh)
		v1.POST("/auth/telegram-login", authHandler.TelegramLogin)
		v1.POST("/auth/telegram", authHandler.TelegramLogin)
		v1.POST("/auth/telegram-qr/session", authHandler.CreateTelegramQRSession)
		v1.GET("/auth/telegram-qr/status/:sessionId", authHandler.CheckTelegramQRStatus)
		v1.POST("/auth/telegram-qr/complete", authHandler.CompleteTelegramQRSession)
		v1.POST("/auth/logout", authHandler.Logout)
		v1.POST("/auth/forgot-password", authHandler.ForgotPassword)
		v1.POST("/auth/verify-otp", authHandler.VerifyOTP)
		v1.POST("/auth/reset-password", authHandler.ResetPassword)

		// Webhook routes
		v1.POST("/webhooks/payos", webhookHandler.HandlePayOSWebhook)
		v1.POST("/webhooks/bank", webhookHandler.HandleSePayWebhook)


		// Read-only Public Questions
		v1.GET("/questions", handlers.GetQuestions)
		v1.GET("/questions/:id", handlers.GetQuestionByID)

		// Read-only Public Exams
		v1.GET("/exams", handlers.GetExams)
		v1.GET("/exams/:id", handlers.GetExamByID)

		// Leaderboard
		leaderboardHandler := handlers.NewLeaderboardHandler(config.DB)
		v1.GET("/leaderboard", leaderboardHandler.GetWeeklyLeaderboard)

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
			users.PUT("/:id/role", middleware.RoleMiddleware("admin"), userHandler.UpdateUserRole)
			users.POST("/:id/recharge", middleware.RoleMiddleware("admin"), userHandler.RechargeUser)

			users.PUT("/me/grade", authHandler.UpdateGrade)
			users.PUT("/me/password", authHandler.ChangePassword)
			users.POST("/me/deduct-points", authHandler.DeductPoints)
			users.POST("/me/link-telegram", authHandler.LinkTelegram)
			users.POST("/me/unlink-telegram", authHandler.UnlinkTelegram)
			users.POST("/me/avatar", userHandler.UploadAvatar)
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

		// Staff Management Group (Admin & Teacher)
		staff := protected.Group("")
		staff.Use(middleware.RoleMiddleware("admin", "teacher"))
		{
			// Questions admin
			staff.POST("/questions/bulk", handlers.BulkCreateQuestions)
			staff.POST("/questions/extract-ai", handlers.ExtractAIQuestions)
			staff.PUT("/questions/:id", handlers.UpdateQuestion)
			staff.DELETE("/questions/:id", handlers.DeleteQuestion)

			// Exams admin
			staff.POST("/exams", handlers.CreateExam)
			staff.PUT("/exams/:id", handlers.UpdateExam)
			staff.POST("/exams/:id/check-orphans", handlers.CheckOrphanQuestions)
			staff.DELETE("/exams/:id", handlers.DeleteExam)

			// Lectures admin
			staff.POST("/lectures", lectureController.CreateLecture)
			staff.POST("/lectures/extract-ai", handlers.ExtractAILecture)
			staff.PUT("/lectures/:id", lectureController.UpdateLecture)
			staff.DELETE("/lectures/:id", lectureController.DeleteLecture)

			// Appeals admin
			staff.GET("/appeals", handlers.GetAppeals)
			staff.POST("/appeals/:id/resolve", handlers.ResolveAppeal)

			// Submissions needs review admin
			staff.GET("/submissions/needs-review", handlers.GetNeedsReviewSubmissions)
			staff.POST("/submissions/:id/grade-review", handlers.ResolveSubmissionReview)

			// Reported questions admin
			staff.GET("/questions/reported", handlers.GetReportedQuestions)
			staff.POST("/questions/reported/:id/resolve", handlers.ResolveReportQuestion)

			// Vouchers admin & teacher
			voucherHandler := handlers.NewVoucherHandler(config.DB)
			staff.POST("/vouchers", voucherHandler.CreateVoucher)
		}

		// Voucher & Affiliate Access (admin, teacher, affiliate)
		voucherAccess := protected.Group("")
		voucherAccess.Use(middleware.RoleMiddleware("admin", "teacher", "affiliate"))
		{
			voucherHandler := handlers.NewVoucherHandler(config.DB)
			voucherAccess.GET("/vouchers", voucherHandler.GetVouchers)
		}

		protected.POST("/ocr", ocrController.ExtractText)
	}

	return r
}
