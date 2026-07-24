package utils_test

import (
	"testing"

	"github.com/modeptrai/exam-model-backend/internal/utils"
)

func TestPasswordHashing(t *testing.T) {
	password := "supersecret123"

	// 1. Test Hash
	hashed, err := utils.HashPassword(password)
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}
	if hashed == "" {
		t.Fatalf("Expected hashed password, got empty string")
	}
	if hashed == password {
		t.Fatalf("Expected hashed password to be different from plain text")
	}

	// 2. Test Check Success
	err = utils.CheckPasswordHash(password, hashed)
	if err != nil {
		t.Fatalf("Expected check to pass, got error: %v", err)
	}

	// 3. Test Check Failure
	err = utils.CheckPasswordHash("wrongpassword", hashed)
	if err == nil {
		t.Fatalf("Expected check to fail with wrong password, but it passed")
	}
}
