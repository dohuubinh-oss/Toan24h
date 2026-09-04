package handlers

import (
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

	var tx models.Transaction
	if err := h.DB.First(&tx, "id = ?", match).Error; err != nil {
		c.JSON(200, gin.H{"message": "Transaction not found"})
		return
	}

	if tx.Status == "completed" {
		c.JSON(200, gin.H{"message": "Transaction already completed"})
		return
	}

	if tx.Amount != payload.TransferAmount {
		c.JSON(200, gin.H{"message": "Amount mismatch"})
		return
	}

	// Update Transaction
	tx.Status = "completed"
	h.DB.Save(&tx)

	// Update User ExpiresAt
	var user models.User
	if err := h.DB.First(&user, "id = ?", tx.UserID).Error; err == nil {
		now := time.Now()
		if user.ExpiresAt != nil && user.ExpiresAt.After(now) {
			newTime := user.ExpiresAt.AddDate(0, 3, 0)
			user.ExpiresAt = &newTime
		} else {
			newTime := now.AddDate(0, 3, 0)
			user.ExpiresAt = &newTime
		}
		h.DB.Save(&user)
	}

	c.JSON(200, gin.H{"success": true})
}
