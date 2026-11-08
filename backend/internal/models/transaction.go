package models

import (
	"time"

	"github.com/google/uuid"
)

type Transaction struct {
	ID            uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	UserID        uuid.UUID `gorm:"type:uuid;not null;index:idx_transaction_user_created,priority:1" json:"userId"`
	OrderCode     int64     `gorm:"uniqueIndex" json:"orderCode"`
	Amount        int       `gorm:"not null" json:"amount"`
	Plan          string    `gorm:"type:varchar(50);not null" json:"plan"`
	Status        string    `gorm:"type:varchar(50);not null;default:'pending'" json:"status"`
	PaymentLinkID string    `gorm:"type:varchar(255)" json:"paymentLinkId,omitempty"`
	CheckoutURL   string    `gorm:"type:text" json:"checkoutUrl,omitempty"`
	QRCode        string    `gorm:"type:text" json:"qrCode,omitempty"`
	CreatedAt     time.Time `gorm:"index:idx_transaction_user_created,priority:2" json:"createdAt"`
	UpdatedAt     time.Time `json:"updatedAt"`
}

