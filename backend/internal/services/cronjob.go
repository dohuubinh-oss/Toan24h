package services

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
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

	// 3. Dọn dẹp hình vẽ và kết quả bài thi cũ hơn 15 tháng (chạy hàng tuần)
	go func() {
		ticker := time.NewTicker(7 * 24 * time.Hour)
		defer ticker.Stop()

		for {
			<-ticker.C
			if config.DB != nil {
				CleanupOldSubmissionsAndDiagrams(config.DB, ".", 15)
			}
		}
	}()
}

// MoveDiagramTempToPermanent moves a diagram image from uploads/temp/ to uploads/diagrams/{submissionID}_{questionID}.{ext}
// upon successful exam submission, preventing leftover temporary images from cluttering storage.
func MoveDiagramTempToPermanent(baseDir string, tempURL string, submissionID string, questionID string) string {
	if tempURL == "" || !strings.HasPrefix(tempURL, "/uploads/temp/") {
		return tempURL
	}
	if baseDir == "" {
		baseDir = "."
	}

	fileName := filepath.Base(tempURL)
	sourcePath := filepath.Join(baseDir, "uploads", "temp", fileName)

	targetDir := filepath.Join(baseDir, "uploads", "diagrams")
	if err := os.MkdirAll(targetDir, 0755); err != nil {
		return tempURL
	}

	ext := filepath.Ext(fileName)
	if ext == "" {
		ext = ".jpg"
	}
	targetFileName := fmt.Sprintf("%s_%s%s", submissionID, questionID, ext)
	targetPath := filepath.Join(targetDir, targetFileName)

	if err := os.Rename(sourcePath, targetPath); err != nil {
		return tempURL
	}

	return fmt.Sprintf("/uploads/diagrams/%s", targetFileName)
}

// CleanupOldSubmissionsAndDiagrams cleans up both physical diagram image files in ./uploads/diagrams/
// and database submission records that are older than retentionMonths (default 15 months).
func CleanupOldSubmissionsAndDiagrams(db *gorm.DB, baseDir string, retentionMonths int) (int64, int, error) {
	if retentionMonths <= 0 {
		retentionMonths = 15
	}
	if baseDir == "" {
		baseDir = "."
	}

	cutoff := time.Now().AddDate(0, -retentionMonths, 0)
	deletedFiles := 0
	var deletedSubmissions int64

	// 1. Quét CSDL nếu có kết nối: Xóa các file ảnh hình vẽ của các bài thi đã quá 15 tháng
	if db != nil {
		var oldSubmissions []models.Submission
		if err := db.Where("created_at < ?", cutoff).Find(&oldSubmissions).Error; err == nil {
			for _, sub := range oldSubmissions {
				var answers map[string]models.QuestionAnswer
				if err := json.Unmarshal(sub.AnswersJSON, &answers); err == nil {
					for _, ans := range answers {
						if ans.StudentDiagramURL != "" && strings.HasPrefix(ans.StudentDiagramURL, "/uploads/diagrams/") {
							rel := strings.TrimPrefix(ans.StudentDiagramURL, "/")
							filePath := filepath.Join(baseDir, rel)
							if err := os.Remove(filePath); err == nil {
								deletedFiles++
							}
						}
					}
				}
			}
			// Xóa các bản ghi bài thi quá 15 tháng trong PostgreSQL
			res := db.Where("created_at < ?", cutoff).Delete(&models.Submission{})
			deletedSubmissions = res.RowsAffected
			log.Printf("Cronjob info: Deleted %d submissions older than %d months\n", deletedSubmissions, retentionMonths)
		}
	}

	// 2. Quét thư mục vật lý ./uploads/diagrams/ để xóa sạch file cũ hơn 15 tháng
	diagramsDir := filepath.Join(baseDir, "uploads", "diagrams")
	if entries, err := os.ReadDir(diagramsDir); err == nil {
		for _, entry := range entries {
			if entry.IsDir() {
				continue
			}
			info, err := entry.Info()
			if err != nil {
				continue
			}
			if info.ModTime().Before(cutoff) {
				filePath := filepath.Join(diagramsDir, entry.Name())
				if err := os.Remove(filePath); err == nil {
					deletedFiles++
				}
			}
		}
		if deletedFiles > 0 {
			log.Printf("Cronjob info: Cleaned up %d old diagram image files (>%d months)\n", deletedFiles, retentionMonths)
		}
	}

	return deletedSubmissions, deletedFiles, nil
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
