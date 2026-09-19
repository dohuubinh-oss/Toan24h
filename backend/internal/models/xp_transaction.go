package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type XPSourceType string

const (
	XPSourceExam     XPSourceType = "exam"
	XPSourcePractice XPSourceType = "practice"
	XPSourceLecture  XPSourceType = "lecture"
	XPSourceStreak   XPSourceType = "streak"
)

type XPTransaction struct {
	ID         uuid.UUID    `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	UserID     uuid.UUID    `gorm:"type:uuid;not null;index" json:"userId"`
	SourceType XPSourceType `gorm:"type:varchar(50);not null;index" json:"sourceType"`
	SourceID   *uuid.UUID   `gorm:"type:uuid;index" json:"sourceId,omitempty"`
	XPAmount   int          `gorm:"not null" json:"xpAmount"`
	CreatedAt  time.Time    `gorm:"default:CURRENT_TIMESTAMP" json:"createdAt"`
}

func (x *XPTransaction) BeforeCreate(tx *gorm.DB) (err error) {
	if x.ID == uuid.Nil {
		x.ID = uuid.New()
	}
	return
}
