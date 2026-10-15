package utils

import (
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func TestFormatExpiresAt(t *testing.T) {
	assert.Empty(t, FormatExpiresAt(nil))

	now := time.Now()
	formatted := FormatExpiresAt(&now)
	assert.NotEmpty(t, formatted)
	assert.Equal(t, now.Format(time.RFC3339), formatted)
}

func TestSetAndClearAuthCookies(t *testing.T) {
	gin.SetMode(gin.TestMode)

	t.Run("sets cookies properly on localhost", func(t *testing.T) {
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		c.Request = httptest.NewRequest("GET", "http://localhost:8080/api/v1/auth/me", nil)

		SetAuthCookies(c, "access-token-123", "refresh-token-456", "student", "9", "2026-10-13T00:00:00Z")

		cookies := w.Result().Cookies()
		cookieMap := make(map[string]string)
		for _, ck := range cookies {
			cookieMap[ck.Name] = ck.Value
		}

		assert.Equal(t, "access-token-123", cookieMap["accessToken"])
		assert.Equal(t, "refresh-token-456", cookieMap["refreshToken"])
		assert.Equal(t, "student", cookieMap["userRole"])
		assert.Equal(t, "9", cookieMap["userGrade"])
		assert.Contains(t, cookieMap["userExpiresAt"], "2026-10-13")
	})

	t.Run("clears cookies properly", func(t *testing.T) {
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		c.Request = httptest.NewRequest("GET", "http://localhost:8080/api/v1/auth/logout", nil)

		ClearAuthCookies(c)

		cookies := w.Result().Cookies()
		for _, ck := range cookies {
			assert.Equal(t, -1, ck.MaxAge)
			assert.Empty(t, ck.Value)
		}
	})
}
