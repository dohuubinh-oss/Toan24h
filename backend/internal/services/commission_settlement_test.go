package services_test

import (
	"context"
	"fmt"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/modeptrai/exam-model-backend/internal/models"
	"github.com/modeptrai/exam-model-backend/internal/services"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/testcontainers/testcontainers-go"
	"github.com/testcontainers/testcontainers-go/modules/postgres"
	"github.com/testcontainers/testcontainers-go/wait"
	gormpg "gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func setupSettlementTestDB(t *testing.T) (*gorm.DB, func()) {
	// 1. Try local PostgreSQL first
	localDSN := "host=localhost user=admin password=secretpassword dbname=toan24h port=5432 sslmode=disable TimeZone=Asia/Ho_Chi_Minh"
	if db, err := gorm.Open(gormpg.Open(localDSN), &gorm.Config{}); err == nil {
		if sqlDB, err := db.DB(); err == nil {
			ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
			defer cancel()
			if err := sqlDB.PingContext(ctx); err == nil {
				_ = db.AutoMigrate(&models.User{}, &models.CommissionTransaction{})
				return db, func() {}
			}
		}
	}

	// 2. Try testcontainers if Docker is available
	ctx := context.Background()
	pgContainer, err := postgres.RunContainer(ctx,
		testcontainers.WithImage("postgres:15-alpine"),
		postgres.WithDatabase("testdb_settlement"),
		postgres.WithUsername("testuser"),
		postgres.WithPassword("testpassword"),
		testcontainers.WithWaitStrategy(
			wait.ForLog("database system is ready to accept connections").
				WithOccurrence(2).WithStartupTimeout(10*time.Second),
		),
	)
	if err != nil {
		t.Skipf("Skipping DB integration test: Postgres not available (%v)", err)
		return nil, func() {}
	}

	connStr, err := pgContainer.ConnectionString(ctx, "sslmode=disable")
	if err != nil {
		_ = pgContainer.Terminate(ctx)
		t.Skipf("Skipping DB integration test: %v", err)
		return nil, func() {}
	}

	db, err := gorm.Open(gormpg.Open(connStr), &gorm.Config{})
	if err != nil {
		_ = pgContainer.Terminate(ctx)
		t.Skipf("Skipping DB integration test: %v", err)
		return nil, func() {}
	}

	_ = db.AutoMigrate(&models.User{}, &models.CommissionTransaction{})
	db.Exec("DELETE FROM commission_transactions")
	db.Exec("DELETE FROM users")

	cleanup := func() {
		_ = pgContainer.Terminate(ctx)
	}
	return db, cleanup
}

func TestNextFirstOfMonthMidnight(t *testing.T) {
	ict, err := time.LoadLocation("Asia/Ho_Chi_Minh")
	require.NoError(t, err)

	testCases := []struct {
		name     string
		input    time.Time
		loc      *time.Location
		expected time.Time
	}{
		{
			name:     "Mid-month October 2026",
			input:    time.Date(2026, 10, 15, 14, 30, 0, 0, ict),
			loc:      ict,
			expected: time.Date(2026, 11, 1, 0, 0, 0, 0, ict),
		},
		{
			name:     "End of month October 2026",
			input:    time.Date(2026, 10, 31, 23, 59, 59, 999999999, ict),
			loc:      ict,
			expected: time.Date(2026, 11, 1, 0, 0, 0, 0, ict),
		},
		{
			name:     "First of month at midnight October 2026",
			input:    time.Date(2026, 10, 1, 0, 0, 0, 0, ict),
			loc:      ict,
			expected: time.Date(2026, 11, 1, 0, 0, 0, 0, ict),
		},
		{
			name:     "End of 30-day month November 2026",
			input:    time.Date(2026, 11, 30, 23, 59, 59, 0, ict),
			loc:      ict,
			expected: time.Date(2026, 12, 1, 0, 0, 0, 0, ict),
		},
		{
			name:     "End of year rollover December 2026 to January 2027",
			input:    time.Date(2026, 12, 31, 23, 59, 59, 0, ict),
			loc:      ict,
			expected: time.Date(2027, 1, 1, 0, 0, 0, 0, ict),
		},
		{
			name:     "February non-leap year 2026",
			input:    time.Date(2026, 2, 28, 12, 0, 0, 0, ict),
			loc:      ict,
			expected: time.Date(2026, 3, 1, 0, 0, 0, 0, ict),
		},
		{
			name:     "February leap year 2024",
			input:    time.Date(2024, 2, 29, 23, 59, 59, 0, ict),
			loc:      ict,
			expected: time.Date(2024, 3, 1, 0, 0, 0, 0, ict),
		},
		{
			name:     "Nil location fallback",
			input:    time.Date(2026, 5, 20, 10, 0, 0, 0, time.UTC),
			loc:      nil,
			expected: time.Date(2026, 6, 1, 0, 0, 0, 0, time.UTC),
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			result := services.NextFirstOfMonthMidnight(tc.input, tc.loc)
			assert.Equal(t, tc.expected.Year(), result.Year())
			assert.Equal(t, tc.expected.Month(), result.Month())
			assert.Equal(t, tc.expected.Day(), result.Day())
			assert.Equal(t, 0, result.Hour())
			assert.Equal(t, 0, result.Minute())
			assert.Equal(t, 0, result.Second())
			assert.Equal(t, 0, result.Nanosecond())
			if tc.loc != nil {
				assert.Equal(t, tc.loc.String(), result.Location().String())
			}
		})
	}
}

