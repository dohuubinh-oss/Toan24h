package utils

import (
	"errors"
	"os"
	"strings"
	"sync"
	"time"
)

var ErrAllGeminiKeysExhausted = errors.New("Hệ thống AI đang tạm thời quá tải hạn mức, vui lòng thử lại sau ít phút")

type KeyState struct {
	Key           string
	CooldownUntil time.Time
	FailCount     int
	TotalSuccess  int64
}

type GeminiPoolManager struct {
	mu             sync.RWMutex
	keys           []*KeyState
	currentIndex   int
	cooldownPeriod time.Duration
	nowFunc        func() time.Time
}

// NewGeminiPoolManager creates a new Gemini key pool manager from a comma-separated string or fallback to GEMINI_API_KEY.
func NewGeminiPoolManager(keysStr string, cooldown time.Duration) *GeminiPoolManager {
	if cooldown <= 0 {
		cooldown = 6 * time.Hour
	}

	var parsedKeys []string
	if strings.TrimSpace(keysStr) != "" {
		parts := strings.Split(keysStr, ",")
		for _, p := range parts {
			trimmed := strings.TrimSpace(p)
			if trimmed != "" {
				parsedKeys = append(parsedKeys, trimmed)
			}
		}
	}

	// Fallback to legacy single key if GEMINI_API_KEYS is not provided
	if len(parsedKeys) == 0 {
		fallback := strings.TrimSpace(os.Getenv("GEMINI_API_KEY"))
		if fallback != "" {
			parsedKeys = append(parsedKeys, fallback)
		}
	}

	keyStates := make([]*KeyState, len(parsedKeys))
	for i, k := range parsedKeys {
		keyStates[i] = &KeyState{
			Key: k,
		}
	}

	return &GeminiPoolManager{
		keys:           keyStates,
		currentIndex:   0,
		cooldownPeriod: cooldown,
		nowFunc:        time.Now,
	}
}

// IsQuotaError determines whether an HTTP status code or response body indicates quota exhaustion or rate limits.
func IsQuotaError(statusCode int, responseBody string) bool {
	if statusCode == 429 || statusCode == 503 {
		return true
	}

	lower := strings.ToLower(responseBody)
	if strings.Contains(lower, "resource_exhausted") ||
		strings.Contains(lower, "quota exceeded") ||
		strings.Contains(lower, "ratelimitexceeded") ||
		strings.Contains(lower, "rate limit") {
		return true
	}

	return false
}
