package utils

import (
	"errors"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

var (
	ErrInvalidToken = errors.New("invalid token")
)

type Claims struct {
	UserID uuid.UUID `json:"userId"`
	Role   string    `json:"role"`
	Grade  string    `json:"grade"`
	jwt.RegisteredClaims
}

func getJWTSecret() []byte {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "default_secret_key" // For dev if not set
	}
	return []byte(secret)
}

// GenerateAccessToken generates a short-lived access token
func GenerateAccessToken(userID uuid.UUID, role string, grade string) (string, error) {
	expirationTime := time.Now().Add(15 * time.Minute) // 15 mins for access token

	claims := &Claims{
		UserID: userID,
		Role:   role,
		Grade:  grade,
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
		UserID: userID,
		Role:   "", // Refresh token usually doesn't need to carry roles, just identity
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Subject:   userID.String(),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(getJWTSecret())
}

// ValidateToken validates the token and returns the claims
func ValidateToken(tokenString string) (*Claims, error) {
	claims := &Claims{}

	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
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
