package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

type SubmissionStatus string

const (
	StatusInProgress SubmissionStatus = "in_progress"
	StatusSubmitted  SubmissionStatus = "submitted"
	StatusGraded     SubmissionStatus = "graded"
)

type AppealStatus string

const (
	AppealPending  AppealStatus = "PENDING"
	AppealApproved AppealStatus = "APPROVED"
	AppealRejected AppealStatus = "REJECTED"
)

type AppealInfo struct {
	IsAppealed      bool         `json:"is_appealed"`
	Status          AppealStatus `json:"status"`
	Message         string       `json:"message"`
	TeacherFeedback string       `json:"teacher_feedback"`
}

type QuestionAnswer struct {
	Type               string     `json:"type"`
	StudentAnswer      string     `json:"student_answer"`
	ImageURLs          []string   `json:"image_urls"`
	Score              float64    `json:"score"`
	ReasoningScore     float64    `json:"reasoning_score"`
	IsCorrect          bool       `json:"is_correct"`
	AIExplanation      string     `json:"ai_explanation"`
	AIReasoningRemark  string     `json:"ai_reasoning_remark"`
	ErrorLocation      string     `json:"error_location"`
	Appeal             AppealInfo `json:"appeal"`
	StudentExplanation string     `json:"student_explanation"`
}

type Submission struct {
	ID          uuid.UUID        `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	UserID      *uuid.UUID       `gorm:"type:uuid;index" json:"userId,omitempty"`
	ExamID      uuid.UUID        `gorm:"type:uuid;not null;index" json:"examId"`
	Status      SubmissionStatus `gorm:"type:varchar(20);not null;default:'in_progress'" json:"status"`
	TotalScore  float64          `gorm:"type:decimal(5,2);default:0" json:"totalScore"`
	AnswersJSON datatypes.JSON   `gorm:"type:jsonb" json:"answersJson"`
	StartedAt   time.Time        `gorm:"default:CURRENT_TIMESTAMP" json:"startedAt"`
	SubmittedAt *time.Time       `json:"submittedAt,omitempty"`

	CreatedAt time.Time      `json:"createdAt"`
	UpdatedAt time.Time      `json:"updatedAt"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

func (s *Submission) BeforeCreate(tx *gorm.DB) (err error) {
	if s.ID == uuid.Nil {
		s.ID = uuid.New()
	}
	return
}
