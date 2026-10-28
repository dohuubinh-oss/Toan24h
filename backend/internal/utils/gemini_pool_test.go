package utils

import (
	"bytes"
	"io"
	"net/http"
	"os"
	"sync"
	"testing"
	"time"
)

func TestGeminiPool_InitAndErrorClassifier(t *testing.T) {
	t.Run("Parse multiple keys with extra spaces and empty commas", func(t *testing.T) {
		input := "  key_pro_1 ,  key_pro_2, , key_flash_backup  , "
		pool := NewGeminiPoolManager(input, 6*time.Hour)

		if len(pool.keys) != 3 {
			t.Fatalf("Expected 3 keys, got %d", len(pool.keys))
		}
		expected := []string{"key_pro_1", "key_pro_2", "key_flash_backup"}
		for i, exp := range expected {
			if pool.keys[i].Key != exp {
				t.Errorf("Key at index %d: expected %s, got %s", i, exp, pool.keys[i].Key)
			}
		}
	})

	t.Run("Fallback to GEMINI_API_KEY when GEMINI_API_KEYS is empty", func(t *testing.T) {
		origKey := os.Getenv("GEMINI_API_KEY")
		defer os.Setenv("GEMINI_API_KEY", origKey)

		os.Setenv("GEMINI_API_KEY", "legacy_single_key")
		pool := NewGeminiPoolManager("", 6*time.Hour)

		if len(pool.keys) != 1 {
			t.Fatalf("Expected 1 fallback key, got %d", len(pool.keys))
		}
		if pool.keys[0].Key != "legacy_single_key" {
			t.Fatalf("Expected 'legacy_single_key', got %s", pool.keys[0].Key)
		}
	})

	t.Run("Fallback to comma-separated GEMINI_API_KEY when GEMINI_API_KEYS is empty", func(t *testing.T) {
		origKey := os.Getenv("GEMINI_API_KEY")
		defer os.Setenv("GEMINI_API_KEY", origKey)

		os.Setenv("GEMINI_API_KEY", "key_a, key_b , key_c")
		pool := NewGeminiPoolManager("", 6*time.Hour)

		if len(pool.keys) != 3 {
			t.Fatalf("Expected 3 fallback keys, got %d", len(pool.keys))
		}
		if pool.keys[1].Key != "key_b" {
			t.Fatalf("Expected 'key_b', got %s", pool.keys[1].Key)
		}
	})

	t.Run("IsQuotaError detection", func(t *testing.T) {
		testCases := []struct {
			name         string
			statusCode   int
			responseBody string
			expected     bool
		}{
			{"HTTP 429 Too Many Requests", 429, `{"error":{"message":"Resource has been exhausted (e.g. check quota)."}}`, true},
			{"HTTP 503 Service Unavailable", 503, `{"error":{"message":"The model is overloaded. Please try again later."}}`, false},
			{"HTTP 200 with RESOURCE_EXHAUSTED", 200, `{"error":{"status":"RESOURCE_EXHAUSTED"}}`, true},
			{"HTTP 200 with quota exceeded text", 200, `{"error":{"message":"Quota exceeded for quota metric"}}`, true},
			{"HTTP 200 with rateLimitExceeded text", 200, `{"error":{"message":"rateLimitExceeded"}}`, true},
			{"HTTP 400 Bad Request", 400, `{"error":{"message":"Invalid JSON payload received."}}`, false},
			{"HTTP 404 Not Found", 404, `{"error":{"message":"Model not found"}}`, false},
			{"HTTP 200 Success Response", 200, `{"candidates":[{"content":{"parts":[{"text":"Hello"}]}}]}`, false},
		}

		for _, tc := range testCases {
			t.Run(tc.name, func(t *testing.T) {
				actual := IsQuotaError(tc.statusCode, tc.responseBody)
				if actual != tc.expected {
					t.Errorf("IsQuotaError(%d, %s) = %v; want %v", tc.statusCode, tc.responseBody, actual, tc.expected)
				}
			})
		}
	})
}

