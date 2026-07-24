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

func setupUserTestDB(t *testing.T) (*gorm.DB, func()) {
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

	err = db.AutoMigrate(&models.User{})
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

func TestUserModel_CRUD(t *testing.T) {
	db, cleanup := setupUserTestDB(t)
	defer cleanup()

	// 1. Create Test
	u := models.User{
		Email:        "student@example.com",
		PasswordHash: "hashedpassword",
		FullName:     "Test Student",
		Role:         "student",
		Grade:        "9",
	}

	res := db.Create(&u)
	if res.Error != nil {
		t.Fatalf("Failed to create user: %v", res.Error)
	}

	if u.ID.String() == "" || u.ID.String() == "00000000-0000-0000-0000-000000000000" {
		t.Errorf("Expected UUID to be generated, got empty")
	}

	// 2. Read Test
	var fetched models.User
	db.First(&fetched, "id = ?", u.ID)

	if fetched.Email != "student@example.com" {
		t.Errorf("Expected email student@example.com, got %v", fetched.Email)
	}
}
