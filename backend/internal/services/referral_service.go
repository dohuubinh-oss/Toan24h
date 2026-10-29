package services

import (
	"crypto/rand"
	"errors"
	"fmt"
	"log"
	"math/big"
	mrand "math/rand"
	"strings"

	"github.com/modeptrai/exam-model-backend/internal/models"
	"gorm.io/gorm"
)

const (
	// ReferralCodePrefix là tiền tố mã giới thiệu
	ReferralCodePrefix = "GT"
	// MaxGenerateAttempts số lần thử tối đa khi sinh mã để tránh trùng lặp
	MaxGenerateAttempts = 5
)

// Commission rates by role
const (
	CommissionRateTeacher   float32 = 60.0
	CommissionRateAdmin     float32 = 70.0
	CommissionRateAffiliate float32 = 30.0
	CommissionRateDefault   float32 = 30.0
)

// IsPartnerRole kiểm tra xem role có phải là đối tác được cấp mã GT và hưởng hoa hồng (admin, teacher, affiliate) hay không
func IsPartnerRole(role string) bool {
	switch strings.ToLower(strings.TrimSpace(role)) {
	case "admin", "teacher", "affiliate":
		return true
	default:
		return false
	}
}

// GetCommissionRateByRole trả về tỷ lệ hoa hồng voucher tương ứng theo vai trò người dùng
func GetCommissionRateByRole(role string) float32 {
	switch strings.ToLower(strings.TrimSpace(role)) {
	case "admin":
		return CommissionRateAdmin
	case "teacher":
		return CommissionRateTeacher
	case "affiliate":
		return CommissionRateAffiliate
	default:
		return CommissionRateDefault
	}
}

// GenerateRandomGTCode sinh chuỗi mã ngẫu nhiên có định dạng GTxxxxxx (8 ký tự)
func GenerateRandomGTCode() string {
	n, err := rand.Int(rand.Reader, big.NewInt(1000000))
	if err != nil {
		// Fallback an toàn nếu crypto/rand lỗi
		return fmt.Sprintf("%s%06d", ReferralCodePrefix, mrand.Intn(1000000))
	}
	return fmt.Sprintf("%s%06d", ReferralCodePrefix, n.Int64())
}

// GenerateUniqueReferralCode sinh mã giới thiệu ngẫu nhiên GTxxxxxx không trùng lặp
// Kiểm tra cả bảng vouchers (cột code) và users (cột referral_code), thử lại tối đa 5 lần.
func GenerateUniqueReferralCode(db *gorm.DB) (string, error) {
	for attempt := 1; attempt <= MaxGenerateAttempts; attempt++ {
		code := GenerateRandomGTCode()

		if db == nil {
			return code, nil
		}

		var voucherCount int64
		if err := db.Model(&models.Voucher{}).Where("code = ?", code).Count(&voucherCount).Error; err != nil {
			return "", fmt.Errorf("failed to check voucher code collision: %w", err)
		}
		if voucherCount > 0 {
			continue
		}

		var userCount int64
		if err := db.Model(&models.User{}).Where("referral_code = ?", code).Count(&userCount).Error; err != nil {
			return "", fmt.Errorf("failed to check user referral_code collision: %w", err)
		}
		if userCount > 0 {
			continue
		}

		return code, nil
	}

	return "", fmt.Errorf("failed to generate unique referral code after %d attempts", MaxGenerateAttempts)
}

