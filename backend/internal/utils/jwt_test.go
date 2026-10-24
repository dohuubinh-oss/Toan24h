package utils_test

import (
	"os"
	"testing"

	"github.com/google/uuid"
	"github.com/modeptrai/exam-model-backend/internal/utils"
)

func TestJWTGenerationAndValidation(t *testing.T) {
	os.Setenv("JWT_SECRET", "supersecretkey")

	userID := uuid.New()
	role := "student"
	grade := "9"

	// 1. Generate Access Token
	accessToken, err := utils.GenerateAccessToken(userID, role, grade)
	if err != nil {
		t.Fatalf("Failed to generate access token: %v", err)
	}
	if accessToken == "" {
		t.Fatalf("Access token is empty")
	}

	// 2. Generate Refresh Token
	refreshToken, err := utils.GenerateRefreshToken(userID)
	if err != nil {
		t.Fatalf("Failed to generate refresh token: %v", err)
	}
	if refreshToken == "" {
		t.Fatalf("Refresh token is empty")
	}

	// 3. Validate Access Token
	claims, err := utils.ValidateAccessToken(accessToken)
	if err != nil {
		t.Fatalf("Failed to validate access token: %v", err)
	}
	if claims.UserID != userID {
		t.Errorf("Expected UserID %v, got %v", userID, claims.UserID)
	}
	if claims.Role != role {
		t.Errorf("Expected Role %v, got %v", role, claims.Role)
	}
	if claims.TokenType != "access" {
		t.Errorf("Expected TokenType access, got %v", claims.TokenType)
	}

	// 4. Access token should fail refresh token validation
	if _, err := utils.ValidateRefreshToken(accessToken); err == nil {
		t.Fatalf("Expected error when validating access token as refresh token, got nil")
	}

	// 5. Validate Refresh Token
	refreshClaims, err := utils.ValidateRefreshToken(refreshToken)
	if err != nil {
		t.Fatalf("Failed to validate refresh token: %v", err)
	}
	if refreshClaims.UserID != userID {
		t.Errorf("Expected UserID %v, got %v", userID, refreshClaims.UserID)
	}
	if refreshClaims.Role != "" {
		t.Errorf("Expected Role empty for refresh token, got %v", refreshClaims.Role)
	}
	if refreshClaims.TokenType != "refresh" {
		t.Errorf("Expected TokenType refresh, got %v", refreshClaims.TokenType)
	}

	// 6. Refresh token should fail access token validation
	if _, err := utils.ValidateAccessToken(refreshToken); err == nil {
		t.Fatalf("Expected error when validating refresh token as access token, got nil")
	}

	// 7. Test Expired / Invalid Token
	_, err = utils.ValidateToken("invalid.token.string")
	if err == nil {
		t.Fatalf("Expected error for invalid token, got nil")
	}
}
