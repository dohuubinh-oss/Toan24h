package models

import (
	"strings"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Voucher struct {
	ID                uuid.UUID  `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	Code              string     `gorm:"type:varchar(50);uniqueIndex;not null" json:"code"`
	AffiliateID       *uuid.UUID `gorm:"type:uuid;index" json:"affiliateId,omitempty"`
	FreeMonths        int        `gorm:"not null;default:0" json:"freeMonths"`
	DiscountPercent   int        `gorm:"not null;default:0" json:"discountPercent"`
	CommissionPercent float32    `gorm:"not null;default:30" json:"commissionPercent"`
	MaxUses           int        `gorm:"not null;default:100" json:"maxUses"`
	UsedCount         int        `gorm:"not null;default:0" json:"usedCount"`
	ExpiresAt         *time.Time `gorm:"index" json:"expiresAt,omitempty"`
	IsActive          bool       `gorm:"not null;default:true" json:"isActive"`
	CreatedAt         time.Time  `json:"createdAt"`
	UpdatedAt         time.Time  `json:"updatedAt"`
}

func (v *Voucher) BeforeCreate(tx *gorm.DB) (err error) {
	if v.ID == uuid.Nil {
		v.ID = uuid.New()
	}
	v.Code = strings.ToUpper(strings.TrimSpace(v.Code))
	return
}

func (v *Voucher) IsValid() bool {
	if !v.IsActive {
		return false
	}
	if v.ExpiresAt != nil && time.Now().After(*v.ExpiresAt) {
		return false
	}
	if v.MaxUses > 0 && v.UsedCount >= v.MaxUses {
		return false
	}
	return true
}

type VoucherUsage struct {
	ID          uuid.UUID  `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	VoucherID   uuid.UUID  `gorm:"type:uuid;not null;index" json:"voucherId"`
	UserID      uuid.UUID  `gorm:"type:uuid;not null;index" json:"userId"`
	AffiliateID *uuid.UUID `gorm:"type:uuid;index" json:"affiliateId,omitempty"`
	CreatedAt   time.Time  `json:"createdAt"`
}

func (vu *VoucherUsage) BeforeCreate(tx *gorm.DB) (err error) {
	if vu.ID == uuid.Nil {
		vu.ID = uuid.New()
	}
	return
}
