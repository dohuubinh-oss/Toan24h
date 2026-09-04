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

func setupTransactionTestDB(t *testing.T) (*gorm.DB, func()) {
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

	// Migrate both User and Transaction
	err = db.AutoMigrate(&models.User{}, &models.Transaction{})
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

func TestTransactionModel_CRUD(t *testing.T) {
	db, cleanup := setupTransactionTestDB(t)
	defer cleanup()

	// 1. Create a user first
	u := models.User{
		Email:        "payer@example.com",
		PasswordHash: "hashed",
		FullName:     "Payer",
	}
	db.Create(&u)

	// 2. Create Transaction
	tx := models.Transaction{
		UserID: u.ID,
		Amount: 450000,
		Plan:   "3_months",
	}

	res := db.Create(&tx)
	if res.Error != nil {
		t.Fatalf("Failed to create transaction: %v", res.Error)
	}

	if tx.ID.String() == "" {
		t.Errorf("Expected UUID to be generated, got empty")
	}

	if tx.Status != "pending" {
		t.Errorf("Expected default status pending, got %v", tx.Status)
	}
}
