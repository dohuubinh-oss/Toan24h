package cache

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/modeptrai/exam-model-backend/internal/config"
	"github.com/redis/go-redis/v9"
)

const (
	ExamCachePrefix    = "cache:exams:"
	LectureCachePrefix = "cache:lectures:"
	DefaultTTL         = 10 * time.Minute
)

var customClient *redis.Client

func getClient() *redis.Client {
	if customClient != nil {
		return customClient
	}
	return config.RedisClient
}

// SetClientForTest cho phép mock hoặc tiêm RedisClient trong unit tests
func SetClientForTest(client *redis.Client) {
	customClient = client
}

// BuildExamCacheKey tạo khóa cache dựa trên các bộ lọc
func BuildExamCacheKey(lectureID, grade, examType string) string {
	return fmt.Sprintf("%slid=%s:g=%s:t=%s", ExamCachePrefix, lectureID, grade, examType)
}

// BuildLectureGradeCacheKey tạo khóa cache phân trang bài giảng theo khối lớp
func BuildLectureGradeCacheKey(grade string, page, limit int, publishedOnly bool) string {
	return fmt.Sprintf("%sgrade:%s:p=%d:l=%d:pub=%t", LectureCachePrefix, grade, page, limit, publishedOnly)
}

// BuildLectureAllCacheKey tạo khóa cache cho danh sách tất cả bài giảng
func BuildLectureAllCacheKey(publishedOnly bool) string {
	return fmt.Sprintf("%sall:pub=%t", LectureCachePrefix, publishedOnly)
}

// Get đọc dữ liệu từ Redis cache và deserialize vào target. Trả về true nếu Cache Hit.
func Get[T any](ctx context.Context, key string, target *T) bool {
	client := getClient()
	if client == nil {
		return false
	}

	val, err := client.Get(ctx, key).Result()
	if err != nil {
		return false
	}

	if err := json.Unmarshal([]byte(val), target); err != nil {
		return false
	}

	return true
}

// Set serialize dữ liệu sang JSON và lưu vào Redis cache với TTL
func Set(ctx context.Context, key string, data any, ttl time.Duration) error {
	client := getClient()
	if client == nil {
		return nil
	}

	bytes, err := json.Marshal(data)
	if err != nil {
		return err
	}

	return client.Set(ctx, key, bytes, ttl).Err()
}

// InvalidatePrefix xóa toàn bộ các key bắt đầu bằng tiền tố prefix bằng lệnh SCAN an toàn (không block Redis)
func InvalidatePrefix(ctx context.Context, prefix string) error {
	client := getClient()
	if client == nil {
		return nil
	}

	var cursor uint64
	matchPattern := prefix + "*"

	for {
		keys, nextCursor, err := client.Scan(ctx, cursor, matchPattern, 100).Result()
		if err != nil {
			return err
		}

		if len(keys) > 0 {
			_ = client.Del(ctx, keys...).Err()
		}

		cursor = nextCursor
		if cursor == 0 {
			break
		}
	}

	return nil
}
