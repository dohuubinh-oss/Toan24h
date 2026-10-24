package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/modeptrai/exam-model-backend/internal/models"
	"github.com/modeptrai/exam-model-backend/internal/services"
	"gorm.io/gorm"
)

type WebhookHandler struct {
	DB           *gorm.DB
	PayOSService *services.PayOSService
}

func NewWebhookHandler(db *gorm.DB, payosServices ...*services.PayOSService) *WebhookHandler {
	var ps *services.PayOSService
	if len(payosServices) > 0 {
		ps = payosServices[0]
	}
	if ps == nil {
		ps = services.NewPayOSService("", "", "")
	}
	return &WebhookHandler{
		DB:           db,
		PayOSService: ps,
	}
}

// Type aliases for testing & backward compatibility
type PayOSWebhookBody = services.PayOSWebhookBody
type PayOSWebhookData = services.PayOSWebhookData

func NewPayOSService(clientID, apiKey, checksumKey string) *services.PayOSService {
	return services.NewPayOSService(clientID, apiKey, checksumKey)
}

func (h *WebhookHandler) HandlePayOSWebhook(c *gin.Context) {
	bodyBytes, err := c.GetRawData()
	if err != nil {
		c.JSON(400, gin.H{"error": -1, "message": "Failed to read request body", "data": nil})
		return
	}

	var rawPayload struct {
		Code      string                 `json:"code"`
		Desc      string                 `json:"desc"`
		Data      map[string]interface{} `json:"data"`
		Signature string                 `json:"signature"`
	}

	d := json.NewDecoder(bytes.NewReader(bodyBytes))
	d.UseNumber()
	if err := d.Decode(&rawPayload); err != nil {
		c.JSON(400, gin.H{"error": -1, "message": "Invalid JSON payload: " + err.Error(), "data": nil})
		return
	}

	var payload services.PayOSWebhookBody
	if err := json.Unmarshal(bodyBytes, &payload); err != nil {
		c.JSON(400, gin.H{"error": -1, "message": "Invalid payload format: " + err.Error(), "data": nil})
		return
	}

	// Verify PayOS Webhook signature: Check dynamic map first, then fallback to struct
	if h.PayOSService != nil {
		valid := h.PayOSService.VerifyWebhookSignatureFromMap(rawPayload.Data, rawPayload.Signature)
		if !valid {
			valid = h.PayOSService.VerifyWebhookSignature(payload.Data, payload.Signature)
		}
		if !valid {
			c.JSON(401, gin.H{"error": -1, "message": "Invalid webhook signature", "data": nil})
			return
		}
	}

	// Only process successful payment
	if payload.Data.Code != "00" && payload.Code != "00" {
		c.JSON(200, gin.H{"error": 0, "message": "Ignored non-success status", "data": nil})
		return
	}

	// Wrap in DB Transaction to prevent race conditions
	var updatedUser models.User
	var updatedPlan string
	err = h.DB.Transaction(func(db *gorm.DB) error {
		var tx models.Transaction
		if err := db.Set("gorm:query_option", "FOR UPDATE").First(&tx, "order_code = ?", payload.Data.OrderCode).Error; err != nil {
			return fmt.Errorf("transaction not found for orderCode %d: %w", payload.Data.OrderCode, err)
		}

		if tx.Status == "completed" {
			// Idempotent: already completed
			return nil
		}

		if tx.Amount != payload.Data.Amount {
			return fmt.Errorf("amount mismatch: expected %d, got %d", tx.Amount, payload.Data.Amount)
		}

		// Update Transaction Status
		tx.Status = "completed"
		if err := db.Save(&tx).Error; err != nil {
			return err
		}

		// Update User ExpiresAt (Do not swallow error)
		if err := db.First(&updatedUser, "id = ?", tx.UserID).Error; err != nil {
			return fmt.Errorf("user not found for transaction: %w", err)
		}

		now := time.Now()
		monthsToAdd := 3
		switch tx.Plan {
		case "1_month":
			monthsToAdd = 1
		case "3_months":
			monthsToAdd = 3
		case "9_months":
			monthsToAdd = 9
		case "1_year", "12_months":
			monthsToAdd = 12
		}

		if updatedUser.ExpiresAt != nil && updatedUser.ExpiresAt.After(now) {
			newTime := updatedUser.ExpiresAt.AddDate(0, monthsToAdd, 0)
			updatedUser.ExpiresAt = &newTime
		} else {
			newTime := now.AddDate(0, monthsToAdd, 0)
			updatedUser.ExpiresAt = &newTime
		}
		if err := db.Save(&updatedUser).Error; err != nil {
			return err
		}

		updatedPlan = tx.Plan
		return nil
	})

	if err != nil {
		c.JSON(400, gin.H{"error": -1, "message": err.Error(), "data": nil})
		return
	}

	// Send Telegram notification if user has linked Telegram (Slot 1 or Slot 2)
	if updatedUser.ID != uuid.Nil && updatedUser.ExpiresAt != nil {
		go func(u models.User, plan string) {
			notifier := services.NewTelegramNotifier()
			planName := plan
			switch plan {
			case "1_month":
				planName = "1 Tháng"
			case "3_months":
				planName = "3 Tháng"
			case "9_months":
				planName = "9 Tháng"
			case "1_year", "12_months":
				planName = "1 Năm (12 Tháng)"
			}

			msg := fmt.Sprintf(
				"🎉 <b>Thanh toán thành công!</b>\n\n"+
					"Gói học VIP <b>%s</b> đã được kích hoạt thành công cho tài khoản <b>%s</b>.\n"+
					"📅 <b>Hạn sử dụng VIP:</b> Đến ngày <b>%s</b>.\n\n"+
					"Chúc bạn học tập thật tốt trên <b>toan6789.vn</b>! 🚀",
				planName,
				u.FullName,
				u.ExpiresAt.Format("02/01/2006"),
			)
			_ = notifier.SendToUser(&u, msg)
		}(updatedUser, updatedPlan)
	}

	// PayOS standard webhook response format
	c.JSON(200, gin.H{
		"error":   0,
		"message": "success",
		"data":    nil,
	})
}