func TestSettleMonthlyCommissions_NilDB(t *testing.T) {
	users, amount, err := services.SettleMonthlyCommissions(nil, time.Now())
	assert.NoError(t, err)
	assert.Equal(t, int64(0), users)
	assert.Equal(t, int64(0), amount)
}

func TestSettleMonthlyCommissions(t *testing.T) {
	db, cleanup := setupSettlementTestDB(t)
	defer cleanup()
	if db == nil {
		return
	}

	cutoffTime := time.Date(2026, 11, 1, 0, 0, 0, 0, time.UTC)

	// 1. Tạo 2 user có CommissionBalance > 0 và 1 user có CommissionBalance = 0
	user1 := models.User{
		ID:                      uuid.New(),
		Email:                   fmt.Sprintf("aff1_%s@test.com", uuid.New().String()[:8]),
		FullName:                "Affiliate One",
		Role:                    "affiliate",
		CommissionBalance:       500000,
		TotalCommissionReceived: 100000,
	}
	user2 := models.User{
		ID:                      uuid.New(),
		Email:                   fmt.Sprintf("aff2_%s@test.com", uuid.New().String()[:8]),
		FullName:                "Affiliate Two",
		Role:                    "teacher",
		CommissionBalance:       1000000,
		TotalCommissionReceived: 0,
	}
	user3 := models.User{
		ID:                      uuid.New(),
		Email:                   fmt.Sprintf("aff3_%s@test.com", uuid.New().String()[:8]),
		FullName:                "Affiliate Three (Zero Balance)",
		Role:                    "affiliate",
		CommissionBalance:       0,
		TotalCommissionReceived: 200000,
	}

	require.NoError(t, db.Create(&user1).Error)
	require.NoError(t, db.Create(&user2).Error)
	require.NoError(t, db.Create(&user3).Error)

	studentID := uuid.New()
	student := models.User{
		ID:       studentID,
		Email:    fmt.Sprintf("student_%s@test.com", uuid.New().String()[:8]),
		FullName: "Student Payer",
		Role:     "student",
	}
	require.NoError(t, db.Create(&student).Error)

	// 2. Tạo CommissionTransactions với status "pending"
	// tx1: User 1, trước cutoff -> Phải được chuyển sang "settled"
	tx1 := models.CommissionTransaction{
		ID:               uuid.New(),
		OrderCode:        1001,
		ReferrerID:       user1.ID,
		StudentID:        studentID,
		StudentAmount:    1000000,
		CommissionRate:   50.0,
		CommissionAmount: 500000,
		Status:           "pending",
		CreatedAt:        cutoffTime.Add(-2 * time.Hour),
	}
	// tx2: User 2, trước cutoff -> Phải được chuyển sang "settled"
	tx2 := models.CommissionTransaction{
		ID:               uuid.New(),
		OrderCode:        1002,
		ReferrerID:       user2.ID,
		StudentID:        studentID,
		StudentAmount:    2000000,
		CommissionRate:   50.0,
		CommissionAmount: 1000000,
		Status:           "pending",
		CreatedAt:        cutoffTime.Add(-10 * time.Minute),
	}
	// tx3: User 1, sau cutoff -> Phải GIỮ NGUYÊN "pending"
	tx3 := models.CommissionTransaction{
		ID:               uuid.New(),
		OrderCode:        1003,
		ReferrerID:       user1.ID,
		StudentID:        studentID,
		StudentAmount:    400000,
		CommissionRate:   50.0,
		CommissionAmount: 200000,
		Status:           "pending",
		CreatedAt:        cutoffTime.Add(1 * time.Hour),
	}

	require.NoError(t, db.Create(&tx1).Error)
	require.NoError(t, db.Create(&tx2).Error)
	require.NoError(t, db.Create(&tx3).Error)

	// 3. Thực hiện chốt sổ lần 1
	settledUsers, totalAmount, err := services.SettleMonthlyCommissions(db, cutoffTime)
	require.NoError(t, err)
	assert.Equal(t, int64(2), settledUsers, "Chính xác 2 user có commission_balance > 0 được chốt sổ")
	assert.Equal(t, int64(1500000), totalAmount, "Tổng tiền chốt sổ phải là 500k + 1M = 1.5M")

	// 4. Kiểm tra cập nhật số dư của User 1
	var updatedUser1 models.User
	require.NoError(t, db.First(&updatedUser1, "id = ?", user1.ID).Error)
	assert.Equal(t, int64(0), updatedUser1.CommissionBalance, "User 1 CommissionBalance phải về 0")
	assert.Equal(t, int64(600000), updatedUser1.TotalCommissionReceived, "User 1 TotalCommissionReceived phải tăng lên 600,000")

	// 5. Kiểm tra cập nhật số dư của User 2
	var updatedUser2 models.User
	require.NoError(t, db.First(&updatedUser2, "id = ?", user2.ID).Error)
	assert.Equal(t, int64(0), updatedUser2.CommissionBalance, "User 2 CommissionBalance phải về 0")
	assert.Equal(t, int64(1000000), updatedUser2.TotalCommissionReceived, "User 2 TotalCommissionReceived phải tăng lên 1,000,000")

	// 6. Kiểm tra User 3 không bị thay đổi
	var updatedUser3 models.User
	require.NoError(t, db.First(&updatedUser3, "id = ?", user3.ID).Error)
	assert.Equal(t, int64(0), updatedUser3.CommissionBalance)
	assert.Equal(t, int64(200000), updatedUser3.TotalCommissionReceived)

	// 7. Kiểm tra trạng thái CommissionTransaction
	var updatedTx1, updatedTx2, updatedTx3 models.CommissionTransaction
	require.NoError(t, db.First(&updatedTx1, "id = ?", tx1.ID).Error)
	assert.Equal(t, "settled", updatedTx1.Status, "tx1 trước cutoff phải chuyển sang settled")

	require.NoError(t, db.First(&updatedTx2, "id = ?", tx2.ID).Error)
	assert.Equal(t, "settled", updatedTx2.Status, "tx2 trước cutoff phải chuyển sang settled")

	require.NoError(t, db.First(&updatedTx3, "id = ?", tx3.ID).Error)
	assert.Equal(t, "pending", updatedTx3.Status, "tx3 sau cutoff phải giữ nguyên pending")

	// 8. Test Idempotency: Gọi lại lần 2
	settledUsers2, totalAmount2, err2 := services.SettleMonthlyCommissions(db, cutoffTime)
	require.NoError(t, err2)
	assert.Equal(t, int64(0), settledUsers2, "Lần gọi thứ 2 không có user nào cần chốt sổ")
	assert.Equal(t, int64(0), totalAmount2, "Lần gọi thứ 2 tổng tiền là 0")

	// Số dư vẫn giữ nguyên
	var recheckUser1 models.User
	require.NoError(t, db.First(&recheckUser1, "id = ?", user1.ID).Error)
	assert.Equal(t, int64(0), recheckUser1.CommissionBalance)
	assert.Equal(t, int64(600000), recheckUser1.TotalCommissionReceived)
}
