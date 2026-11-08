package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type CommissionTransaction struct {
	ID               uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	OrderCode        int64     `gorm:"not null;uniqueIndex:idx_comm_order_referrer_type" json:"orderCode"`
	ReferrerID       uuid.UUID `gorm:"type:uuid;not null;index;uniqueIndex:idx_comm_order_referrer_type" json:"referrerId"`
	StudentID        uuid.UUID `gorm:"type:uuid;index;not null" json:"studentId"`
	StudentAmount    int       `gorm:"not null" json:"studentAmount"`
	CommissionRate   float32   `gorm:"not null" json:"commissionRate"`
	CommissionAmount int       `gorm:"not null" json:"commissionAmount"`
	CommissionType   string    `gorm:"type:varchar(50);not null;default:'direct';uniqueIndex:idx_comm_order_referrer_type" json:"commissionType"`
	Note             string    `gorm:"type:varchar(255)" json:"note"`
	Status           string    `gorm:"type:varchar(20);not null;default:'pending';index" json:"status"`
	CreatedAt        time.Time `json:"createdAt"`
}

func (c *CommissionTransaction) BeforeCreate(tx *gorm.DB) (err error) {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	if c.CommissionType == "" {
		c.CommissionType = "direct"
	}
	return
}
