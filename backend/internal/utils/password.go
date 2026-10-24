package utils

import "golang.org/x/crypto/bcrypt"

// HashPassword hashes a plain text password using bcrypt (cost 10)
func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), 10)
	return string(bytes), err
}

// CheckPasswordHash compares a plain text password with a hashed password
func CheckPasswordHash(password, hash string) error {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
}
