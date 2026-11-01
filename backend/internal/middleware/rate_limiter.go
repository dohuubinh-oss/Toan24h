package middleware

import (
	"context"
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/modeptrai/exam-model-backend/internal/config"
	"github.com/redis/go-redis/v9"
)

type inMemoryRateEntry struct {
	count       int
	windowStart time.Time
}

var (
	localRateStore sync.Map // key -> inMemoryRateEntry
	localRateMu    sync.Mutex
)

// RateLimiter trả về Gin middleware giới hạn số lượt request tối đa theo Client IP hoặc User ID
// trong một khoảng thời gian (window). Hỗ trợ cả Redis phân tán và Fallback In-Memory an toàn.
func RateLimiter(maxRequests int, window time.Duration, prefix string) gin.HandlerFunc {
	return func(c *gin.Context) {
		identifier := c.ClientIP()
		if uid, exists := c.Get("userID"); exists && uid != "" {
			identifier = fmt.Sprintf("u:%v", uid)
		}

		key := fmt.Sprintf("ratelimit:%s:%s", prefix, identifier)

		allowed := isAllowed(c.Request.Context(), key, maxRequests, window)
		if !allowed {
			c.Header("Retry-After", fmt.Sprintf("%d", int(window.Seconds())))
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error": "Bạn đã gửi quá nhiều yêu cầu trong thời gian ngắn. Vui lòng thử lại sau giây lát.",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

func isAllowed(ctx context.Context, key string, maxRequests int, window time.Duration) bool {
	// 1. Ưu tiên kiểm tra Redis nếu đã kết nối
	if config.RedisClient != nil {
		return checkRedisRateLimit(ctx, config.RedisClient, key, maxRequests, window)
	}

	// 2. Fallback sang In-Memory sync.Map an toàn
	return checkLocalRateLimit(key, maxRequests, window)
}

func checkRedisRateLimit(ctx context.Context, client *redis.Client, key string, maxRequests int, window time.Duration) bool {
	count, err := client.Incr(ctx, key).Result()
	if err != nil {
		// Trong trường hợp Redis lỗi tạm thời, fail-open để không chặn người dùng hợp lệ
		return true
	}

	if count == 1 {
		_ = client.Expire(ctx, key, window).Err()
	}

	return count <= int64(maxRequests)
}

func checkLocalRateLimit(key string, maxRequests int, window time.Duration) bool {
	localRateMu.Lock()
	defer localRateMu.Unlock()

	now := time.Now()
	val, ok := localRateStore.Load(key)
	if !ok {
		localRateStore.Store(key, inMemoryRateEntry{count: 1, windowStart: now})
		return true
	}

	entry := val.(inMemoryRateEntry)
	if now.Sub(entry.windowStart) > window {
		localRateStore.Store(key, inMemoryRateEntry{count: 1, windowStart: now})
		return true
	}

	if entry.count >= maxRequests {
		return false
	}

	entry.count++
	localRateStore.Store(key, entry)
	return true
}

// ResetLocalRateStoreForTest làm sạch bộ nhớ rate limit trong unit test
func ResetLocalRateStoreForTest() {
	localRateMu.Lock()
	defer localRateMu.Unlock()
	localRateStore.Range(func(key, _ any) bool {
		localRateStore.Delete(key)
		return true
	})
}
