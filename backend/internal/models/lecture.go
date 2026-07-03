package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Lecture represents a lecture created by a teacher.
type Lecture struct {
	ID           uuid.UUID        `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	Title        string           `gorm:"type:varchar(255);not null" json:"title"`
	Grade        string           `gorm:"type:varchar(50);not null" json:"grade"`
	Category     string           `gorm:"type:varchar(100);not null" json:"category"`
	BasicConcept string           `gorm:"type:text" json:"basicConcept"`
	CoverImage   string           `gorm:"type:varchar(255)" json:"coverImage"`
	VideoUrl     string           `gorm:"type:varchar(255)" json:"videoUrl"`
	Examples     []LectureExample `gorm:"foreignKey:LectureID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"examples"`
	PracticeIDs  string           `gorm:"type:jsonb;default:'[]'" json:"practiceIds"`
	CreatedAt    time.Time        `json:"createdAt"`
	UpdatedAt    time.Time        `json:"updatedAt"`
	DeletedAt    gorm.DeletedAt   `gorm:"index" json:"-"`
}

// LectureExample represents an example exercise within a lecture.
type LectureExample struct {
	ID            uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	LectureID     uuid.UUID `gorm:"type:uuid;not null;index" json:"lectureId"`
	Problem       string    `gorm:"type:text;not null" json:"problem"`
	Conclusion    string    `gorm:"type:text" json:"conclusion"`
	ProblemImage  string    `gorm:"type:varchar(255)" json:"problemImage"`
	SolutionImage string    `gorm:"type:varchar(255)" json:"solutionImage"`
	Steps         string    `gorm:"type:jsonb;default:'[]'" json:"steps"`
	Tips          string    `gorm:"type:text" json:"tips"`
	CreatedAt     time.Time `json:"createdAt"`
	UpdatedAt     time.Time `json:"updatedAt"`
}
