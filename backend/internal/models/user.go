package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type User struct {
	ID           uuid.UUID      `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	Email        string         `gorm:"type:varchar(255);uniqueIndex" json:"email"`
	PasswordHash string         `gorm:"type:varchar(255)" json:"-"`
	FullName     string         `gorm:"type:varchar(255);not null" json:"fullName"`
	TelegramID   *int64         `gorm:"uniqueIndex" json:"telegramId"`
	TelegramUser *string        `gorm:"type:varchar(255)" json:"telegramUsername"`
	TelegramAvt  *string        `gorm:"type:text" json:"telegramPhotoUrl"`
	Role         string         `gorm:"type:varchar(50);not null;default:'student'" json:"role"`
	Grade        string         `gorm:"type:varchar(50)" json:"grade"`
	Points       int            `gorm:"not null;default:0" json:"points"`
	Status       string         `gorm:"type:varchar(50);not null;default:'active'" json:"status"`
	ExpiresAt    *time.Time     `json:"expiresAt"`
	CreatedAt    time.Time      `json:"createdAt"`
	UpdatedAt    time.Time      `json:"updatedAt"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
}
