package models_test

import (
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/modeptrai/exam-model-backend/internal/models"
	"github.com/stretchr/testify/assert"
)

func TestCommissionTransaction_Fields(t *testing.T) {
	id := uuid.New()
	referrerID := uuid.New()
	studentID := uuid.New()
	now := time.Now()

	tx := models.CommissionTransaction{
		ID:               id,
		OrderCode:        123456,
		ReferrerID:       referrerID,
		StudentID:         studentID,
		StudentAmount:    199000,
		CommissionRate:   0.3,
		CommissionAmount: 59700,
		Status:           "pending",
		CreatedAt:        now,
	}

	assert.Equal(t, id, tx.ID)
	assert.Equal(t, int64(123456), tx.OrderCode)
	assert.Equal(t, referrerID, tx.ReferrerID)
	assert.Equal(t, studentID, tx.StudentID)
	assert.Equal(t, 199000, tx.StudentAmount)
	assert.InDelta(t, float32(0.3), tx.CommissionRate, 0.001)
	assert.Equal(t, 59700, tx.CommissionAmount)
	assert.Equal(t, "pending", tx.Status)
	assert.Equal(t, now, tx.CreatedAt)

	// BeforeCreate auto-generates UUID
	var ct models.CommissionTransaction
	err := ct.BeforeCreate(nil)
	assert.NoError(t, err)
	assert.NotEqual(t, uuid.Nil, ct.ID)
}

func TestUser_AffiliateFields(t *testing.T) {
	refCode := "REF12345"
	referrerID := uuid.New()

	u := models.User{
		ReferralCode:            &refCode,
		ReferrerID:              &referrerID,
		CommissionBalance:       100000,
		TotalCommissionReceived: 500000,
	}

	assert.NotNil(t, u.ReferralCode)
	assert.Equal(t, "REF12345", *u.ReferralCode)
	assert.NotNil(t, u.ReferrerID)
	assert.Equal(t, referrerID, *u.ReferrerID)
	assert.Equal(t, int64(100000), u.CommissionBalance)
	assert.Equal(t, int64(500000), u.TotalCommissionReceived)
}
