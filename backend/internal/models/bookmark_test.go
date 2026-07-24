package models_test

import (
	"context"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/modeptrai/exam-model-backend/internal/models"
	"github.com/testcontainers/testcontainers-go"
	"github.com/testcontainers/testcontainers-go/modules/postgres"
	"github.com/testcontainers/testcontainers-go/wait"
	gormpg "gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func setupBookmarkTestDB(t *testing.T) (*gorm.DB, func()) {
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

	err = db.AutoMigrate(&models.User{}, &models.Lecture{}, &models.LectureBookmark{})
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

func TestLectureBookmarkModel_CRUD(t *testing.T) {
	db, cleanup := setupBookmarkTestDB(t)
	defer cleanup()

	// 1. Create a User
	u := models.User{
		Email:        "student2@example.com",
		PasswordHash: "hashed",
		FullName:     "Test",
	}
	db.Create(&u)

	// 2. Create a Lecture
	l := models.Lecture{
		Title:    "Test Lecture",
		Grade:    "9",
		Category: "Math",
	}
	db.Create(&l)

	// 3. Create Bookmark
	b := models.LectureBookmark{
		UserID:    u.ID,
		LectureID: l.ID,
	}

	res := db.Create(&b)
	if res.Error != nil {
		t.Fatalf("Failed to create bookmark: %v", res.Error)
	}

	if b.ID == uuid.Nil {
		t.Errorf("Expected UUID to be generated, got empty")
	}

	// 4. Read Bookmark
	var fetched models.LectureBookmark
	db.Preload("User").Preload("Lecture").First(&fetched, "id = ?", b.ID)

	if fetched.UserID != u.ID || fetched.LectureID != l.ID {
		t.Errorf("Expected bookmark to link to user %v and lecture %v, got %v and %v", u.ID, l.ID, fetched.UserID, fetched.LectureID)
	}

	if fetched.User.Email != u.Email {
		t.Errorf("Expected preloaded user email %v, got %v", u.Email, fetched.User.Email)
	}
	
	if fetched.Lecture.Title != l.Title {
		t.Errorf("Expected preloaded lecture title %v, got %v", l.Title, fetched.Lecture.Title)
	}
}
