package services

import (
	"log"
	"sync"
	"time"

	"github.com/modeptrai/exam-model-backend/internal/config"
	"github.com/modeptrai/exam-model-backend/internal/models"
	"gorm.io/gorm"
)

var monthlyCronOnce sync.Once

// NextFirstOfMonthMidnight tính thời điểm 00:00:00 ngày đầu tiên của tháng tiếp theo
func NextFirstOfMonthMidnight(now time.Time, loc *time.Location) time.Time {
	if loc == nil {
		loc = now.Location()
	}
	t := now.In(loc)
	year := t.Year()
	month := t.Month() + 1
	if month > 12 {
		year++
		month = 1
	}
	return time.Date(year, month, 1, 0, 0, 0, 0, loc)
}

// SettleMonthlyCommissions thực hiện chốt sổ hoa hồng định kỳ:
// 1. Quét toàn bộ users có commission_balance > 0:
//    - Cộng dồn số dư chờ thanh toán vào tổng tiền đã nhận: total_commission_received += commission_balance
//    - Reset số dư tháng hiện tại về 0: commission_balance = 0
// 2. Cập nhật tất cả các bản ghi commission_transactions đang ở trạng thái pending (created_at <= cutoffTime) sang settled
// 3. Ghi log đối soát và trả về (số users được chốt sổ, tổng tiền chốt sổ, error)
func SettleMonthlyCommissions(db *gorm.DB, cutoffTime time.Time) (int64, int64, error) {
	if db == nil {
		return 0, 0, nil
	}

	var settledUsersCount int64
	var totalSettledAmount int64

	err := db.Transaction(func(tx *gorm.DB) error {
		// 1. Quét danh sách users có commission_balance > 0
		var eligibleUsers []models.User
		if err := tx.Select("id, commission_balance").
			Where("commission_balance > 0").
			Find(&eligibleUsers).Error; err != nil {
			return err
		}

		settledUsersCount = int64(len(eligibleUsers))
		for _, u := range eligibleUsers {
			totalSettledAmount += u.CommissionBalance
		}

		// Nếu có users cần chốt sổ, thực hiện cập nhật nguyên tử
		if settledUsersCount > 0 {
			if err := tx.Model(&models.User{}).
				Where("commission_balance > 0").
				Updates(map[string]interface{}{
					"total_commission_received": gorm.Expr("total_commission_received + commission_balance"),
					"commission_balance":        0,
				}).Error; err != nil {
				return err
			}
		}

		// 2. Cập nhật tất cả commission_transactions pending trước hoặc tại thời điểm cutoffTime sang settled
		txQuery := tx.Model(&models.CommissionTransaction{}).Where("status = ?", "pending")
		if !cutoffTime.IsZero() {
			txQuery = txQuery.Where("created_at <= ?", cutoffTime)
		}
		if err := txQuery.Update("status", "settled").Error; err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		log.Printf("[COMMISSION SETTLEMENT ERROR] Settlement failed at %v: %v", cutoffTime, err)
		return 0, 0, err
	}

	log.Printf("[COMMISSION SETTLEMENT] Completed at %v: %d accounts settled, total %d VND", cutoffTime, settledUsersCount, totalSettledAmount)
	return settledUsersCount, totalSettledAmount, nil
}

// StartMonthlySettlementCronJob khởi động worker chốt sổ hoa hồng tự động chạy vào 00:00:00 ngày 1 hàng tháng (GMT+7)
func StartMonthlySettlementCronJob(db *gorm.DB) {
	monthlyCronOnce.Do(func() {
		go func() {
			loc, err := time.LoadLocation("Asia/Ho_Chi_Minh")
			if err != nil {
				loc = time.FixedZone("ICT", 7*3600)
			}

			log.Printf("[COMMISSION CRON] Monthly settlement worker started (timezone: %s)", loc.String())

			for {
				now := time.Now().In(loc)
				nextReset := NextFirstOfMonthMidnight(now, loc)
				durationUntilReset := nextReset.Sub(now)

				log.Printf("[COMMISSION CRON] Next monthly settlement scheduled in %v (at %v)", durationUntilReset, nextReset)
				time.Sleep(durationUntilReset)

				settleTime := time.Now().In(loc)
				targetDB := db
				if targetDB == nil {
					targetDB = config.DB
				}

				if targetDB != nil {
					log.Printf("[COMMISSION CRON] Triggering monthly commission settlement at %v...", settleTime)
					userCount, totalAmount, err := SettleMonthlyCommissions(targetDB, settleTime)
					if err != nil {
						log.Printf("[COMMISSION CRON ERROR] Failed to settle monthly commissions: %v", err)
					} else {
						log.Printf("[COMMISSION CRON] Successfully settled commissions: %d accounts, total %d VND", userCount, totalAmount)
					}
				} else {
					log.Printf("[COMMISSION CRON WARNING] Database is nil, skipping monthly settlement")
				}

				// Sleep 1 minute to avoid double triggering
				time.Sleep(1 * time.Minute)
			}
		}()
	})
}
