package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ExamResultStatus string

const (
	StatusPending   ExamResultStatus = "PENDING"
	StatusCompleted ExamResultStatus = "COMPLETED"
)

type ExamResult struct {
	ID          uuid.UUID        `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	ExamID      uuid.UUID        `gorm:"type:uuid;not null;index" json:"examId"`
	StudentID   *uuid.UUID       `gorm:"type:uuid;index" json:"studentId,omitempty"` // Nullable if guest, but let's assume auth exists
	Status      ExamResultStatus `gorm:"type:varchar(20);not null;default:'PENDING'" json:"status"`
	TotalScore  float64          `gorm:"not null;default:0" json:"totalScore"`
	MCQScore    float64          `gorm:"not null;default:0" json:"mcqScore"`
	EssayScore  float64          `gorm:"not null;default:0" json:"essayScore"`

	Details     []ResultDetail   `gorm:"foreignKey:ExamResultID" json:"details"`

	CreatedAt   time.Time        `json:"createdAt"`
	UpdatedAt   time.Time        `json:"updatedAt"`
	DeletedAt   gorm.DeletedAt   `gorm:"index" json:"-"`
}

func (e *ExamResult) BeforeCreate(tx *gorm.DB) (err error) {
	if e.ID == uuid.Nil {
		e.ID = uuid.New()
	}
	return
}

type ResultDetail struct {
	ID            uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	ExamResultID  uuid.UUID `gorm:"type:uuid;not null;index" json:"examResultId"`
	QuestionID    uuid.UUID `gorm:"type:uuid;not null;index" json:"questionId"`
	StudentAnswer string    `gorm:"type:text" json:"studentAnswer"`
	ImagePath     string    `gorm:"type:varchar(255)" json:"imagePath"` // Path to saved image in "test" folder
	Score         float64   `gorm:"not null;default:0" json:"score"`
	IsCorrect     bool      `gorm:"not null;default:false" json:"isCorrect"`
	AIExplanation string    `gorm:"type:text" json:"aiExplanation"`
	ErrorLocation string    `gorm:"type:text" json:"errorLocation"` // Quote where the student made a mistake
	IsAppealed    bool      `gorm:"not null;default:false" json:"isAppealed"`
	AppealStatus  string    `gorm:"type:varchar(20)" json:"appealStatus"` // PENDING, APPROVED, REJECTED
	AppealMessage string    `gorm:"type:text" json:"appealMessage"`

	CreatedAt     time.Time `json:"createdAt"`
	UpdatedAt     time.Time `json:"updatedAt"`
}

func (d *ResultDetail) BeforeCreate(tx *gorm.DB) (err error) {
	if d.ID == uuid.Nil {
		d.ID = uuid.New()
	}
	return
}
