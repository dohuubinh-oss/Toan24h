package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type CommissionTransaction struct {
	ID               uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	OrderCode        int64     `gorm:"index" json:"orderCode"`
	ReferrerID       uuid.UUID `gorm:"type:uuid;index;not null" json:"referrerId"`
	StudentID         uuid.UUID `gorm:"type:uuid;index;not null" json:"studentId"`
	StudentAmount    int       `gorm:"not null" json:"studentAmount"`
	CommissionRate   float32   `gorm:"not null" json:"commissionRate"`
	CommissionAmount int       `gorm:"not null" json:"commissionAmount"`
	Status           string    `gorm:"type:varchar(20);not null;default:'pending'" json:"status"`
	CreatedAt        time.Time `json:"createdAt"`
}

func (c *CommissionTransaction) BeforeCreate(tx *gorm.DB) (err error) {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	return
}
