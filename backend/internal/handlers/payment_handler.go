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

	amount := 450000
	if req.Plan != "3_months" {
		c.JSON(400, gin.H{"error": "Invalid plan"})
		return
	}

	uidStr, _ := userID.(string)
	userUUID, err := uuid.Parse(uidStr)
	if err != nil {
		c.JSON(400, gin.H{"error": "Invalid User ID"})
		return
	}
	
	tx := models.Transaction{
		UserID: userUUID,
		Amount: amount,
		Plan:   req.Plan,
		Status: "pending",
	}

	if err := h.DB.Create(&tx).Error; err != nil {
		c.JSON(500, gin.H{"error": "Could not create transaction"})
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

	uidStr, _ := userID.(string)
	var transactions []models.Transaction
	h.DB.Where("user_id = ?", uidStr).Order("created_at desc").Find(&transactions)

	c.JSON(200, transactions)
}
