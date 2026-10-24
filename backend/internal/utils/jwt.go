package utils

import (
	"errors"
	"fmt"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

var (
	ErrInvalidToken     = errors.New("invalid token")
	ErrInvalidTokenType = errors.New("invalid token type")
)

type Claims struct {
	UserID    uuid.UUID `json:"userId"`
	Role      string    `json:"role"`
	Grade     string    `json:"grade"`
	TokenType string    `json:"tokenType"` // "access" | "refresh"
	jwt.RegisteredClaims
}

func getJWTSecret() []byte {
	sec := os.Getenv("JWT_SECRET")
	if sec == "" {
		sec = "toan6789_secure_jwt_secret_key_default"
	}
	return []byte(sec)
}

// GenerateAccessToken generates a short-lived access token
func GenerateAccessToken(userID uuid.UUID, role string, grade string) (string, error) {
	expirationTime := time.Now().Add(24 * time.Hour) // 24 hours for access token

	claims := &Claims{
		UserID:    userID,
		Role:      role,
		Grade:     grade,
		TokenType: "access",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Subject:   userID.String(),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(getJWTSecret())
}

// GenerateRefreshToken generates a long-lived refresh token
func GenerateRefreshToken(userID uuid.UUID) (string, error) {
	expirationTime := time.Now().Add(7 * 24 * time.Hour) // 7 days for refresh token

	claims := &Claims{
		UserID:    userID,
		Role:      "", // Refresh token usually doesn't need to carry roles, just identity
		TokenType: "refresh",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Subject:   userID.String(),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(getJWTSecret())
}

// ValidateToken validates the token and returns the claims with HMAC enforcement
func ValidateToken(tokenString string) (*Claims, error) {
	claims := &Claims{}

	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return getJWTSecret(), nil
	})

	if err != nil {
		return nil, err
	}

	if !token.Valid {
		return nil, ErrInvalidToken
	}

	return claims, nil
}

// ValidateAccessToken validates that the token is valid and is an access token
func ValidateAccessToken(tokenString string) (*Claims, error) {
	claims, err := ValidateToken(tokenString)
	if err != nil {
		return nil, err
	}
	if claims.TokenType != "" && claims.TokenType != "access" {
		return nil, ErrInvalidTokenType
	}
	return claims, nil
}

// ValidateRefreshToken validates that the token is valid and is a refresh token
func ValidateRefreshToken(tokenString string) (*Claims, error) {
	claims, err := ValidateToken(tokenString)
	if err != nil {
		return nil, err
	}
	if claims.TokenType != "" && claims.TokenType != "refresh" {
		return nil, ErrInvalidTokenType
	}
	return claims, nil
}
