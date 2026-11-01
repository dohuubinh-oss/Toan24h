package middleware_test

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/modeptrai/exam-model-backend/internal/middleware"
	"github.com/stretchr/testify/assert"
)

func TestRateLimiter_AllowsWithinLimit(t *testing.T) {
	gin.SetMode(gin.TestMode)
	middleware.ResetLocalRateStoreForTest()

	r := gin.New()
	r.POST("/api/test-limit", middleware.RateLimiter(3, time.Minute, "test-ok"), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	for i := 0; i < 3; i++ {
		req, _ := http.NewRequest("POST", "/api/test-limit", nil)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)
		assert.Equal(t, http.StatusOK, w.Code, "Request %d should be allowed", i+1)
	}
}

func TestRateLimiter_BlocksExcessRequests(t *testing.T) {
	gin.SetMode(gin.TestMode)
	middleware.ResetLocalRateStoreForTest()

	r := gin.New()
	r.POST("/api/test-block", middleware.RateLimiter(2, time.Minute, "test-block"), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	// First 2 requests succeed
	for i := 0; i < 2; i++ {
		req, _ := http.NewRequest("POST", "/api/test-block", nil)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)
		assert.Equal(t, http.StatusOK, w.Code)
	}

	// 3rd request should receive 429 Too Many Requests
	req, _ := http.NewRequest("POST", "/api/test-block", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusTooManyRequests, w.Code)
	assert.Contains(t, w.Body.String(), "quá nhiều yêu cầu")
	assert.NotEmpty(t, w.Header().Get("Retry-After"))
}

func TestRateLimiter_TracksByAuthenticatedUser(t *testing.T) {
	gin.SetMode(gin.TestMode)
	middleware.ResetLocalRateStoreForTest()

	r := gin.New()
	r.Use(func(c *gin.Context) {
		// Mock auth middleware setting user
		user := c.GetHeader("X-User-ID")
		if user != "" {
			c.Set("userID", user)
		}
		c.Next()
	})
	r.POST("/api/test-user", middleware.RateLimiter(1, time.Minute, "test-user"), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	// User 1 first request: OK
	req1, _ := http.NewRequest("POST", "/api/test-user", nil)
	req1.Header.Set("X-User-ID", "user-123")
	w1 := httptest.NewRecorder()
	r.ServeHTTP(w1, req1)
	assert.Equal(t, http.StatusOK, w1.Code)

	// User 1 second request: 429
	req2, _ := http.NewRequest("POST", "/api/test-user", nil)
	req2.Header.Set("X-User-ID", "user-123")
	w2 := httptest.NewRecorder()
	r.ServeHTTP(w2, req2)
	assert.Equal(t, http.StatusTooManyRequests, w2.Code)

	// User 2 first request from same IP: OK (tracked separately)
	req3, _ := http.NewRequest("POST", "/api/test-user", nil)
	req3.Header.Set("X-User-ID", "user-456")
	w3 := httptest.NewRecorder()
	r.ServeHTTP(w3, req3)
	assert.Equal(t, http.StatusOK, w3.Code)
}
