package utils

import (
	"bytes"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"
)

var (
	ErrAllGeminiKeysExhausted = errors.New("Hệ thống AI đang tạm thời quá tải hạn mức, vui lòng thử lại sau ít phút")
	GlobalGeminiPool          *GeminiPoolManager
)

func InitGlobalGeminiPool() {
	keysEnv := os.Getenv("GEMINI_API_KEYS")
	GlobalGeminiPool = NewGeminiPoolManager(keysEnv, 6*time.Hour)
}

func init() {
	InitGlobalGeminiPool()
}

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

	// Fallback to legacy single key (or comma-separated keys) if GEMINI_API_KEYS is not provided
	if len(parsedKeys) == 0 {
		fallback := strings.TrimSpace(os.Getenv("GEMINI_API_KEY"))
		if fallback != "" {
			parts := strings.Split(fallback, ",")
			for _, p := range parts {
				trimmed := strings.TrimSpace(p)
				if trimmed != "" {
					parsedKeys = append(parsedKeys, trimmed)
				}
			}
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
	if statusCode == 429 {
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
			cooldown := m.cooldownPeriod
			if statusCode == 503 || len(m.keys) == 1 {
				// Transient service unavailability (503) or single key should not lock out for 6 hours
				cooldown = 10 * time.Second
			}
			k.CooldownUntil = now.Add(cooldown)
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

// KeyCount returns the total number of configured keys.
func (m *GeminiPoolManager) KeyCount() int {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return len(m.keys)
}

// ExecuteWithRetry executes an HTTP request operation using the active Gemini API key.
// If the key returns an HTTP 429/503 or quota error body, it records the failure (putting that key into cooldown)
// and retries with the next healthy key in the pool until success or all available keys are exhausted.
func (m *GeminiPoolManager) ExecuteWithRetry(executeFunc func(apiKey string) (*http.Response, error)) (*http.Response, error) {
	if m == nil {
		return nil, errors.New("GeminiPoolManager is not initialized")
	}

	maxAttempts := m.KeyCount()
	if maxAttempts == 0 {
		return nil, errors.New("no Gemini API keys configured in pool")
	}

	var lastErr error
	var lastResp *http.Response

	for attempt := 0; attempt < maxAttempts; attempt++ {
		activeKey, err := m.GetActiveKey()
		if err != nil {
			return nil, err
		}

		resp, err := executeFunc(activeKey)
		if err != nil {
			return nil, err
		}

		// Read response body safely if status code is not 200 to check for Quota errors
		if resp.StatusCode != http.StatusOK {
			bodyBytes, readErr := io.ReadAll(resp.Body)
			resp.Body.Close()
			bodyStr := ""
			if readErr == nil {
				bodyStr = string(bodyBytes)
				// Re-create Body buffer for caller if it's not a retryable quota error
				resp.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))
			}

			if m.MarkKeyFailure(activeKey, resp.StatusCode, bodyStr) {
				lastErr = fmt.Errorf("Gemini API key exhausted (status %d): %s", resp.StatusCode, bodyStr)
				lastResp = resp
				continue // Retry with the next healthy active key!
			}

			// Not a quota error (e.g. 400 Bad Request, 404) -> do not rotate key, return as is
			return resp, nil
		}

		// Success!
		m.MarkKeySuccess(activeKey)
		return resp, nil
	}

	if lastResp != nil {
		return lastResp, lastErr
	}
	return nil, ErrAllGeminiKeysExhausted
}


