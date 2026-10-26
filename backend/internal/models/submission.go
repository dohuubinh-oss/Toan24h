package models

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

type SubmissionStatus string

const (
	StatusInProgress  SubmissionStatus = "in_progress"
	StatusSubmitted   SubmissionStatus = "submitted"
	StatusGraded      SubmissionStatus = "graded"
	StatusNeedsReview SubmissionStatus = "needs_review"
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

type StepGradeResult struct {
	Step            int     `json:"step"`
	Title           string  `json:"title"`
	Score           float64 `json:"score"`
	MaxScore        float64 `json:"max_score"`
	IsCorrect       bool    `json:"is_correct"`
	ErrorLocation   string  `json:"error_location,omitempty"`
	DeductionReason string  `json:"deduction_reason,omitempty"`
}

type DiagramResult struct {
	HasDiagramRequired bool    `json:"has_diagram_required"`
	Score              float64 `json:"score"`
	MaxScore           float64 `json:"max_score"`
	IsCorrect          bool    `json:"is_correct"`
	StudentDiagramURL  string  `json:"student_diagram_url,omitempty"`
	Explanation        string  `json:"explanation,omitempty"`
}

func (d *DiagramResult) UnmarshalJSON(data []byte) error {
	type Alias DiagramResult
	aux := &struct {
		HasDiagramRequiredCamel *bool    `json:"hasDiagramRequired"`
		MaxScoreCamel           *float64 `json:"maxScore"`
		IsCorrectCamel          *bool    `json:"isCorrect"`
		*Alias
	}{
		Alias: (*Alias)(d),
	}
	if err := json.Unmarshal(data, aux); err != nil {
		return err
	}
	if aux.HasDiagramRequiredCamel != nil {
		d.HasDiagramRequired = *aux.HasDiagramRequiredCamel
	}
	if aux.MaxScoreCamel != nil {
		d.MaxScore = *aux.MaxScoreCamel
	}
	if aux.IsCorrectCamel != nil {
		d.IsCorrect = *aux.IsCorrectCamel
	}
	return nil
}

type QuestionAnswer struct {
	Type                string            `json:"type"`
	StudentAnswer       string            `json:"student_answer"`
	StudentDiagramURL   string            `json:"student_diagram_url,omitempty"`
	ImageURLs           []string          `json:"image_urls"`
	Score               float64           `json:"score"`
	MaxScore            float64           `json:"max_score,omitempty"`
	ReasoningScore      float64           `json:"reasoning_score"`
	IsCorrect           bool              `json:"is_correct"`
	AIExplanation       string            `json:"ai_explanation"`
	AIReasoningRemark   string            `json:"ai_reasoning_remark"`
	ErrorLocation       string            `json:"error_location"`
	DeductionReason     string            `json:"deduction_reason,omitempty"`
	ComprehensionLevel  string            `json:"comprehension_level,omitempty"`
	IsRandomGuess       bool              `json:"is_random_guess,omitempty"`
	Appeal              AppealInfo        `json:"appeal"`
	StudentExplanation  string            `json:"student_explanation"`
	StepResults         []StepGradeResult `json:"step_results,omitempty"`
	DiagramResult       *DiagramResult    `json:"diagram_result,omitempty"`
	IsAlternativeMethod bool              `json:"is_alternative_method,omitempty"`
}

type Submission struct {
	ID                           uuid.UUID        `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	UserID                       *uuid.UUID       `gorm:"type:uuid;index" json:"userId,omitempty"`
	ExamID                       uuid.UUID        `gorm:"type:uuid;not null;index" json:"examId"`
	AttemptNumber                int              `gorm:"type:int;not null;default:1" json:"attemptNumber"`
	Status                       SubmissionStatus `gorm:"type:varchar(20);not null;default:'in_progress'" json:"status"`
	TotalScore                   float64          `gorm:"type:decimal(5,2);default:0" json:"totalScore"`
	OverallEssayFeedback         string           `gorm:"type:text" json:"overallEssayFeedback,omitempty"`
	OverallComprehensionFeedback string           `gorm:"type:text" json:"overallComprehensionFeedback,omitempty"`
	AnswersJSON                  datatypes.JSON   `gorm:"type:jsonb" json:"answersJson"`
	StartedAt                    time.Time        `gorm:"default:CURRENT_TIMESTAMP" json:"startedAt"`
	SubmittedAt                  *time.Time       `json:"submittedAt,omitempty"`

	CreatedAt time.Time      `json:"createdAt"`
	UpdatedAt time.Time      `json:"updatedAt"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

func (s *Submission) BeforeCreate(tx *gorm.DB) (err error) {
	if s.ID == uuid.Nil {
		s.ID = uuid.New()
	}
	if s.AttemptNumber <= 0 {
		s.AttemptNumber = 1
	}
	return
}
