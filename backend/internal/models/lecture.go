package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Lecture struct {
	ID           uuid.UUID      `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	Title        string         `gorm:"type:varchar(255);not null" json:"title"`
	Grade        string         `gorm:"type:varchar(50);not null" json:"grade"`
	Category     string         `gorm:"type:varchar(100);not null" json:"category"`
	BasicConcept string         `gorm:"type:text" json:"basicConcept"`
	Examples     string         `gorm:"type:jsonb;default:'[]'" json:"examples"`
	PracticeIDs  string         `gorm:"type:jsonb;default:'[]'" json:"practiceIds"`
	CreatedAt    time.Time      `json:"createdAt"`
	UpdatedAt    time.Time      `json:"updatedAt"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
}
