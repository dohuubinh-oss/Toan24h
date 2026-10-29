package main

import (
	"log"
	"os"
	"time"

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
		&models.Voucher{},
		&models.VoucherUsage{},
	); err != nil {
		log.Fatalf("Auto Migrate failed: %v", err)
	}

	// Khởi tạo mã khuyến mãi 1 tháng VIP cho học sinh mới có thời hạn tháng 10, 11, 12 năm 2026 (Hết hạn 31/12/2026)
	voucherExpiresAt := time.Date(2026, 12, 31, 23, 59, 59, 0, time.Local)
	var countVoucher int64
	config.DB.Model(&models.Voucher{}).Where("code = ?", "CHAOMUNG1M").Count(&countVoucher)
	if countVoucher == 0 {
		config.DB.Create(&models.Voucher{
			Code:        "CHAOMUNG1M",
			FreeMonths:  1,
			MaxUses:     0, // 0 = Không giới hạn lượt sử dụng
			ExpiresAt:   &voucherExpiresAt,
			IsActive:    true,
		})
	} else {
		config.DB.Model(&models.Voucher{}).Where("code = ?", "CHAOMUNG1M").Update("expires_at", &voucherExpiresAt)
	}

	config.DB.Model(&models.Voucher{}).Where("code = ?", "VIP1THANG").Count(&countVoucher)
	if countVoucher == 0 {
		config.DB.Create(&models.Voucher{
			Code:        "VIP1THANG",
			FreeMonths:  1,
			MaxUses:     0,
			ExpiresAt:   &voucherExpiresAt,
			IsActive:    true,
		})
	} else {
		config.DB.Model(&models.Voucher{}).Where("code = ?", "VIP1THANG").Update("expires_at", &voucherExpiresAt)
	}

	// 2.3. Khởi chạy Cronjob dọn dẹp các voucher đã hết hạn định kỳ 1 tháng 1 lần
	services.StartVoucherCleanupWorker(config.DB, 30*24*time.Hour)

	// Đảm bảo các tài khoản admin/teacher có sẵn luôn được kích hoạt email
	config.DB.Model(&models.User{}).Where("role IN ?", []string{"admin", "teacher"}).Update("is_verified", true)

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
