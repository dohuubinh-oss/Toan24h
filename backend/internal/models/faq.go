package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// FAQDocument stores knowledge base entries and vector embeddings for RAG-powered FAQ chat.
type FAQDocument struct {
	ID        uuid.UUID      `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	Question  string         `gorm:"type:text;not null" json:"question"`
	Answer    string         `gorm:"type:text;not null" json:"answer"`
	Category  string         `gorm:"type:varchar(100);index" json:"category"` // "pricing", "exam_rules", "account", "progression", "general"
	Keywords  string         `gorm:"type:text" json:"keywords"`
	Embedding string         `gorm:"type:vector(768)" json:"-"` // 768-dim vector from Gemini text-embedding-004
	IsActive  bool           `gorm:"default:true;index" json:"isActive"`
	CreatedAt time.Time      `json:"createdAt"`
	UpdatedAt time.Time      `json:"updatedAt"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}