// EnsureUserReferralCode đảm bảo user có ReferralCode và Voucher đối tác tương ứng
// Thiết lập tỷ lệ hoa hồng đúng theo role (teacher 60%, admin 70%, affiliate 30%).
// Đảm bảo Idempotent: nếu đã có mã và voucher, không tạo mã mới, chỉ cập nhật tỷ lệ nếu đổi role.
func EnsureUserReferralCode(db *gorm.DB, user *models.User) (*models.Voucher, error) {
	if user == nil {
		return nil, errors.New("user is required")
	}
	if db == nil {
		return nil, errors.New("db is required")
	}

	// Chỉ cấp mã giới thiệu GT... và Voucher đối tác cho admin, teacher, affiliate
	if !IsPartnerRole(user.Role) {
		return nil, nil
	}

	targetCommission := GetCommissionRateByRole(user.Role)

	// Trường hợp 1: Người dùng đã có ReferralCode
	if user.ReferralCode != nil && strings.TrimSpace(*user.ReferralCode) != "" {
		code := strings.ToUpper(strings.TrimSpace(*user.ReferralCode))

		var voucher models.Voucher
		err := db.Where("code = ?", code).First(&voucher).Error
		if err == nil {
			// Voucher đã tồn tại. Nếu user đổi vai trò (thay đổi tỷ lệ hoa hồng), cập nhật lại
			if voucher.CommissionPercent != targetCommission {
				if updateErr := db.Model(&voucher).Update("commission_percent", targetCommission).Error; updateErr != nil {
					return nil, fmt.Errorf("failed to update voucher commission percent: %w", updateErr)
				}
				voucher.CommissionPercent = targetCommission
			}
			return &voucher, nil
		} else if !errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("failed to query existing voucher: %w", err)
		}

		// Voucher chưa tồn tại cho mã này, tạo mới
		newVoucher := models.Voucher{
			Code:              code,
			AffiliateID:       &user.ID,
			FreeMonths:        1,
			DiscountPercent:   0,
			CommissionPercent: targetCommission,
			MaxUses:           0,
			UsedCount:         0,
			ExpiresAt:         nil,
			IsActive:          true,
		}
		if createErr := db.Create(&newVoucher).Error; createErr != nil {
			return nil, fmt.Errorf("failed to create voucher for existing referral code: %w", createErr)
		}
		if updateErr := db.Model(&newVoucher).Update("max_uses", 0).Error; updateErr != nil {
			return nil, fmt.Errorf("failed to set voucher max_uses to 0: %w", updateErr)
		}
		newVoucher.MaxUses = 0
		return &newVoucher, nil
	}

	// Trường hợp 2: Người dùng chưa có ReferralCode -> Sinh mã mới và tạo Voucher trong transaction
	var createdVoucher *models.Voucher
	err := db.Transaction(func(tx *gorm.DB) error {
		code, err := GenerateUniqueReferralCode(tx)
		if err != nil {
			return err
		}

		// Cập nhật ReferralCode cho User
		if err := tx.Model(&models.User{}).Where("id = ?", user.ID).Update("referral_code", code).Error; err != nil {
			return fmt.Errorf("failed to update user referral code: %w", err)
		}
		user.ReferralCode = &code

		// Tạo Voucher đối tác
		v := models.Voucher{
			Code:              code,
			AffiliateID:       &user.ID,
			FreeMonths:        1,
			DiscountPercent:   0,
			CommissionPercent: targetCommission,
			MaxUses:           0,
			UsedCount:         0,
			ExpiresAt:         nil,
			IsActive:          true,
		}
		if err := tx.Create(&v).Error; err != nil {
			return fmt.Errorf("failed to create voucher: %w", err)
		}
		// Đảm bảo max_uses = 0 (không giới hạn) không bị GORM ghi đè bởi tag default:100
		if err := tx.Model(&v).Update("max_uses", 0).Error; err != nil {
			return fmt.Errorf("failed to set voucher max_uses to 0: %w", err)
		}
		v.MaxUses = 0
		createdVoucher = &v
		return nil
	})

	if err != nil {
		return nil, err
	}

	return createdVoucher, nil
}

// MigrateExistingAffiliateCodes quét tất cả các tài khoản admin, teacher, affiliate chưa có ReferralCode
// và tự động sinh mã GT... cùng Voucher tương ứng cho họ.
func MigrateExistingAffiliateCodes(db *gorm.DB) (int64, error) {
	if db == nil {
		return 0, nil
	}

	var users []models.User
	err := db.Where("role IN ? AND (referral_code IS NULL OR referral_code = '')", []string{"admin", "teacher", "affiliate"}).Find(&users).Error
	if err != nil {
		return 0, fmt.Errorf("failed to query users for affiliate code migration: %w", err)
	}

	var migratedCount int64
	for i := range users {
		user := &users[i]
		_, err := EnsureUserReferralCode(db, user)
		if err != nil {
			log.Printf("[MIGRATION WARNING] Failed to ensure referral code for user %s (role: %s): %v", user.ID, user.Role, err)
			continue
		}
		migratedCount++
	}

	if migratedCount > 0 {
		log.Printf("[MIGRATION] Successfully created GT referral codes and vouchers for %d users", migratedCount)
	}

	return migratedCount, nil
}
