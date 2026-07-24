package models

import (
	"time"

	"github.com/google/uuid"
)

type LectureBookmark struct {
	ID        uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	UserID    uuid.UUID `gorm:"type:uuid;not null;uniqueIndex:idx_user_lecture" json:"userId"`
	LectureID uuid.UUID `gorm:"type:uuid;not null;uniqueIndex:idx_user_lecture" json:"lectureId"`
	CreatedAt time.Time `json:"createdAt"`

	// Associations
	User    User    `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Lecture Lecture `gorm:"foreignKey:LectureID" json:"lecture,omitempty"`
}
