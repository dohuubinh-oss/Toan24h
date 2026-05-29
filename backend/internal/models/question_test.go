package models_test

import (
	"context"
	"testing"
	"time"

	"github.com/modeptrai/exam-model-backend/internal/models"
	"github.com/testcontainers/testcontainers-go"
	"github.com/testcontainers/testcontainers-go/modules/postgres"
	"github.com/testcontainers/testcontainers-go/wait"
	gormpg "gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func setupTestDB(t *testing.T) (*gorm.DB, func()) {
	ctx := context.Background()

	pgContainer, err := postgres.RunContainer(ctx,
		testcontainers.WithImage("postgres:15-alpine"),
		postgres.WithDatabase("testdb"),
		postgres.WithUsername("testuser"),
		postgres.WithPassword("testpassword"),
		testcontainers.WithWaitStrategy(
			wait.ForLog("database system is ready to accept connections").
				WithOccurrence(2).WithStartupTimeout(15*time.Second),
		),
	)
	if err != nil {
		t.Fatalf("Failed to start postgres container: %v", err)
	}

	connStr, err := pgContainer.ConnectionString(ctx, "sslmode=disable")
	if err != nil {
		t.Fatalf("Failed to get connection string: %v", err)
	}

	db, err := gorm.Open(gormpg.Open(connStr), &gorm.Config{})
	if err != nil {
		t.Fatalf("Failed to connect to test db: %v", err)
	}

	err = db.AutoMigrate(&models.Question{})
	if err != nil {
		t.Fatalf("Failed to migrate: %v", err)
	}

	cleanup := func() {
		if err := pgContainer.Terminate(ctx); err != nil {
			t.Fatalf("Failed to terminate container: %v", err)
		}
	}

	return db, cleanup
}

func TestQuestionModel_CRUD(t *testing.T) {
	db, cleanup := setupTestDB(t)
	defer cleanup()

	// 1. Create Test (Single Question)
	q := models.Question{
		TypeQuestion:    "single",
		Content:         "Calculate 1 + 1",
		Type:            "Trắc nghiệm",
		Grade:           6,
		Topic:           "Arithmetic",
		DifficultyLevel: "Nhận biết",
		DifficultyPoint: 1.0,
		Point:           0.25,
		Tags:            `[]`,
		Options:         `["1", "2", "3", "4"]`,
		CorrectAnswer:   "B",
		SolutionGuide:   "Bước 1: Lấy 1 cộng 1 bằng 2.",
	}

	res := db.Create(&q)
	if res.Error != nil {
		t.Fatalf("Failed to create question: %v", res.Error)
	}

	if q.ID.String() == "" || q.ID.String() == "00000000-0000-0000-0000-000000000000" {
		t.Errorf("Expected UUID to be generated, got empty")
	}

	// 2. Create Test (Group Question with sub-questions)
	parent := models.Question{
		TypeQuestion:    "group",
		Content:         "Đọc đoạn văn sau và trả lời các câu hỏi...",
		Type:            "Tự luận",
		Grade:           9,
		Topic:           "Reading",
		DifficultyLevel: "Thông hiểu",
		DifficultyPoint: 5.0,
		Point:           1.0,
		Tags:            `[]`,
		Options:         `[]`,
		SolutionGuide:   "Xem hướng dẫn ở từng câu con.",
	}
	db.Create(&parent)

	child := models.Question{
		TypeQuestion:    "single",
		ParentID:        &parent.ID,
		Content:         "Ý chính của đoạn văn là gì?",
		Type:            "Trắc nghiệm",
		Grade:           9,
		Topic:           "Reading",
		DifficultyLevel: "Nhận biết",
		DifficultyPoint: 2.5,
		Point:           0.5,
		Tags:            `[]`,
		Options:         `["A", "B", "C", "D"]`,
		CorrectAnswer:   "A",
		SolutionGuide:   "Nằm ở câu đầu tiên.",
	}
	db.Create(&child)

	// 3. Read & Verify Hierarchy
	var fetchedChild models.Question
	db.First(&fetchedChild, "id = ?", child.ID)

	if fetchedChild.ParentID == nil || fetchedChild.ParentID.String() != parent.ID.String() {
		t.Errorf("Expected child to have parent ID %s, got %v", parent.ID.String(), fetchedChild.ParentID)
	}
}
