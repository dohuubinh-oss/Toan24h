package services

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/modeptrai/exam-model-backend/internal/models"
	"gorm.io/gorm"
)

type TelegramQRSessionData struct {
	SessionID    string       `json:"sessionId"`
	LinkUserID   string       `json:"linkUserId,omitempty"`
	LinkSlot     string       `json:"linkSlot,omitempty"` // "1" | "2"
	Status       string       `json:"status"`             // "waiting" | "completed"
	TelegramID   int64        `json:"telegramId"`
	TelegramUser string       `json:"telegramUsername"`
	User         *models.User `json:"user,omitempty"`
	AccessToken  string       `json:"accessToken,omitempty"`
	RefreshToken string       `json:"refreshToken,omitempty"`
	CreatedAt    time.Time    `json:"createdAt"`
}

var (
	TelegramQRStore sync.Map
)

func evictExpiredTelegramQRSessions() {
	now := time.Now()
	TelegramQRStore.Range(func(key, val interface{}) bool {
		if session, ok := val.(TelegramQRSessionData); ok {
			if now.Sub(session.CreatedAt) > 15*time.Minute {
				TelegramQRStore.Delete(key)
			}
		}
		return true
	})
}

// CreateTelegramQRSession generates a new session and returns sessionID + deepLink
func CreateTelegramQRSession() (string, string) {
	return CreateTelegramQRSessionWithLink("", "1")
}

// CreateTelegramQRSessionWithLink generates a new session with optional user linking and slot
func CreateTelegramQRSessionWithLink(linkUserID string, linkSlot string) (string, string) {
	evictExpiredTelegramQRSessions()
	bytes := make([]byte, 16)
	_, _ = rand.Read(bytes)
	sessionID := hex.EncodeToString(bytes)

	botUsername := os.Getenv("TELEGRAM_BOT_USERNAME")
	if botUsername == "" {
		botUsername = "toan6789_bot"
	}

	if linkSlot == "" {
		linkSlot = "1"
	}

	session := TelegramQRSessionData{
		SessionID:  sessionID,
		LinkUserID: linkUserID,
		LinkSlot:   linkSlot,
		Status:     "waiting",
		CreatedAt:  time.Now(),
	}
	TelegramQRStore.Store(sessionID, session)

	deepLink := fmt.Sprintf("https://t.me/%s?start=login_%s", botUsername, sessionID)
	return sessionID, deepLink
}

// RegisterTelegramQRSession ensures a sessionID is tracked
func RegisterTelegramQRSession(sessionID string) {
	RegisterTelegramQRSessionWithLink(sessionID, "", "1")
}

// RegisterTelegramQRSessionWithLink ensures a sessionID is tracked with optional linkUserID and linkSlot
func RegisterTelegramQRSessionWithLink(sessionID string, linkUserID string, linkSlot string) {
	if linkSlot == "" {
		linkSlot = "1"
	}
	if val, ok := TelegramQRStore.Load(sessionID); !ok {
		TelegramQRStore.Store(sessionID, TelegramQRSessionData{
			SessionID:  sessionID,
			LinkUserID: linkUserID,
			LinkSlot:   linkSlot,
			Status:     "waiting",
			CreatedAt:  time.Now(),
		})
	} else {
		data := val.(TelegramQRSessionData)
		if linkUserID != "" && data.LinkUserID == "" {
			data.LinkUserID = linkUserID
			data.LinkSlot = linkSlot
			TelegramQRStore.Store(sessionID, data)
		}
	}
}

// GetTelegramQRSession retrieves session data
func GetTelegramQRSession(sessionID string) (TelegramQRSessionData, bool) {
	val, ok := TelegramQRStore.Load(sessionID)
	if !ok {
		return TelegramQRSessionData{}, false
	}
	return val.(TelegramQRSessionData), true
}

// DeleteTelegramQRSession deletes a session
func DeleteTelegramQRSession(sessionID string) {
	TelegramQRStore.Delete(sessionID)
}

// CompleteTelegramLinkDirect links the user's account to their Telegram ID. Login via Telegram is discontinued.
func CompleteTelegramLinkDirect(db *gorm.DB, sessionID string, telegramID int64, firstName string, lastName string, username string) (*models.User, error) {
	sessionData, hasSession := GetTelegramQRSession(sessionID)
	var user models.User

	if telegramID <= 0 {
		return nil, fmt.Errorf("invalid telegram ID")
	}

	if !hasSession || sessionData.LinkUserID == "" {
		return nil, fmt.Errorf("đăng nhập bằng Telegram không còn được hỗ trợ. Telegram chỉ dùng để nhận thông báo")
	}

	// LINKING MODE: Link this telegram account to the already logged-in user
	if err := db.Where("id = ?", sessionData.LinkUserID).First(&user).Error; err != nil {
		return nil, fmt.Errorf("không tìm thấy người dùng cần liên kết")
	}

	// Check collision: if this telegram ID is already linked to another user
	var collision models.User
	if err := db.Unscoped().Where("(telegram_id = ? OR telegram_id2 = ?) AND id != ?", telegramID, telegramID, user.ID).First(&collision).Error; err == nil {
		return nil, fmt.Errorf("tài khoản Telegram này đã được liên kết với một người dùng khác")
	}

	updates := map[string]interface{}{}
	if sessionData.LinkSlot == "2" {
		updates["telegram_id2"] = telegramID
		if username != "" {
			updates["telegram_user2"] = username
		}
		user.TelegramID2 = &telegramID
		if username != "" {
			user.TelegramUser2 = &username
		}
	} else {
		updates["telegram_id"] = telegramID
		if username != "" {
			updates["telegram_user"] = username
		}
		user.TelegramID = &telegramID
		if username != "" {
			user.TelegramUser = &username
		}
	}
	if err := db.Model(&user).Updates(updates).Error; err != nil {
		return nil, err
	}

	TelegramQRStore.Store(sessionID, TelegramQRSessionData{
		SessionID:    sessionID,
		LinkUserID:   sessionData.LinkUserID,
		LinkSlot:     sessionData.LinkSlot,
		Status:       "completed",
		TelegramID:   telegramID,
		TelegramUser: username,
		User:         &user,
		CreatedAt:    time.Now(),
	})

	return &user, nil
}

