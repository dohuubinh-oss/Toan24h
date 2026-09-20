package handlers

import (
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/modeptrai/exam-model-backend/internal/models"
	"gorm.io/gorm"
)

type PaymentHandler struct {
	DB *gorm.DB
}

func NewPaymentHandler(db *gorm.DB) *PaymentHandler {
	return &PaymentHandler{DB: db}
}

type CreatePaymentRequest struct {
	Plan string `json:"plan" binding:"required"`
}

func (h *PaymentHandler) CreatePayment(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(401, gin.H{"error": "Unauthorized"})
		return
	}

	var req CreatePaymentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "Invalid payload"})
		return
	}

	var amount int
	switch req.Plan {
	case "1_month":
		amount = 200000
	case "3_months":
		amount = 450000
	case "9_months":
		amount = 1080000
	case "1_year", "12_months":
		amount = 1200000
	default:
		c.JSON(400, gin.H{"error": "Gói nâng cấp không hợp lệ"})
		return
	}

	var userUUID uuid.UUID
	switch v := userID.(type) {
	case uuid.UUID:
		userUUID = v
	case string:
		var err error
		userUUID, err = uuid.Parse(v)
		if err != nil {
			c.JSON(400, gin.H{"error": "Invalid User ID"})
			return
		}
	default:
		c.JSON(400, gin.H{"error": "Invalid User ID"})
		return
	}
	
	tx := models.Transaction{
		ID:     uuid.New(),
		UserID: userUUID,
		Amount: amount,
		Plan:   req.Plan,
		Status: "pending",
	}

	if err := h.DB.Create(&tx).Error; err != nil {
		c.JSON(500, gin.H{"error": "Could not create transaction: " + err.Error()})
		return
	}

	c.JSON(200, gin.H{
		"transactionId": tx.ID,
		"amount":        tx.Amount,
		"content":       "T24H " + tx.ID.String(),
	})
}

func (h *PaymentHandler) GetMyTransactions(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(401, gin.H{"error": "Unauthorized"})
		return
	}

	var userUUID uuid.UUID
	switch v := userID.(type) {
	case uuid.UUID:
		userUUID = v
	case string:
		userUUID, _ = uuid.Parse(v)
	}

	var transactions []models.Transaction
	h.DB.Where("user_id = ?", userUUID).Order("created_at desc").Find(&transactions)

	c.JSON(200, transactions)
}
