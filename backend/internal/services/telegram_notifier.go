package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
)

type TelegramNotifier struct {
	botToken string
}

func NewTelegramNotifier() *TelegramNotifier {
	return &TelegramNotifier{
		botToken: os.Getenv("TELEGRAM_BOT_TOKEN"),
	}
}

// SendMessage sends a text message to a specific Telegram chat ID
func (s *TelegramNotifier) SendMessage(chatID int64, text string) error {
	if s.botToken == "" {
		return fmt.Errorf("TELEGRAM_BOT_TOKEN is not configured")
	}

	url := fmt.Sprintf("https://api.telegram.org/bot%s/sendMessage", s.botToken)
	
	payload := map[string]interface{}{
		"chat_id": chatID,
		"text":    text,
		"parse_mode": "HTML",
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	resp, err := http.Post(url, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("failed to send telegram message, status: %d", resp.StatusCode)
	}

	return nil
}
