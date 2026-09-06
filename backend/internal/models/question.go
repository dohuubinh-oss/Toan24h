package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Question represents a detailed math question in the system.
type Question struct {
	ID              uuid.UUID      `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	ParentID        *uuid.UUID     `gorm:"type:uuid;index" json:"parentId,omitempty"` // Dùng cho 'group' (Câu hỏi con tham chiếu câu hỏi cha)
	SubQuestions    []Question     `gorm:"foreignKey:ParentID" json:"subQuestions,omitempty"` // Dùng cho 'group' để tự động nạp các câu con

	BookName        string         `gorm:"type:varchar(255)" json:"bookName"` // Tiêu đề câu hỏi, VD: Bài 1, Câu 1
	TypeQuestion    string         `gorm:"type:varchar(20);not null" json:"typeQuestion"` // 'group', 'single'
	Content         string         `gorm:"type:text;not null" json:"content"`
	Type            string         `gorm:"type:varchar(50);not null" json:"type"`         // 'Trắc nghiệm', 'Tự luận'
	
	Grade           int            `gorm:"not null;index" json:"grade"`
	Topic           string         `gorm:"type:varchar(255);not null;index" json:"topic"`
	DifficultyLevel string         `gorm:"type:varchar(50);not null;index" json:"difficultyLevel"`
	DifficultyPoint float32        `gorm:"not null" json:"difficultyPoint"`
	Point           float32        `gorm:"not null" json:"point"`
	
	Tags            string         `gorm:"type:jsonb" json:"tags"`    // JSON array of strings
	Options         string         `gorm:"type:jsonb" json:"options"` // JSON array of options (LaTeX)
	CorrectAnswer   string         `gorm:"type:text" json:"correctAnswer"`
	
	SolutionGuide   string         `gorm:"type:text;not null" json:"solutionGuide"`
	Hint            string         `gorm:"type:text" json:"hint"`
	QuickSolveTips  string         `gorm:"type:text" json:"quickSolveTips"`
	GeneralMethod   string         `gorm:"type:text" json:"generalMethod"`
	Mistakes        string         `gorm:"type:text" json:"mistakes"`

	IsReported      bool           `gorm:"default:false" json:"isReported"`
	ReportMessage   string         `gorm:"type:text" json:"reportMessage"`

	CreatedAt       time.Time      `json:"createdAt"`
	UpdatedAt       time.Time      `json:"updatedAt"`
	DeletedAt       gorm.DeletedAt `gorm:"index" json:"-"`
}

func (q *Question) BeforeCreate(tx *gorm.DB) (err error) {
	if q.ID == uuid.Nil {
		q.ID = uuid.New()
	}
	if q.BookName == "" {
		q.BookName = q.ID.String()
	}
	return
}
