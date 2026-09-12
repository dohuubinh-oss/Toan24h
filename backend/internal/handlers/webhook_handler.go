package handlers

import (
	"fmt"
	"os"
	"regexp"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/modeptrai/exam-model-backend/internal/models"
	"gorm.io/gorm"
)

type WebhookHandler struct {
	DB *gorm.DB
}

func NewWebhookHandler(db *gorm.DB) *WebhookHandler {
	return &WebhookHandler{DB: db}
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
			if user.ExpiresAt != nil && user.ExpiresAt.After(now) {
				newTime := user.ExpiresAt.AddDate(0, 3, 0)
				user.ExpiresAt = &newTime
			} else {
				newTime := now.AddDate(0, 3, 0)
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