// CompleteTelegramLoginDirect is deprecated and forwards to CompleteTelegramLinkDirect without generating login tokens
func CompleteTelegramLoginDirect(db *gorm.DB, sessionID string, telegramID int64, firstName string, lastName string, username string) (*models.User, string, string, error) {
	u, err := CompleteTelegramLinkDirect(db, sessionID, telegramID, firstName, lastName, username)
	return u, "", "", err
}

type telegramUpdate struct {
	UpdateID int `json:"update_id"`
	Message  *struct {
		MessageID int `json:"message_id"`
		From      *struct {
			ID        int64  `json:"id"`
			IsBot     bool   `json:"is_bot"`
			FirstName string `json:"first_name"`
			LastName  string `json:"last_name"`
			Username  string `json:"username"`
		} `json:"from"`
		Chat *struct {
			ID int64 `json:"id"`
		} `json:"chat"`
		Text string `json:"text"`
	} `json:"message"`
}

type telegramUpdatesResponse struct {
	OK     bool             `json:"ok"`
	Result []telegramUpdate `json:"result"`
}

// StartTelegramBotPoller listens for incoming /start login_<sessionId> messages from users
func StartTelegramBotPoller(db *gorm.DB) {
	botToken := os.Getenv("TELEGRAM_BOT_TOKEN")
	if botToken == "" {
		log.Println("[TelegramBot] TELEGRAM_BOT_TOKEN not configured, poller disabled")
		return
	}

	go func() {
		log.Println("[TelegramBot] Starting background Telegram long poller for mobile login...")
		client := &http.Client{Timeout: 35 * time.Second}
		notifier := NewTelegramNotifier()
		offset := 0

		for {
			url := fmt.Sprintf("https://api.telegram.org/bot%s/getUpdates?offset=%d&timeout=20", botToken, offset)
			resp, err := client.Get(url)
			if err != nil {
				time.Sleep(3 * time.Second)
				continue
			}

			var updateResp telegramUpdatesResponse
			err = json.NewDecoder(resp.Body).Decode(&updateResp)
			resp.Body.Close()

			if err != nil || !updateResp.OK {
				time.Sleep(3 * time.Second)
				continue
			}

			for _, upd := range updateResp.Result {
				if upd.UpdateID >= offset {
					offset = upd.UpdateID + 1
				}

				if upd.Message == nil || upd.Message.From == nil {
					continue
				}

				text := strings.TrimSpace(upd.Message.Text)
				chatID := upd.Message.Chat.ID
				from := upd.Message.From

				if strings.HasPrefix(text, "/start login_") || strings.HasPrefix(text, "/start link_") {
					sessionID := strings.TrimPrefix(text, "/start login_")
					sessionID = strings.TrimPrefix(sessionID, "/start link_")
					sessionID = strings.TrimSpace(sessionID)

					user, err := CompleteTelegramLinkDirect(
						db,
						sessionID,
						from.ID,
						from.FirstName,
						from.LastName,
						from.Username,
					)

					if err != nil {
						log.Printf("[TelegramBot] Failed to link telegram for session %s: %v", sessionID, err)
						_ = notifier.SendMessage(chatID, fmt.Sprintf("⚠️ <b>Không thể liên kết tài khoản:</b>\n%s\n\nLưu ý: Telegram chỉ dùng để nhận thông báo. Vui lòng đăng nhập trên website bằng Email hoặc Google rồi vào trang Cá nhân để liên kết.", err.Error()))
					} else {
						log.Printf("[TelegramBot] Successfully linked user %s (%d) for session %s", user.FullName, from.ID, sessionID)
						welcomeMsg := fmt.Sprintf(
							"👋 Xin chào <b>%s</b>!\n\n🎉 <b>Liên kết tài khoản thành công!</b>\nTài khoản Telegram của bạn đã được gắn kết với <b>toan6789.vn</b> để nhận thông báo học tập, thi cử và điểm số. 🚀",
							user.FullName,
						)
						_ = notifier.SendMessage(chatID, welcomeMsg)
					}
				} else if text == "/start" || text == "/help" {
					helpMsg := "👋 Chào mừng bạn đến với <b>Toán 6789 (toan6789.vn)</b>!\n\nBot này được sử dụng để <b>nhận thông báo học tập, kết quả chấm thi và nhắc nhở</b> từ hệ thống toan6789.vn.\n\n👉 Để nhận thông báo, vui lòng đăng nhập vào <b>toan6789.vn</b> bằng Email hoặc Google, vào mục <b>Thông tin cá nhân</b> và chọn <b>Liên kết Telegram</b>."
					_ = notifier.SendMessage(chatID, helpMsg)
				}
			}

			time.Sleep(500 * time.Millisecond)
		}
	}()
}
