package handlers

import (
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/modeptrai/exam-model-backend/internal/models"
	"github.com/modeptrai/exam-model-backend/internal/utils"
	"gorm.io/gorm"
)

type VoucherHandler struct {
	db *gorm.DB
}

func NewVoucherHandler(db *gorm.DB) *VoucherHandler {
	return &VoucherHandler{db: db}
}

type CreateVoucherRequest struct {
	Code              string     `json:"code" binding:"required"`
	AffiliateID       *uuid.UUID `json:"affiliateId"`
	FreeMonths        int        `json:"freeMonths"`
	DiscountPercent   int        `json:"discountPercent"`
	CommissionPercent float32    `json:"commissionPercent"`
	MaxUses           int        `json:"maxUses"`
	ExpiresAt         *time.Time `json:"expiresAt"`
	IsActive          *bool      `json:"isActive"`
}

// CreateVoucher xử lý tạo mã khuyến mãi mới (Admin & Teacher)
func (h *VoucherHandler) CreateVoucher(c *gin.Context) {
	role := c.GetString("userRole")
	userID, err := utils.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req CreateVoucherRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dữ liệu không hợp lệ: " + err.Error()})
		return
	}

	code := strings.ToUpper(strings.TrimSpace(req.Code))
	if code == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Mã khuyến mãi không được để trống"})
		return
	}

	// Kiểm tra mã đã tồn tại chưa
	var existing models.Voucher
	if err := h.db.Where("UPPER(code) = ?", code).First(&existing).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Mã khuyến mãi này đã tồn tại"})
		return
	}

	affiliateID := req.AffiliateID
	if role != "admin" {
		// Teacher tạo thì affiliate_id mặc định là chính teacher
		affiliateID = &userID
	}

	maxUses := req.MaxUses
	if maxUses <= 0 {
		maxUses = 100 // Default 100 lượt
	}

	isActive := true
	if req.IsActive != nil {
		isActive = *req.IsActive
	}

	commissionPercent := req.CommissionPercent
	if commissionPercent <= 0 {
		targetRole := role
		if role == "admin" && affiliateID != nil {
			var affUser models.User
			if err := h.db.Select("id, role").First(&affUser, "id = ?", affiliateID).Error; err == nil {
				targetRole = affUser.Role
			}
		}

		if targetRole == "teacher" {
			commissionPercent = 50.0
		} else {
			commissionPercent = 30.0
		}
	}

	voucher := models.Voucher{
		Code:              code,
		AffiliateID:       affiliateID,
		FreeMonths:        req.FreeMonths,
		DiscountPercent:   req.DiscountPercent,
		CommissionPercent: commissionPercent,
		MaxUses:           maxUses,
		ExpiresAt:         req.ExpiresAt,
		IsActive:          isActive,
	}

	if err := h.db.Create(&voucher).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể tạo mã khuyến mãi: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Tạo mã khuyến mãi thành công",
		"voucher": voucher,
	})
}

// GetVouchers lấy danh sách mã khuyến mãi
// Admin xem toàn bộ, Teacher/Affiliate chỉ xem mã do mình quản lý
func (h *VoucherHandler) GetVouchers(c *gin.Context) {
	role := c.GetString("userRole")
	userID, err := utils.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var vouchers []models.Voucher
	query := h.db.Order("created_at desc")

	switch role {
	case "admin":
		if err := query.Find(&vouchers).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	case "teacher", "affiliate":
		if err := query.Where("affiliate_id = ?", userID).Find(&vouchers).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	default:
		c.JSON(http.StatusForbidden, gin.H{"error": "Bạn không có quyền truy cập danh sách mã"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"vouchers": vouchers})
}
