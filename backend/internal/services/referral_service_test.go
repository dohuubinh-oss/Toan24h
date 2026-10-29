package services_test

import (
	"context"
	"fmt"
	"regexp"
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

func TestReferralCodeFormat_RandomGTCode(t *testing.T) {
	gtRegex := regexp.MustCompile(`^GT\d{6}$`)

	seen := make(map[string]bool)
	for i := 0; i < 50; i++ {
		code := services.GenerateRandomGTCode()
		assert.Len(t, code, 8, "Code must be exactly 8 characters")
		assert.True(t, gtRegex.MatchString(code), "Code %s must match GT + 6 digits", code)
		seen[code] = true
	}

	// Probability of 50 collisions out of 1,000,000 is virtually zero
	assert.Greater(t, len(seen), 40, "Generated codes should have high randomness")
}

func TestReferralCommissionRatesByRole(t *testing.T) {
	testCases := []struct {
		role         string
		expectedRate float32
	}{
		{"teacher", 60.0},
		{"Teacher", 60.0},
		{"TEACHER", 60.0},
		{"admin", 70.0},
		{"Admin", 70.0},
		{"affiliate", 30.0},
		{"Affiliate", 30.0},
		{"student", 30.0},
		{"", 30.0},
		{"unknown_role", 30.0},
	}

	for _, tc := range testCases {
		t.Run(fmt.Sprintf("Role_%s", tc.role), func(t *testing.T) {
			rate := services.GetCommissionRateByRole(tc.role)
			assert.Equal(t, tc.expectedRate, rate)
		})
	}
}

func TestEnsureUserReferralCode_NilUser(t *testing.T) {
	v, err := services.EnsureUserReferralCode(nil, nil)
	assert.Error(t, err)
	assert.Nil(t, v)
}

func setupReferralTestDB(t *testing.T) (*gorm.DB, func()) {
	// 1. Try local postgres first if running
	localDSN := "host=localhost user=admin password=secretpassword dbname=toan24h port=5432 sslmode=disable TimeZone=Asia/Ho_Chi_Minh"
	if db, err := gorm.Open(gormpg.Open(localDSN), &gorm.Config{}); err == nil {
		if sqlDB, err := db.DB(); err == nil {
			ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
			defer cancel()
			if err := sqlDB.PingContext(ctx); err == nil {
				_ = db.AutoMigrate(&models.User{}, &models.Voucher{})
				return db, func() {}
			}
		}
	}

	// 2. Try testcontainers if docker is available
	ctx := context.Background()
	pgContainer, err := postgres.RunContainer(ctx,
		testcontainers.WithImage("postgres:15-alpine"),
		postgres.WithDatabase("testdb_referral"),
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

	_ = db.AutoMigrate(&models.User{}, &models.Voucher{})

	cleanup := func() {
		_ = pgContainer.Terminate(ctx)
	}
	return db, cleanup
}

func TestReferralService_DBLifecycle(t *testing.T) {
	db, cleanup := setupReferralTestDB(t)
	defer cleanup()
	if db == nil {
		return
	}

	// 1. Test GenerateUniqueReferralCode
	code, err := services.GenerateUniqueReferralCode(db)
	require.NoError(t, err)
	assert.Len(t, code, 8)
	assert.Regexp(t, `^GT\d{6}$`, code)

	// 2. Test EnsureUserReferralCode - Teacher
	teacher := &models.User{
		ID:       uuid.New(),
		Email:    fmt.Sprintf("teacher_%s@test.com", uuid.New().String()[:8]),
		FullName: "Teacher Test",
		Role:     "teacher",
	}
	require.NoError(t, db.Create(teacher).Error)

	voucher, err := services.EnsureUserReferralCode(db, teacher)
	require.NoError(t, err)
	require.NotNil(t, voucher)

	assert.Equal(t, float32(60.0), voucher.CommissionPercent)
	assert.Equal(t, 1, voucher.FreeMonths)
	assert.Equal(t, 0, voucher.MaxUses)
	assert.Nil(t, voucher.ExpiresAt)
	assert.True(t, voucher.IsActive)
	require.NotNil(t, voucher.AffiliateID)
	assert.Equal(t, teacher.ID, *voucher.AffiliateID)
	require.NotNil(t, teacher.ReferralCode)
	assert.Equal(t, voucher.Code, *teacher.ReferralCode)

	// 3. Test Idempotent call
	voucher2, err := services.EnsureUserReferralCode(db, teacher)
	require.NoError(t, err)
	assert.Equal(t, voucher.Code, voucher2.Code)
	assert.Equal(t, voucher.ID, voucher2.ID)

	// 4. Test Role Change - Promotion from Teacher to Admin
	teacher.Role = "admin"
	require.NoError(t, db.Model(teacher).Update("role", "admin").Error)

	voucherUpdated, err := services.EnsureUserReferralCode(db, teacher)
	require.NoError(t, err)
	assert.Equal(t, voucher.Code, voucherUpdated.Code)
	assert.Equal(t, float32(70.0), voucherUpdated.CommissionPercent)

	// 5. Test MigrateExistingAffiliateCodes
	adminUser := models.User{
		ID:       uuid.New(),
		Email:    fmt.Sprintf("admin_%s@test.com", uuid.New().String()[:8]),
		FullName: "Admin Migration Test",
		Role:     "admin",
	}
	affiliateUser := models.User{
		ID:       uuid.New(),
		Email:    fmt.Sprintf("affiliate_%s@test.com", uuid.New().String()[:8]),
		FullName: "Affiliate Migration Test",
		Role:     "affiliate",
	}
	studentUser := models.User{
		ID:       uuid.New(),
		Email:    fmt.Sprintf("student_%s@test.com", uuid.New().String()[:8]),
		FullName: "Student No Migrate Test",
		Role:     "student",
	}
	require.NoError(t, db.Create(&adminUser).Error)
	require.NoError(t, db.Create(&affiliateUser).Error)
	require.NoError(t, db.Create(&studentUser).Error)

	migrated, err := services.MigrateExistingAffiliateCodes(db)
	require.NoError(t, err)
	assert.GreaterOrEqual(t, migrated, int64(2))

	// Verify admin received GT code and voucher with 70%
	var refAdmin models.User
	require.NoError(t, db.First(&refAdmin, "id = ?", adminUser.ID).Error)
	require.NotNil(t, refAdmin.ReferralCode)
	assert.Regexp(t, `^GT\d{6}$`, *refAdmin.ReferralCode)

	var adminVoucher models.Voucher
	require.NoError(t, db.First(&adminVoucher, "code = ?", *refAdmin.ReferralCode).Error)
	assert.Equal(t, float32(70.0), adminVoucher.CommissionPercent)

	// Verify affiliate received GT code and voucher with 30%
	var refAffiliate models.User
	require.NoError(t, db.First(&refAffiliate, "id = ?", affiliateUser.ID).Error)
	require.NotNil(t, refAffiliate.ReferralCode)
	assert.Regexp(t, `^GT\d{6}$`, *refAffiliate.ReferralCode)

	var affiliateVoucher models.Voucher
	require.NoError(t, db.First(&affiliateVoucher, "code = ?", *refAffiliate.ReferralCode).Error)
	assert.Equal(t, float32(30.0), affiliateVoucher.CommissionPercent)

	// Verify student did NOT receive a referral code
	var refStudent models.User
	require.NoError(t, db.First(&refStudent, "id = ?", studentUser.ID).Error)
	assert.Nil(t, refStudent.ReferralCode)
}
