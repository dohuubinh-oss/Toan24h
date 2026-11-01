package cache_test

import (
	"context"
	"testing"
	"time"

	"github.com/modeptrai/exam-model-backend/internal/cache"
	"github.com/stretchr/testify/assert"
)

func TestCache_KeyBuilders(t *testing.T) {
	examKey := cache.BuildExamCacheKey("lec-123", "9", "exam")
	assert.Equal(t, "cache:exams:lid=lec-123:g=9:t=exam", examKey)

	lectureGradeKey := cache.BuildLectureGradeCacheKey("8", 1, 9)
	assert.Equal(t, "cache:lectures:grade:8:p=1:l=9", lectureGradeKey)

	lectureAllKey := cache.BuildLectureAllCacheKey()
	assert.Equal(t, "cache:lectures:all", lectureAllKey)
}

func TestCache_NilClientGracefulFallback(t *testing.T) {
	ctx := context.Background()

	// Ensure no test client is injected
	cache.SetClientForTest(nil)

	// Get should return false when Redis is nil (cache miss gracefully)
	var data []string
	hit := cache.Get(ctx, "cache:exams:test", &data)
	assert.False(t, hit)

	// Set should succeed silently without crashing
	err := cache.Set(ctx, "cache:exams:test", []string{"a", "b"}, 10*time.Minute)
	assert.NoError(t, err)

	// InvalidatePrefix should succeed silently without crashing
	err = cache.InvalidatePrefix(ctx, cache.ExamCachePrefix)
	assert.NoError(t, err)
}
