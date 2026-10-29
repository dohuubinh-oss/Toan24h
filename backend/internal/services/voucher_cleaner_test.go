package services_test

import (
	"testing"
	"time"

	"github.com/modeptrai/exam-model-backend/internal/models"
	"github.com/modeptrai/exam-model-backend/internal/services"
	"github.com/stretchr/testify/assert"
)

func TestIsVoucherExpired(t *testing.T) {
	now := time.Date(2026, 11, 15, 10, 0, 0, 0, time.UTC)
	past := time.Date(2026, 9, 30, 23, 59, 59, 0, time.UTC)
	future := time.Date(2026, 12, 31, 23, 59, 59, 0, time.UTC)

	// 1. Voucher không có hạn sử dụng
	v1 := &models.Voucher{Code: "FOREVER", ExpiresAt: nil}
	assert.False(t, services.IsVoucherExpired(v1, now))

	// 2. Voucher hết hạn trong quá khứ
	v2 := &models.Voucher{Code: "OLD", ExpiresAt: &past}
	assert.True(t, services.IsVoucherExpired(v2, now))

	// 3. Voucher còn hạn trong tháng 11, 12 năm 2026
	v3 := &models.Voucher{Code: "CHAOMUNG1M", ExpiresAt: &future}
	assert.False(t, services.IsVoucherExpired(v3, now))

	// 4. Khi bước sang năm 2027 thì voucher CHAOMUNG1M sẽ hết hạn
	nextYear := time.Date(2027, 1, 1, 0, 0, 1, 0, time.UTC)
	assert.True(t, services.IsVoucherExpired(v3, nextYear))
}

func TestCleanExpiredVouchers_NilDB(t *testing.T) {
	count, err := services.CleanExpiredVouchers(nil)
	assert.NoError(t, err)
	assert.Equal(t, int64(0), count)
}
