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

// SetNowFunc overrides the current time function (mainly for unit tests simulating cooldown expiration).
func (m *GeminiPoolManager) SetNowFunc(fn func() time.Time) {
	m.mu.Lock()
	defer m.mu.Unlock()
	if fn == nil {
		m.nowFunc = time.Now
	} else {
		m.nowFunc = fn
	}
}

func (m *GeminiPoolManager) now() time.Time {
	if m.nowFunc != nil {
		return m.nowFunc()
	}
	return time.Now()
}

// GetActiveKey returns the current active Gemini API key in sticky sequential mode.
// If the current key is in cooldown, it seeks to the next available healthy key.
// If all keys are in cooldown, it returns ErrAllGeminiKeysExhausted.
func (m *GeminiPoolManager) GetActiveKey() (string, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	if len(m.keys) == 0 {
		return "", errors.New("no Gemini API keys configured")
	}

	now := m.now()

	// Check sequentially starting from currentIndex
	for i := 0; i < len(m.keys); i++ {
		idx := (m.currentIndex + i) % len(m.keys)
		k := m.keys[idx]

		// Check if key is healthy or its cooldown has expired
		if k.CooldownUntil.IsZero() || now.After(k.CooldownUntil) {
			k.CooldownUntil = time.Time{} // Clear cooldown if expired
			m.currentIndex = idx
			return k.Key, nil
		}
	}

	return "", ErrAllGeminiKeysExhausted
}

// MarkKeyFailure records a failure for a key. If it is a quota or rate-limit error,
// it puts the key into cooldown for cooldownPeriod (default 6 hours) and advances the active key index.
// Returns true if the error was treated as a quota error.
func (m *GeminiPoolManager) MarkKeyFailure(key string, statusCode int, responseBody string) bool {
	if !IsQuotaError(statusCode, responseBody) {
		return false
	}

	m.mu.Lock()
	defer m.mu.Unlock()

	now := m.now()
	for i, k := range m.keys {
		if k.Key == key {
			k.CooldownUntil = now.Add(m.cooldownPeriod)
			k.FailCount++

			// Advance currentIndex to the next key
			if len(m.keys) > 0 {
				m.currentIndex = (i + 1) % len(m.keys)
			}
			return true
		}
	}

	return false
}

// MarkKeySuccess records a successful invocation for the key.
func (m *GeminiPoolManager) MarkKeySuccess(key string) {
	m.mu.Lock()
	defer m.mu.Unlock()

	for _, k := range m.keys {
		if k.Key == key {
			k.TotalSuccess++
			k.CooldownUntil = time.Time{}
			return
		}
	}
}

