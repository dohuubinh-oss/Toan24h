package handlers

import (
	"fmt"
	"os"
	"regexp"
	"time"

	"github.com/gin-gonic/gin"
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

type SePayWebhookPayload struct {
	ID             int    `json:"id"`
	Gateway        string `json:"gateway"`
	TransactionDate string `json:"transactionDate"`
	AccountNumber  string `json:"accountNumber"`
	Code           string `json:"code"`
	Content        string `json:"content"`
	TransferType   string `json:"transferType"`
	TransferAmount int    `json:"transferAmount"`
	Accumulated    int    `json:"accumulated"`
	SubAccount     string `json:"subAccount"`
	ReferenceCode  string `json:"referenceCode"`
	Description    string `json:"description"`
}

func (h *WebhookHandler) HandlePayOSWebhook(c *gin.Context) {
	var payload services.PayOSWebhookBody
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(400, gin.H{"error": "Invalid payload: " + err.Error()})
		return
	}

	// Verify PayOS Webhook signature
	if h.PayOSService != nil && !h.PayOSService.VerifyWebhookSignature(payload.Data, payload.Signature) {
		c.JSON(401, gin.H{"error": "Invalid webhook signature"})
		return
	}

	// Only process successful payment
	if payload.Data.Code != "00" && payload.Code != "00" {
		c.JSON(200, gin.H{"message": "Ignored non-success status"})
		return
	}

	// Wrap in DB Transaction to prevent race conditions
	err := h.DB.Transaction(func(db *gorm.DB) error {
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

		// Update User ExpiresAt
		var user models.User
		if err := db.First(&user, "id = ?", tx.UserID).Error; err == nil {
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

			if user.ExpiresAt != nil && user.ExpiresAt.After(now) {
				newTime := user.ExpiresAt.AddDate(0, monthsToAdd, 0)
				user.ExpiresAt = &newTime
			} else {
				newTime := now.AddDate(0, monthsToAdd, 0)
				user.ExpiresAt = &newTime
			}
			if err := db.Save(&user).Error; err != nil {
				return err
			}
		}

		return nil
	})

	if err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{"success": true})
}

func (h *WebhookHandler) HandleSePayWebhook(c *gin.Context) {
	// Verify SePay Webhook Authorization Token if configured
	expectedToken := os.Getenv("SEPAY_WEBHOOK_TOKEN")
	if expectedToken != "" {
		authHeader := c.GetHeader("Authorization")
		secretHeader := c.GetHeader("X-SePay-Secret")
		if authHeader != "Bearer "+expectedToken && secretHeader != expectedToken {
			c.JSON(401, gin.H{"error": "Unauthorized webhook request"})
			return
		}
	}

	var payload SePayWebhookPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(400, gin.H{"error": "Invalid payload"})
		return
	}

	if payload.TransferType != "in" {
		c.JSON(200, gin.H{"message": "Ignored non-incoming transfer"})
		return
	}

	// Extract UUID using regex
	re := regexp.MustCompile(`[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}`)
	match := re.FindString(payload.Content)
	if match == "" {
		c.JSON(200, gin.H{"message": "No transaction ID found in content"})
		return
	}

	// Wrap in DB Transaction to prevent race conditions (double redeem)
	err := h.DB.Transaction(func(db *gorm.DB) error {
		var tx models.Transaction
		if err := db.Set("gorm:query_option", "FOR UPDATE").First(&tx, "id = ?", match).Error; err != nil {
			return err
		}

		if tx.Status == "completed" {
			return fmt.Errorf("transaction already completed")
		}

		if tx.Amount != payload.TransferAmount {
			return fmt.Errorf("amount mismatch")
		}

		// Update Transaction Status
		tx.Status = "completed"
		if err := db.Save(&tx).Error; err != nil {
			return err
		}

		// Update User ExpiresAt
		var user models.User
		if err := db.First(&user, "id = ?", tx.UserID).Error; err == nil {
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

			if user.ExpiresAt != nil && user.ExpiresAt.After(now) {
				newTime := user.ExpiresAt.AddDate(0, monthsToAdd, 0)
				user.ExpiresAt = &newTime
			} else {
				newTime := now.AddDate(0, monthsToAdd, 0)
				user.ExpiresAt = &newTime
			}
			if err := db.Save(&user).Error; err != nil {
				return err
			}
		}

		return nil
	})

	if err != nil {
		c.JSON(200, gin.H{"message": err.Error()})
		return
	}

	c.JSON(200, gin.H{"success": true})
}
