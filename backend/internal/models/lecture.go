package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Lecture struct {
	ID           uuid.UUID      `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	Title        string         `gorm:"type:varchar(255);not null" json:"title"`
	Grade        string         `gorm:"type:varchar(50);not null;index:idx_lecture_grade_pub,priority:1" json:"grade"`
	Category     string         `gorm:"type:varchar(100);not null;index" json:"category"`
	BasicConcept string         `gorm:"type:text" json:"basicConcept"`
	Examples     string         `gorm:"type:jsonb;default:'[]'" json:"examples"`
	GgLink       string         `gorm:"type:text;column:gg_link" json:"gg_link"`
	AuthorID     *uuid.UUID     `gorm:"type:uuid;index" json:"authorId,omitempty"`
	Author       *User          `gorm:"foreignKey:AuthorID" json:"author,omitempty"`
	IsPublished  bool           `gorm:"default:true;index;index:idx_lecture_grade_pub,priority:2" json:"isPublished"`
	CreatedAt    time.Time      `json:"createdAt"`
	UpdatedAt    time.Time      `json:"updatedAt"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
}
