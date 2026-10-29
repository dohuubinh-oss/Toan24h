package config

import (
	"fmt"
	"log"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"github.com/modeptrai/exam-model-backend/internal/models"
)

var DB *gorm.DB

// ConnectDB initializes the PostgreSQL connection via GORM.
func ConnectDB(dsn string) error {
	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{
		PrepareStmt: true,
	})
	if err != nil {
		return fmt.Errorf("failed to connect database: %w", err)
	}

	// Safe column migration: rename quick_solve_tips to short_answer if table exists
	if DB.Migrator().HasTable(&models.Question{}) {
		hasOld := DB.Migrator().HasColumn(&models.Question{}, "quick_solve_tips")
		hasNew := DB.Migrator().HasColumn(&models.Question{}, "short_answer")
		if hasOld && !hasNew {
			_ = DB.Migrator().RenameColumn(&models.Question{}, "quick_solve_tips", "short_answer")
		} else if hasOld && hasNew {
			_ = DB.Exec("UPDATE questions SET short_answer = quick_solve_tips WHERE (short_answer IS NULL OR short_answer = '') AND quick_solve_tips IS NOT NULL AND quick_solve_tips != ''")
		}
	}

	err = DB.AutoMigrate(
		&models.User{},
		&models.Lecture{},
		&models.Question{},
		&models.Exam{},
		&models.Submission{},
		&models.LectureBookmark{},
		&models.Notification{},
		&models.Transaction{},
		&models.Voucher{},
		&models.VoucherUsage{},
		&models.CommissionTransaction{},
	)
	if err != nil {
		return fmt.Errorf("failed to migrate database: %w", err)
	}

	sqlDB, err := DB.DB()
	if err != nil {
		return fmt.Errorf("failed to get sql.DB from gorm.DB: %w", err)
	}

	// Optimize connection pool for high concurrency
	sqlDB.SetMaxOpenConns(100)
	sqlDB.SetMaxIdleConns(20)
	sqlDB.SetConnMaxLifetime(30 * time.Minute)
	sqlDB.SetConnMaxIdleTime(10 * time.Minute)

	log.Println("Successfully connected to PostgreSQL database")
	return nil
}
