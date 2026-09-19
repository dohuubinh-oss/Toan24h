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
	"github.com/modeptrai/exam-model-backend/internal/utils"
	"gorm.io/gorm"
)

type TelegramQRSessionData struct {
	SessionID    string       `json:"sessionId"`
	LinkUserID   string       `json:"linkUserId,omitempty"`
	Status       string       `json:"status"` // "waiting" | "completed"
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

// CreateTelegramQRSession generates a new session and returns sessionID + deepLink
func CreateTelegramQRSession() (string, string) {
	return CreateTelegramQRSessionWithLink("")
}

// CreateTelegramQRSessionWithLink generates a new session with optional user linking
func CreateTelegramQRSessionWithLink(linkUserID string) (string, string) {
	bytes := make([]byte, 16)
	_, _ = rand.Read(bytes)
	sessionID := hex.EncodeToString(bytes)

	botUsername := os.Getenv("TELEGRAM_BOT_USERNAME")
	if botUsername == "" {
		botUsername = "toan6789_bot"
	}

	session := TelegramQRSessionData{
		SessionID:  sessionID,
		LinkUserID: linkUserID,
		Status:     "waiting",
		CreatedAt:  time.Now(),
	}
	TelegramQRStore.Store(sessionID, session)

	deepLink := fmt.Sprintf("https://t.me/%s?start=login_%s", botUsername, sessionID)
	return sessionID, deepLink
}

// RegisterTelegramQRSession ensures a sessionID is tracked
func RegisterTelegramQRSession(sessionID string) {
	RegisterTelegramQRSessionWithLink(sessionID, "")
}

// RegisterTelegramQRSessionWithLink ensures a sessionID is tracked with optional linkUserID
func RegisterTelegramQRSessionWithLink(sessionID string, linkUserID string) {
	if val, ok := TelegramQRStore.Load(sessionID); !ok {
		TelegramQRStore.Store(sessionID, TelegramQRSessionData{
			SessionID:  sessionID,
			LinkUserID: linkUserID,
			Status:     "waiting",
			CreatedAt:  time.Now(),
		})
	} else {
		data := val.(TelegramQRSessionData)
		if linkUserID != "" && data.LinkUserID == "" {
			data.LinkUserID = linkUserID
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

// CompleteTelegramLoginDirect authenticates the user and updates the session store
func CompleteTelegramLoginDirect(db *gorm.DB, sessionID string, telegramID int64, firstName string, lastName string, username string) (*models.User, string, string, error) {
	sessionData, hasSession := GetTelegramQRSession(sessionID)
	var user models.User

	if telegramID <= 0 {
		return nil, "", "", fmt.Errorf("invalid telegram ID")
	}

	if hasSession && sessionData.LinkUserID != "" {
		// LINKING MODE: Link this telegram account to the already logged-in user
		if err := db.Where("id = ?", sessionData.LinkUserID).First(&user).Error; err == nil {
			updates := map[string]interface{}{
				"telegram_id": telegramID,
			}
			if username != "" {
				updates["telegram_user"] = username
			}
			db.Model(&user).Updates(updates)
			user.TelegramID = &telegramID
			if username != "" {
				user.TelegramUser = &username
			}
		} else {
			return nil, "", "", fmt.Errorf("user to link not found")
		}
	} else {
		// LOGIN / REGISTRATION MODE
		err := db.Where("telegram_id = ?", telegramID).First(&user).Error
		if err != nil {
			email := fmt.Sprintf("tg_%d@telegram.local", telegramID)
			fullName := strings.TrimSpace(firstName + " " + lastName)
			if fullName == "" {
				fullName = "Người dùng Telegram"
			}
			user = models.User{
				Email:      email,
				FullName:   fullName,
				TelegramID: &telegramID,
				Role:       "student",
				Grade:      "10",
				Status:     "active",
			}
			if username != "" {
				user.TelegramUser = &username
			}
			if err := db.Create(&user).Error; err != nil {
				return nil, "", "", err
			}
		} else {
			if username != "" && (user.TelegramUser == nil || *user.TelegramUser != username) {
				db.Model(&user).Update("telegram_user", username)
				user.TelegramUser = &username
			}
		}
	}

	accessToken, err := utils.GenerateAccessToken(user.ID, user.Role, user.Grade)
	if err != nil {
		return nil, "", "", err
	}
	refreshToken, err := utils.GenerateRefreshToken(user.ID)
	if err != nil {
		return nil, "", "", err
	}

	TelegramQRStore.Store(sessionID, TelegramQRSessionData{
		SessionID:    sessionID,
		LinkUserID:   sessionData.LinkUserID,
		Status:       "completed",
		TelegramID:   telegramID,
		TelegramUser: username,
		User:         &user,
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		CreatedAt:    time.Now(),
	})

	return &user, accessToken, refreshToken, nil
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

				if strings.HasPrefix(text, "/start login_") {
					sessionID := strings.TrimPrefix(text, "/start login_")
					sessionID = strings.TrimSpace(sessionID)

					user, _, _, err := CompleteTelegramLoginDirect(
						db,
						sessionID,
						from.ID,
						from.FirstName,
						from.LastName,
						from.Username,
					)

					if err != nil {
						log.Printf("[TelegramBot] Failed to complete login for session %s: %v", sessionID, err)
						_ = notifier.SendMessage(chatID, "❌ Đã có lỗi xảy ra khi xác thực tài khoản. Vui lòng thử lại trên web toan6789.vn.")
					} else {
						log.Printf("[TelegramBot] Successfully authenticated user %s (%d) for session %s", user.FullName, from.ID, sessionID)
						sessionData, _ := GetTelegramQRSession(sessionID)
						var welcomeMsg string
						if sessionData.LinkUserID != "" {
							welcomeMsg = fmt.Sprintf(
								"👋 Xin chào <b>%s</b>!\n\n🎉 <b>Liên kết tài khoản thành công!</b>\nTài khoản Telegram của bạn đã được gắn kết với tài khoản toan6789.vn.\n\nChúc bạn học tập thật tốt trên <b>toan6789.vn</b>! 🚀",
								user.FullName,
							)
						} else {
							welcomeMsg = fmt.Sprintf(
								"👋 Xin chào <b>%s</b>!\n\n🎉 <b>Xác thực đăng nhập thành công!</b>\nPhiên đăng nhập trên trình duyệt đã được kích hoạt.\n\nChúc bạn học tập thật tốt trên <b>toan6789.vn</b>! 🚀",
								user.FullName,
							)
						}
						_ = notifier.SendMessage(chatID, welcomeMsg)
					}
				} else if text == "/start" || text == "/help" {
					helpMsg := "👋 Chào mừng bạn đến với <b>Toán 6789 (toan6789.vn)</b>!\n\n🔹 Để đăng nhập bằng Telegram trên web:\n1. Mở trang đăng nhập tại <b>toan6789.vn</b>\n2. Chọn <b>'Mở Telegram trên Điện thoại / Quét QR'</b>\n3. Bấm mở liên kết bot hoặc quét QR bằng điện thoại\n4. Nhấn <b>Bắt đầu (Start)</b> là xong!"
					_ = notifier.SendMessage(chatID, helpMsg)
				}
			}

			time.Sleep(500 * time.Millisecond)
		}
	}()
}
