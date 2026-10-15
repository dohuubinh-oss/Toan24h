package utils

import (
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

func TestGetUserID(t *testing.T) {
	gin.SetMode(gin.TestMode)

	t.Run("successfully extracts uuid.UUID", func(t *testing.T) {
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		expectedUID := uuid.New()
		c.Set("userID", expectedUID)

		uid, err := GetUserID(c)
		assert.NoError(t, err)
		assert.Equal(t, expectedUID, uid)

		uidStr, err := GetUserIDString(c)
		assert.NoError(t, err)
		assert.Equal(t, expectedUID.String(), uidStr)
	})

	t.Run("successfully extracts string uuid", func(t *testing.T) {
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		expectedUID := uuid.New()
		c.Set("userID", expectedUID.String())

		uid, err := GetUserID(c)
		assert.NoError(t, err)
		assert.Equal(t, expectedUID, uid)

		uidStr, err := GetUserIDString(c)
		assert.NoError(t, err)
		assert.Equal(t, expectedUID.String(), uidStr)
	})

	t.Run("returns error when not set in context", func(t *testing.T) {
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)

		uid, err := GetUserID(c)
		assert.ErrorIs(t, err, ErrUserNotFoundInContext)
		assert.Equal(t, uuid.Nil, uid)

		uidStr, err := GetUserIDString(c)
		assert.ErrorIs(t, err, ErrUserNotFoundInContext)
		assert.Empty(t, uidStr)
	})

	t.Run("returns error when invalid string", func(t *testing.T) {
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		c.Set("userID", "not-a-uuid")

		uid, err := GetUserID(c)
		assert.Error(t, err)
		assert.Equal(t, uuid.Nil, uid)
	})

	t.Run("returns error when unexpected type", func(t *testing.T) {
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		c.Set("userID", 12345)

		uid, err := GetUserID(c)
		assert.ErrorIs(t, err, ErrInvalidUserIDType)
		assert.Equal(t, uuid.Nil, uid)
	})
}
