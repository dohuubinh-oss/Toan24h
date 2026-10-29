package services

import (
	"log"
	"time"

	"github.com/modeptrai/exam-model-backend/internal/models"
	"gorm.io/gorm"
)

// IsVoucherExpired kiểm tra xem voucher đã hết hạn chưa
func IsVoucherExpired(v *models.Voucher, now time.Time) bool {
	if v == nil || v.ExpiresAt == nil {
		return false
	}
	return now.After(*v.ExpiresAt)
}

// CleanExpiredVouchers tìm và xóa triệt để các voucher đã quá hạn sử dụng khỏi CSDL
func CleanExpiredVouchers(db *gorm.DB) (int64, error) {
	if db == nil {
		return 0, nil
	}

	now := time.Now()
	result := db.Where("expires_at IS NOT NULL AND expires_at < ?", now).Delete(&models.Voucher{})
	if result.Error != nil {
		return 0, result.Error
	}

	return result.RowsAffected, nil
}

// StartVoucherCleanupWorker khởi chạy goroutine định kỳ dọn dẹp các voucher hết hạn
func StartVoucherCleanupWorker(db *gorm.DB, interval time.Duration) {
	if db == nil {
		return
	}

	go func() {
		log.Printf("[VOUCHER CRON] Worker started with interval %v", interval)

		// Chạy ngay 1 lần khi server khởi động
		if deleted, err := CleanExpiredVouchers(db); err == nil && deleted > 0 {
			log.Printf("[VOUCHER CRON] Initial cleanup deleted %d expired vouchers", deleted)
		}

		ticker := time.NewTicker(interval)
		defer ticker.Stop()

		for range ticker.C {
			deleted, err := CleanExpiredVouchers(db)
			if err != nil {
				log.Printf("[VOUCHER CRON ERROR] Failed to clean expired vouchers: %v", err)
			} else if deleted > 0 {
				log.Printf("[VOUCHER CRON] Deleted %d expired vouchers", deleted)
			}
		}
	}()
}
