package models

import (
	"time"

	"github.com/google/uuid"
	"github.com/lib/pq"
	"gorm.io/gorm"
)

// Exam represents an exam or practice test composed of multiple questions.
type Exam struct {
	ID          uuid.UUID      `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	Title       string         `gorm:"type:varchar(255);not null" json:"title"`
	ExamCode    string         `gorm:"type:varchar(50);not null" json:"examCode"`
	Type        string         `gorm:"type:varchar(50);not null" json:"type"` // 'exam' or 'practice'
	Grade       string         `gorm:"type:varchar(50);not null" json:"grade"`
	Duration    int            `gorm:"not null;default:0" json:"duration"` // in minutes
	DiffScore   float64        `gorm:"not null;default:0" json:"diffScore"`
	QuestionIDs pq.StringArray `gorm:"type:text[]" json:"questionIds"`
	LectureID   *uuid.UUID     `gorm:"type:uuid;index" json:"lectureId,omitempty"`

	CreatedAt   time.Time      `json:"createdAt"`
	UpdatedAt   time.Time      `json:"updatedAt"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}

func (e *Exam) BeforeCreate(tx *gorm.DB) (err error) {
	if e.ID == uuid.Nil {
		e.ID = uuid.New()
	}
	return
}
