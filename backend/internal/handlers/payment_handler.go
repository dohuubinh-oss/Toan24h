package handlers

import (
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/modeptrai/exam-model-backend/internal/models"
	"github.com/modeptrai/exam-model-backend/internal/services"
	"github.com/modeptrai/exam-model-backend/internal/utils"
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
	userUUID, err := utils.GetUserID(c)
	if err != nil {
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
		amount = 300000
		description = "TOAN6789 1 thang"
	case "3_months":
		amount = 675000
		description = "TOAN6789 3 thang"
	case "9_months":
		amount = 1755000
		description = "TOAN6789 9 thang"
	case "1_year", "12_months":
		amount = 1800000
		description = "TOAN6789 12 thang"
	default:
		c.JSON(400, gin.H{"error": "Gói nâng cấp không hợp lệ"})
		return
	}

	// Double-submit / Spam protection: reuse active pending transaction if created within 5 minutes
	var existingTx models.Transaction
	fiveMinutesAgo := time.Now().Add(-5 * time.Minute)
	if err := h.DB.Where("user_id = ? AND plan = ? AND status = 'pending' AND created_at > ?", userUUID, req.Plan, fiveMinutesAgo).
		Order("created_at desc").First(&existingTx).Error; err == nil && existingTx.OrderCode > 0 && existingTx.CheckoutURL != "" {
		accountName := os.Getenv("PAYOS_ACCOUNT_NAME")
		if accountName == "" {
			accountName = "TOAN6789 EDUCATION"
		}
		c.JSON(200, gin.H{
			"transactionId": existingTx.ID,
			"orderCode":     existingTx.OrderCode,
			"amount":        existingTx.Amount,
			"plan":          existingTx.Plan,
			"qrCode":        existingTx.QRCode,
			"checkoutUrl":   existingTx.CheckoutURL,
			"accountNumber": "1234567890",
			"accountName":   accountName,
			"bin":           "970422",
			"content":       fmt.Sprintf("TOAN6789 %d", existingTx.OrderCode),
		})
		return
	}

	// Generate integer orderCode (milliseconds timestamp, guaranteed to fit in int53)
	orderCode := time.Now().UnixMilli()

	// Dynamic URLs for Return & Cancel
	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "https://toan6789.vn"
	}
	frontendURL = strings.TrimRight(frontendURL, "/")
	returnURL := fmt.Sprintf("%s/profile?upgraded=true", frontendURL)
	cancelURL := fmt.Sprintf("%s/upgrade", frontendURL)

	payosData, err := h.PayOSService.CreatePaymentLink(orderCode, amount, description, returnURL, cancelURL)
	if err != nil {
		c.JSON(500, gin.H{"error": "Could not generate PayOS payment link: " + err.Error()})
		return
	}

	paymentLinkID := ""
	checkoutURL := ""
	qrCode := ""
	accountNumber := "1234567890"
	accountName := os.Getenv("PAYOS_ACCOUNT_NAME")
	if accountName == "" {
		accountName = "TOAN6789 EDUCATION"
	}
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
		"content":       fmt.Sprintf("TOAN6789 %d", tx.OrderCode),
	})
}

// GetPaymentStatus checks the status of a single transaction by orderCode or ID
func (h *PaymentHandler) GetPaymentStatus(c *gin.Context) {
	userUUID, err := utils.GetUserID(c)
	if err != nil {
		c.JSON(401, gin.H{"error": "Unauthorized"})
		return
	}

	orderCodeStr := c.Param("orderCode")
	if orderCodeStr == "" {
		c.JSON(400, gin.H{"error": "Missing orderCode"})
		return
	}

	var tx models.Transaction
	var queryErr error
	if orderCode, err := strconv.ParseInt(orderCodeStr, 10, 64); err == nil {
		queryErr = h.DB.Where("user_id = ? AND order_code = ?", userUUID, orderCode).First(&tx).Error
	} else if txUUID, err := uuid.Parse(orderCodeStr); err == nil {
		queryErr = h.DB.Where("user_id = ? AND id = ?", userUUID, txUUID).First(&tx).Error
	} else {
		c.JSON(400, gin.H{"error": "Invalid orderCode format"})
		return
	}

	if queryErr != nil {
		c.JSON(404, gin.H{"error": "Transaction not found"})
		return
	}

	c.JSON(200, gin.H{
		"transactionId": tx.ID,
		"orderCode":     tx.OrderCode,
		"status":        tx.Status,
		"plan":          tx.Plan,
		"amount":        tx.Amount,
		"updatedAt":     tx.UpdatedAt,
	})
}

func (h *PaymentHandler) GetMyTransactions(c *gin.Context) {
	userUUID, err := utils.GetUserID(c)
	if err != nil {
		c.JSON(401, gin.H{"error": "Unauthorized"})
		return
	}

	limit := 20
	if l := c.Query("limit"); l != "" {
		if parsedLimit, err := strconv.Atoi(l); err == nil && parsedLimit > 0 && parsedLimit <= 100 {
			limit = parsedLimit
		}
	}

	var transactions []models.Transaction
	h.DB.Where("user_id = ?", userUUID).Order("created_at desc").Limit(limit).Find(&transactions)

	c.JSON(200, transactions)
}
