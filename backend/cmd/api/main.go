package main

import (
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/modeptrai/exam-model-backend/internal/config"
	"github.com/modeptrai/exam-model-backend/internal/handlers"
	"github.com/modeptrai/exam-model-backend/internal/models"
	"github.com/modeptrai/exam-model-backend/internal/routes"
	"github.com/modeptrai/exam-model-backend/internal/services"
)

func main() {
	log.Println("Starting Toan24h API Server...")

	// 0. Khởi chạy Cronjobs (dọn rác hệ thống)
	services.StartCronJobs()

	// 1. Load config
	if err := config.LoadConfig(); err != nil {
		log.Fatalf("Config error: %v", err)
	}

	// Đồng bộ chế độ Gin từ file .env / environment (debug / release / test)
	if ginMode := os.Getenv("GIN_MODE"); ginMode != "" {
		gin.SetMode(ginMode)
	}

	// 2. Connect Database (Fail Fast if error)
	if err := config.ConnectDB(config.Env.DBDSN); err != nil {
		log.Fatalf("Database connection failed: %v", err)
	}

	// 2.2. Auto Migrate Models
	log.Println("Running Auto Migration...")
	if err := config.DB.AutoMigrate(
		&models.User{},
		&models.Question{},
		&models.Lecture{},
		&models.LectureBookmark{},
		&models.Exam{},
		&models.Submission{},
		&models.Notification{},
		&models.Transaction{},
		&models.XPTransaction{},
	); err != nil {
		log.Fatalf("Auto Migrate failed: %v", err)
	}

	// Đảm bảo ràng buộc khoá ngoại câu hỏi con tự động CASCADE khi xoá câu hỏi cha
	config.DB.Exec(`
		DO $$ 
		BEGIN 
			IF EXISTS (
				SELECT 1 FROM pg_constraint c 
				WHERE c.conname = 'fk_questions_sub_questions' 
				AND c.confdeltype != 'c'
			) THEN
				ALTER TABLE questions DROP CONSTRAINT fk_questions_sub_questions;
				ALTER TABLE questions ADD CONSTRAINT fk_questions_sub_questions 
					FOREIGN KEY (parent_id) REFERENCES questions(id) ON DELETE CASCADE;
			END IF;
		END $$;
	`)

	// 3. Connect Redis (Fail Fast if error)
	if err := config.ConnectRedis(config.Env.RedisURL); err != nil {
		log.Fatalf("Redis connection failed: %v", err)
	}

	// 3.5. Start Background Workers (e.g., 5 concurrent grading workers)
	services.StartGradingWorkers(5, handlers.ProcessExamGrading)

	// 3.6. Start Telegram Bot Poller for Mobile Login
	services.StartTelegramBotPoller(config.DB)

	// 4. Khởi động Web Server (Gin)
	r := routes.SetupRouter()
	log.Println("Server running on port 8080...")
	if err := r.Run(":8080"); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
