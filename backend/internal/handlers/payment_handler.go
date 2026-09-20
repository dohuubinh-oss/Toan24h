package handlers

import (
	"fmt"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/modeptrai/exam-model-backend/internal/models"
	"github.com/modeptrai/exam-model-backend/internal/services"
	"gorm.io/gorm"
)

type PaymentHandler struct {
	DB           *gorm.DB
	PayOSService *services.PayOSService
}

func NewPaymentHandler(db *gorm.DB, payosServices ...*services.PayOSService) *PaymentHandler {
	var ps *services.PayOSService
	if len(payosServices) > 0 {
		ps = payosServices[0]
	}
	if ps == nil {
		ps = services.NewPayOSService("", "", "")
	}
	return &PaymentHandler{
		DB:           db,
		PayOSService: ps,
	}
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
		c.JSON(400, gin.H{"error": "Invalid payload: " + err.Error()})
		return
	}

	var amount int
	var description string
	switch req.Plan {
	case "1_month":
		amount = 200000
		description = "T24H 1 thang"
	case "3_months":
		amount = 450000
		description = "T24H 3 thang"
	case "9_months":
		amount = 1080000
		description = "T24H 9 thang"
	case "1_year", "12_months":
		amount = 1200000
		description = "T24H 12 thang"
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

	// Generate integer orderCode (milliseconds timestamp, guaranteed to fit in int53)
	orderCode := time.Now().UnixMilli()

	// Call PayOS Service to create payment link
	returnURL := "https://toan6789.vn/profile?upgraded=true"
	cancelURL := "https://toan6789.vn/upgrade"

	payosData, err := h.PayOSService.CreatePaymentLink(orderCode, amount, description, returnURL, cancelURL)
	if err != nil {
		c.JSON(500, gin.H{"error": "Could not generate PayOS payment link: " + err.Error()})
		return
	}

	paymentLinkID := ""
	checkoutURL := ""
	qrCode := ""
	accountNumber := "1234567890"
	accountName := "TOAN24H EDUCATION"
	bin := "970422" // MB Bank

	if payosData != nil {
		paymentLinkID = payosData.PaymentLinkID
		checkoutURL = payosData.CheckoutURL
		qrCode = payosData.QRCode
		if payosData.AccountNumber != "" {
			accountNumber = payosData.AccountNumber
		}
		if payosData.AccountName != "" {
			accountName = payosData.AccountName
		}
		if payosData.Bin != "" {
			bin = payosData.Bin
		}
	}

	tx := models.Transaction{
		ID:            uuid.New(),
		UserID:        userUUID,
		OrderCode:     orderCode,
		Amount:        amount,
		Plan:          req.Plan,
		Status:        "pending",
		PaymentLinkID: paymentLinkID,
		CheckoutURL:   checkoutURL,
		QRCode:        qrCode,
	}

	if err := h.DB.Create(&tx).Error; err != nil {
		c.JSON(500, gin.H{"error": "Could not create transaction: " + err.Error()})
		return
	}

	c.JSON(200, gin.H{
		"transactionId": tx.ID,
		"orderCode":     tx.OrderCode,
		"amount":        tx.Amount,
		"plan":          tx.Plan,
		"qrCode":        qrCode,
		"checkoutUrl":   checkoutURL,
		"accountNumber": accountNumber,
		"accountName":   accountName,
		"bin":           bin,
		"content":       fmt.Sprintf("T24H %d", tx.OrderCode),
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
