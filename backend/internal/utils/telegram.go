package utils

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"os"
	"sort"
	"strings"
	"time"
)

// VerifyTelegramAuth verifies the authentication data received from the Telegram Login Widget
func VerifyTelegramAuth(data map[string]string) bool {
	botToken := os.Getenv("TELEGRAM_BOT_TOKEN")
	if botToken == "" {
		return false
	}

	hash, ok := data["hash"]
	if !ok {
		return false
	}

	// Verify time to prevent outdated login attempts (e.g., 24 hours)
	authDateStr, ok := data["auth_date"]
	if ok {
		var authDate int64
		fmt.Sscanf(authDateStr, "%d", &authDate)
		if time.Now().Unix()-authDate > 86400 {
			return false
		}
	}

	var dataCheckArr []string
	for k, v := range data {
		if k != "hash" {
			dataCheckArr = append(dataCheckArr, fmt.Sprintf("%s=%s", k, v))
		}
	}
	sort.Strings(dataCheckArr)
	dataCheckString := strings.Join(dataCheckArr, "\n")

	secretKey := sha256.Sum256([]byte(botToken))
	h := hmac.New(sha256.New, secretKey[:])
	h.Write([]byte(dataCheckString))
	expectedHash := hex.EncodeToString(h.Sum(nil))

	return expectedHash == hash
}
