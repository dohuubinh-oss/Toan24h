package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"strings"
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
	var processedTx models.Transaction
	var alreadyCompleted bool

	err = h.DB.Transaction(func(db *gorm.DB) error {
		var tx models.Transaction
		if err := db.Set("gorm:query_option", "FOR UPDATE").First(&tx, "order_code = ?", payload.Data.OrderCode).Error; err != nil {
			return fmt.Errorf("transaction not found for orderCode %d: %w", payload.Data.OrderCode, err)
		}

		if tx.Status == "completed" {
			// Idempotent: already completed
			alreadyCompleted = true
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
		processedTx = tx
		return nil
	})

	if err != nil {
		c.JSON(400, gin.H{"error": -1, "message": err.Error(), "data": nil})
		return
	}

	// Process multi-tier lifetime commissions (Direct, Grade 3%, Platform 1%)
	// Any commission error is logged and must NOT fail or rollback VIP activation
	if !alreadyCompleted {
		h.processMultiTierCommissions(processedTx, updatedUser)
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

// processMultiTierCommissions safely calculates and allocates multi-tier commissions
// (Direct referral, Grade management 3%, and Platform override 1%) inside an atomic DB transaction.
func (h *WebhookHandler) processMultiTierCommissions(tx models.Transaction, student models.User) {
	defer func() {
		if r := recover(); r != nil {
			log.Printf("[Webhook PayOS] Panic recovered during multi-tier commission processing for orderCode %d: %v", tx.OrderCode, r)
		}
	}()

	if h.DB == nil {
		return
	}

	// 1. Pre-check idempotency outside transaction
	var existingCount int64
	if err := h.DB.Model(&models.CommissionTransaction{}).Where("order_code = ?", tx.OrderCode).Count(&existingCount).Error; err != nil {
		log.Printf("[Webhook PayOS] Error checking existing commission for orderCode %d: %v", tx.OrderCode, err)
		return
	}
	if existingCount > 0 {
		return
	}

	// 2. Perform all allocations within a single database transaction
	err := h.DB.Transaction(func(commDB *gorm.DB) error {
		// Double check idempotency inside transaction
		var countInside int64
		if err := commDB.Model(&models.CommissionTransaction{}).Where("order_code = ?", tx.OrderCode).Count(&countInside).Error; err != nil {
			return err
		}
		if countInside > 0 {
			return nil
		}

		var directReferrerID *uuid.UUID

		// --- TIER 1: Direct Referral Commission (Teacher 50%, Admin 60%, Affiliate 30%) ---
		if student.ReferrerID != nil && *student.ReferrerID != uuid.Nil {
			var referrer models.User
			if err := commDB.First(&referrer, "id = ?", *student.ReferrerID).Error; err == nil {
				if referrer.Status == "active" {
					role := strings.ToLower(strings.TrimSpace(referrer.Role))
					if role == "admin" || role == "teacher" || role == "affiliate" {
						rate := services.GetCommissionRateByRole(role)
						amount := int(float64(tx.Amount) * float64(rate) / 100.0)

						if amount > 0 {
							if err := commDB.Model(&models.User{}).Where("id = ?", referrer.ID).
								Update("commission_balance", gorm.Expr("commission_balance + ?", amount)).Error; err != nil {
								return err
							}

							commTx := models.CommissionTransaction{
								OrderCode:        tx.OrderCode,
								ReferrerID:       referrer.ID,
								StudentID:        student.ID,
								StudentAmount:    tx.Amount,
								CommissionRate:   rate,
								CommissionAmount: amount,
								CommissionType:   "direct",
								Note:             "Hoa hồng giới thiệu trực tiếp",
								Status:           "pending",
							}
							if err := commDB.Create(&commTx).Error; err != nil {
								return err
							}
							directReferrerID = &referrer.ID
						}
					}
				}
			}
		}

		// --- TIER 2: Grade Management Commission (Teacher 3%) ---
		normGrade := services.NormalizeGrade(student.Grade)
		if normGrade != "" {
			teacher, err := services.GetTeacherForGrade(commDB, normGrade)
			if err == nil && teacher != nil {
				// Anti-goal: Skip if teacher was already the direct referrer
				if directReferrerID == nil || *directReferrerID != teacher.ID {
					rate := services.CommissionRateGrade // 3.0%
					amount := int(float64(tx.Amount) * float64(rate) / 100.0)

					if amount > 0 {
						if err := commDB.Model(&models.User{}).Where("id = ?", teacher.ID).
							Update("commission_balance", gorm.Expr("commission_balance + ?", amount)).Error; err != nil {
							return err
						}

						commTx := models.CommissionTransaction{
							OrderCode:        tx.OrderCode,
							ReferrerID:       teacher.ID,
							StudentID:        student.ID,
							StudentAmount:    tx.Amount,
							CommissionRate:   rate,
							CommissionAmount: amount,
							CommissionType:   "grade_management",
							Note:             fmt.Sprintf("Hoa hồng quản lý Khối %s", normGrade),
							Status:           "pending",
						}
						if err := commDB.Create(&commTx).Error; err != nil {
							return err
						}
					}
				}
			}
		}

		// --- TIER 3: Platform Management Commission (Admin 1%) ---
		admin, err := services.GetSystemAdmin(commDB)
		if err == nil && admin != nil {
			// Anti-goal: Skip if admin was already the direct referrer
			if directReferrerID == nil || *directReferrerID != admin.ID {
				rate := services.CommissionRatePlatform // 1.0%
				amount := int(float64(tx.Amount) * float64(rate) / 100.0)

				if amount > 0 {
					if err := commDB.Model(&models.User{}).Where("id = ?", admin.ID).
						Update("commission_balance", gorm.Expr("commission_balance + ?", amount)).Error; err != nil {
						return err
					}

					commTx := models.CommissionTransaction{
						OrderCode:        tx.OrderCode,
						ReferrerID:       admin.ID,
						StudentID:        student.ID,
						StudentAmount:    tx.Amount,
						CommissionRate:   rate,
						CommissionAmount: amount,
						CommissionType:   "platform_override",
						Note:             "Hoa hồng quản trị sàn",
						Status:           "pending",
					}
					if err := commDB.Create(&commTx).Error; err != nil {
						return err
					}
				}
			}
		}

		return nil
	})

	if err != nil {
		log.Printf("[Webhook PayOS] Failed to complete multi-tier commission processing for orderCode %d: %v", tx.OrderCode, err)
	}
}