func TestGeminiPool_StickyAndCooldown(t *testing.T) {
	fakeTime := time.Date(2026, 10, 25, 8, 0, 0, 0, time.UTC)
	now := fakeTime

	pool := NewGeminiPoolManager("key1, key2, key3", 6*time.Hour)
	pool.SetNowFunc(func() time.Time {
		return now
	})

	// 1. Sticky sequential: 5 consecutive calls must all return "key1"
	for i := 0; i < 5; i++ {
		key, err := pool.GetActiveKey()
		if err != nil {
			t.Fatalf("Unexpected error getting key: %v", err)
		}
		if key != "key1" {
			t.Fatalf("Expected sticky 'key1', got '%s'", key)
		}
	}

	// 2. Mark non-quota error (HTTP 400 Bad Request): should not cooldown
	isQuota := pool.MarkKeyFailure("key1", 400, "invalid argument")
	if isQuota {
		t.Errorf("Expected false for HTTP 400, got true")
	}
	keyAfter400, _ := pool.GetActiveKey()
	if keyAfter400 != "key1" {
		t.Fatalf("Expected key1 to remain active after HTTP 400, got '%s'", keyAfter400)
	}

	// 3. Mark quota error (HTTP 429): should cooldown key1 and switch to key2
	isQuota = pool.MarkKeyFailure("key1", 429, "rateLimitExceeded")
	if !isQuota {
		t.Errorf("Expected true for HTTP 429, got false")
	}

	keyAfter429, err := pool.GetActiveKey()
	if err != nil {
		t.Fatalf("Unexpected error getting next key: %v", err)
	}
	if keyAfter429 != "key2" {
		t.Fatalf("Expected active key to switch to 'key2', got '%s'", keyAfter429)
	}

	// 4. Mark key2 with 429: should switch to key3
	pool.MarkKeyFailure("key2", 429, "quota exceeded")
	keyAfterKey2Exhausted, err := pool.GetActiveKey()
	if err != nil {
		t.Fatalf("Unexpected error: %v", err)
	}
	if keyAfterKey2Exhausted != "key3" {
		t.Fatalf("Expected active key to switch to 'key3', got '%s'", keyAfterKey2Exhausted)
	}

	// 5. Mark key3 with 429: all keys are now in cooldown
	pool.MarkKeyFailure("key3", 429, "RESOURCE_EXHAUSTED")
	_, err = pool.GetActiveKey()
	if err != ErrAllGeminiKeysExhausted {
		t.Fatalf("Expected ErrAllGeminiKeysExhausted, got %v", err)
	}

	// 6. Advance time by 6 hours + 1 second: key1 cooldown expired, should recover!
	now = now.Add(6*time.Hour + 1*time.Second)

	recoveredKey, err := pool.GetActiveKey()
	if err != nil {
		t.Fatalf("Expected key to recover after 6 hours, got error: %v", err)
	}
	if recoveredKey != "key1" {
		t.Fatalf("Expected recovered key to be 'key1', got '%s'", recoveredKey)
	}
}

func TestGeminiPool_ExecuteWithRetry(t *testing.T) {
	var mu sync.Mutex
	calls := make(map[string]int)

	pool := NewGeminiPoolManager("key1, key2", 6*time.Hour)

	resp, err := pool.ExecuteWithRetry(func(apiKey string) (*http.Response, error) {
		mu.Lock()
		calls[apiKey]++
		mu.Unlock()

		if apiKey == "key1" {
			return &http.Response{
				StatusCode: http.StatusTooManyRequests,
				Body:       io.NopCloser(bytes.NewBufferString(`{"error":{"status":"RESOURCE_EXHAUSTED","message":"Quota exceeded"}}`)),
			}, nil
		}

		return &http.Response{
			StatusCode: http.StatusOK,
			Body:       io.NopCloser(bytes.NewBufferString(`{"candidates":[{"content":{"parts":[{"text":"Result from ` + apiKey + `"}]}}]}`)),
		}, nil
	})
	if err != nil {
		t.Fatalf("Unexpected error from ExecuteWithRetry: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		t.Fatalf("Expected status 200 OK, got %d", resp.StatusCode)
	}

	mu.Lock()
	c1 := calls["key1"]
	c2 := calls["key2"]
	mu.Unlock()

	if c1 != 1 || c2 != 1 {
		t.Fatalf("Expected key1 called once and key2 called once, got key1=%d, key2=%d", c1, c2)
	}

	// Active key should now stick to key2
	activeKey, err := pool.GetActiveKey()
	if err != nil || activeKey != "key2" {
		t.Fatalf("Expected active key to be key2, got %s (err: %v)", activeKey, err)
	}
}

func TestGeminiPool_ConcurrentAccess(t *testing.T) {
	pool := NewGeminiPoolManager("dead_key, healthy_key_1, healthy_key_2", 6*time.Hour)

	var wg sync.WaitGroup
	workers := 20

	for i := 0; i < workers; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			resp, err := pool.ExecuteWithRetry(func(apiKey string) (*http.Response, error) {
				if apiKey == "dead_key" {
					return &http.Response{
						StatusCode: http.StatusTooManyRequests,
						Body:       io.NopCloser(bytes.NewBufferString(`{"error":{"message":"Resource has been exhausted"}}`)),
					}, nil
				}
				return &http.Response{
					StatusCode: http.StatusOK,
					Body:       io.NopCloser(bytes.NewBufferString(`{"status":"ok"}`)),
				}, nil
			})
			if err != nil {
				t.Errorf("Unexpected error: %v", err)
				return
			}
			resp.Body.Close()
		}()
	}

	wg.Wait()

	activeKey, err := pool.GetActiveKey()
	if err != nil {
		t.Fatalf("Unexpected error: %v", err)
	}
	if activeKey == "dead_key" {
		t.Fatalf("Active key should not be dead_key")
	}
}



