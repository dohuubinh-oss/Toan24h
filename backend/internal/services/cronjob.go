package services

import (
	"log"
	"os"
	"path/filepath"
	"time"

	"github.com/modeptrai/exam-model-backend/internal/config"
	"github.com/modeptrai/exam-model-backend/internal/models"
	"gorm.io/gorm"
)

// NextMondayMidnight calculates the next Monday 00:00:00 in given location
func NextMondayMidnight(now time.Time, loc *time.Location) time.Time {
	daysUntilMonday := (int(time.Monday) - int(now.Weekday()) + 7) % 7
	if daysUntilMonday == 0 {
		daysUntilMonday = 7
	}
	nextMon := now.AddDate(0, 0, daysUntilMonday)
	return time.Date(nextMon.Year(), nextMon.Month(), nextMon.Day(), 0, 0, 0, 0, loc)
}

// ResetWeeklyXP resets weekly_xp for all users to 0
func ResetWeeklyXP(db *gorm.DB) error {
	if db == nil {
		return nil
	}
	return db.Model(&models.User{}).Where("weekly_xp > 0").Update("weekly_xp", 0).Error
}

// StartCronJobs khởi động các tác vụ nền định kỳ
func StartCronJobs() {
	// 1. Dọn dẹp ảnh tạm
	go func() {
		ticker := time.NewTicker(7 * 24 * time.Hour)
		defer ticker.Stop()

		for {
			<-ticker.C
			cleanupTempUploads()
		}
	}()
	go cleanupTempUploads()

	// 2. Reset Weekly XP vào mỗi 00:00 Thứ Hai (GMT+7)
	go func() {
		loc, err := time.LoadLocation("Asia/Ho_Chi_Minh")
		if err != nil {
			loc = time.FixedZone("ICT", 7*3600)
		}

		for {
			now := time.Now().In(loc)
			nextMonday := NextMondayMidnight(now, loc)
			durationUntilReset := nextMonday.Sub(now)

			log.Printf("Cronjob info: Next weekly XP reset scheduled in %v (at %v)\n", durationUntilReset, nextMonday)
			time.Sleep(durationUntilReset)

			log.Println("Cronjob info: Resetting weekly XP for all users...")
			if err := ResetWeeklyXP(config.DB); err != nil {
				log.Printf("Cronjob error: Failed to reset weekly XP: %v\n", err)
			} else {
				log.Println("Cronjob info: Successfully reset weekly XP for all students.")
			}

			// Sleep 1 minute to avoid double triggering
			time.Sleep(1 * time.Minute)
		}
	}()
}

func cleanupTempUploads() {
	tempDir := filepath.Join(".", "uploads", "temp")

	// Bỏ qua nếu thư mục không tồn tại
	if _, err := os.Stat(tempDir); os.IsNotExist(err) {
		return
	}

	entries, err := os.ReadDir(tempDir)
	if err != nil {
		log.Printf("Cronjob error: Failed to read temp directory: %v\n", err)
		return
	}

	now := time.Now()
	deletedCount := 0

	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}

		filePath := filepath.Join(tempDir, entry.Name())
		info, err := entry.Info()
		if err != nil {
			continue
		}

		// Nếu file cũ hơn 1 giờ, xoá
		if now.Sub(info.ModTime()) > 1*time.Hour {
			if err := os.Remove(filePath); err == nil {
				deletedCount++
			} else {
				log.Printf("Cronjob error: Failed to delete file %s: %v\n", filePath, err)
			}
		}
	}

	if deletedCount > 0 {
		log.Printf("Cronjob info: Cleaned up %d temporary images\n", deletedCount)
	}
}
