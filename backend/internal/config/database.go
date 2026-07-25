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
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return fmt.Errorf("failed to connect database: %w", err)
	}

	err = DB.AutoMigrate(
		&models.User{},
		&models.Lecture{},
		&models.Question{},
		&models.Exam{},
		&models.ExamResult{},
		&models.ResultDetail{},
		&models.LectureBookmark{},
		&models.Notification{},
	)
	if err != nil {
		return fmt.Errorf("failed to migrate database: %w", err)
	}

	sqlDB, err := DB.DB()
	if err != nil {
		return fmt.Errorf("failed to get sql.DB from gorm.DB: %w", err)
	}

	// Optimize connection pool for high concurrency
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(100)
	sqlDB.SetConnMaxLifetime(time.Hour)

	log.Println("Successfully connected to PostgreSQL database")
	return nil
}
