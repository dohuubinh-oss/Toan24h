package services

import (
	"crypto/rand"
	"errors"
	"fmt"
	"log"
	"math/big"
	mrand "math/rand"
	"strings"

	"github.com/google/uuid"
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

// GenerateReferralCodeFromID sinh mã giới thiệu trực tiếp từ GT + 8 ký tự cuối của User ID
func GenerateReferralCodeFromID(userID uuid.UUID) string {
	if userID == uuid.Nil {
		return ""
	}
	idStr := userID.String()
	if len(idStr) >= 8 {
		return ReferralCodePrefix + strings.ToUpper(idStr[len(idStr)-8:])
	}
	return ReferralCodePrefix + strings.ToUpper(idStr)
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

// GenerateUniqueReferralCode sinh mã giới thiệu cho user: ưu tiên dùng trực tiếp ID của user
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

// EnsureUserReferralCode đảm bảo user có ReferralCode từ ID và Voucher đối tác tương ứng
// Định dạng mã: GT + 8 ký tự cuối của User ID (không cần random, không sợ trùng lặp)
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

	// Sinh mã trực tiếp từ 8 ký tự cuối của User ID
	code := GenerateReferralCodeFromID(user.ID)
	if code == "" {
		code = GenerateRandomGTCode()
	}

	// Cập nhật ReferralCode cho User nếu chưa có hoặc đang khác
	if user.ReferralCode == nil || *user.ReferralCode != code {
		user.ReferralCode = &code
		if err := db.Model(&models.User{}).Where("id = ?", user.ID).Update("referral_code", code).Error; err != nil {
			return nil, fmt.Errorf("failed to update user referral code: %w", err)
		}
	}

	// Tạo/Cập nhật Voucher đối tác tương ứng để tương thích hệ thống voucher
	var voucher models.Voucher
	err := db.Where("code = ?", code).First(&voucher).Error
	if err == nil {
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
		return nil, fmt.Errorf("failed to create voucher for referral code: %w", createErr)
	}
	if updateErr := db.Model(&newVoucher).Update("max_uses", 0).Error; updateErr != nil {
		return nil, fmt.Errorf("failed to set voucher max_uses to 0: %w", updateErr)
	}
	newVoucher.MaxUses = 0
	return &newVoucher, nil
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
