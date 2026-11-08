package models

import (
	"time"
	"github.com/google/uuid"
)

type Notification struct {
	ID        uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	UserID    uuid.UUID `gorm:"type:uuid;not null;index:idx_notif_user_created,priority:1" json:"userId"`
	Title     string    `gorm:"type:varchar(255)" json:"title"`
	Message   string    `gorm:"type:text" json:"message"`
	IsRead    bool      `gorm:"default:false;index" json:"isRead"`
	Link      string    `gorm:"type:varchar(255)" json:"link"`
	CreatedAt time.Time `gorm:"index:idx_notif_user_created,priority:2" json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}
