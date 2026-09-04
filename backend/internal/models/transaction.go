package models

import (
	"time"

	"github.com/google/uuid"
)

type Transaction struct {
	ID        uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	UserID    uuid.UUID `gorm:"type:uuid;not null" json:"userId"`
	Amount    int       `gorm:"not null" json:"amount"`
	Plan      string    `gorm:"type:varchar(50);not null" json:"plan"`
	Status    string    `gorm:"type:varchar(50);not null;default:'pending'" json:"status"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}
