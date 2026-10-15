package utils

import (
	"errors"
	"fmt"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

var (
	ErrUserNotFoundInContext = errors.New("user ID not found in context")
	ErrInvalidUserIDType     = errors.New("invalid user ID type in context")
)

// GetUserID extracts the userID from gin context as uuid.UUID
func GetUserID(c *gin.Context) (uuid.UUID, error) {
	val, exists := c.Get("userID")
	if !exists {
		return uuid.Nil, ErrUserNotFoundInContext
	}

	switch id := val.(type) {
	case uuid.UUID:
		return id, nil
	case string:
		parsed, err := uuid.Parse(id)
		if err != nil {
			return uuid.Nil, fmt.Errorf("%w: %v", ErrInvalidUserIDType, err)
		}
		return parsed, nil
	default:
		return uuid.Nil, ErrInvalidUserIDType
	}
}

// GetUserIDString extracts the userID from gin context as string
func GetUserIDString(c *gin.Context) (string, error) {
	uid, err := GetUserID(c)
	if err != nil {
		return "", err
	}
	return uid.String(), nil
}
