package services

import (
	"log"
	"sync"
	"time"

	"github.com/modeptrai/exam-model-backend/internal/models"
	"gorm.io/gorm"
)

var annualGradePromotionOnce sync.Once

// NextMay25Midnight tính thời điểm 00:00:00 ngày 25 tháng 5 tiếp theo theo múi giờ chỉ định
func NextMay25Midnight(now time.Time, loc *time.Location) time.Time {
	if loc == nil {
		loc = now.Location()
	}
	t := now.In(loc)
	year := t.Year()

	may25ThisYear := time.Date(year, time.May, 25, 0, 0, 0, 0, loc)
	if t.Before(may25ThisYear) {
		return may25ThisYear
	}
	// Nếu đã qua hoặc đang đúng ngày 25/5, mốc kế tiếp là 25/5 năm sau
	return time.Date(year+1, time.May, 25, 0, 0, 0, 0, loc)
}

// PromoteStudentGrades thực hiện tự động thăng hạng lớp cho học sinh vào ngày 25/5 hàng năm:
// Quy tắc chuyển lớp:
// - Lớp 9 -> "tot_nghiep" (Hoàn thành chương trình THCS)
// - Lớp 8 -> "9"
// - Lớp 7 -> "8"
// - Lớp 6 -> "7"
// - Lớp 5 -> "6" (Chuyển cấp Tiểu học lên THCS)
// Lưu ý: Cập nhật theo thứ tự từ lớp lớn xuống lớp bé để tránh ghi đè cascade dữ liệu.
// Chỉ áp dụng cho tài khoản role = 'student'.
func PromoteStudentGrades(db *gorm.DB) (int64, error) {
	if db == nil {
		return 0, nil
	}

	var totalPromoted int64

	err := db.Transaction(func(tx *gorm.DB) error {
		// 1. Lớp 9 -> tot_nghiep
		res9 := tx.Model(&models.User{}).
			Where("role = ? AND grade = ?", "student", "9").
			Update("grade", "tot_nghiep")
		if res9.Error != nil {
			return res9.Error
		}
		totalPromoted += res9.RowsAffected

		// 2. Lớp 8 -> 9
		res8 := tx.Model(&models.User{}).
			Where("role = ? AND grade = ?", "student", "8").
			Update("grade", "9")
		if res8.Error != nil {
			return res8.Error
		}
		totalPromoted += res8.RowsAffected

		// 3. Lớp 7 -> 8
		res7 := tx.Model(&models.User{}).
			Where("role = ? AND grade = ?", "student", "7").
			Update("grade", "8")
		if res7.Error != nil {
			return res7.Error
		}
		totalPromoted += res7.RowsAffected

		// 4. Lớp 6 -> 7
		res6 := tx.Model(&models.User{}).
			Where("role = ? AND grade = ?", "student", "6").
			Update("grade", "7")
		if res6.Error != nil {
			return res6.Error
		}
		totalPromoted += res6.RowsAffected

		// 5. Lớp 5 -> 6
		res5 := tx.Model(&models.User{}).
			Where("role = ? AND grade = ?", "student", "5").
			Update("grade", "6")
		if res5.Error != nil {
			return res5.Error
		}
		totalPromoted += res5.RowsAffected

		log.Printf("[GRADE PROMOTION] Successfully promoted %d students: L9->TN(%d), L8->9(%d), L7->8(%d), L6->7(%d), L5->6(%d)",
			totalPromoted, res9.RowsAffected, res8.RowsAffected, res7.RowsAffected, res6.RowsAffected, res5.RowsAffected)

		return nil
	})

	if err != nil {
		return 0, err
	}

	return totalPromoted, nil
}

// StartAnnualGradePromotionCronJob khởi chạy cronjob tự động lên lớp cho học sinh vào 00:00:00 ngày 25/5 hàng năm
func StartAnnualGradePromotionCronJob(db *gorm.DB) {
	if db == nil {
		return
	}

	annualGradePromotionOnce.Do(func() {
		go func() {
			loc, err := time.LoadLocation("Asia/Ho_Chi_Minh")
			if err != nil {
				loc = time.FixedZone("ICT", 7*3600)
			}

			for {
				now := time.Now().In(loc)
				targetTime := NextMay25Midnight(now, loc)
				waitDuration := targetTime.Sub(now)

				log.Printf("[CRONJOB] Next annual grade promotion scheduled in %v (at %v)\n", waitDuration, targetTime)
				time.Sleep(waitDuration)

				log.Println("[CRONJOB] Executing annual grade promotion on May 25...")
				count, err := PromoteStudentGrades(db)
				if err != nil {
					log.Printf("[CRONJOB ERROR] Failed to promote student grades: %v\n", err)
				} else {
					log.Printf("[CRONJOB] Annual grade promotion completed. Total students promoted: %d\n", count)
				}

				// Sleep 1 ngày để tránh trigger lặp trong cùng một ngày 25/5
				time.Sleep(24 * time.Hour)
			}
		}()
	})
}
