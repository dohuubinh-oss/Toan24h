package utils

import (
	"os"
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

	t.Run("IsQuotaError detection", func(t *testing.T) {
		testCases := []struct {
			name         string
			statusCode   int
			responseBody string
			expected     bool
		}{
			{"HTTP 429 Too Many Requests", 429, `{"error":{"message":"Resource has been exhausted (e.g. check quota)."}}`, true},
			{"HTTP 503 Service Unavailable", 503, `{"error":{"message":"The model is overloaded. Please try again later."}}`, true},
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
