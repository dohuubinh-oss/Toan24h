package models_test

import (
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/modeptrai/exam-model-backend/internal/models"
	"github.com/stretchr/testify/assert"
)

func TestVoucherModel_IsValid(t *testing.T) {
	affiliateID := uuid.New()
	future := time.Now().Add(30 * 24 * time.Hour)
	past := time.Now().Add(-24 * time.Hour)

	// 1. Valid Voucher
	v1 := models.Voucher{
		Code:        "THAYBINH3M",
		AffiliateID: &affiliateID,
		FreeMonths:  3,
		MaxUses:     100,
		UsedCount:   10,
		ExpiresAt:   &future,
		IsActive:    true,
	}
	assert.True(t, v1.IsValid())

	// 2. Inactive Voucher
	v2 := v1
	v2.IsActive = false
	assert.False(t, v2.IsValid())

	// 3. Expired Voucher
	v3 := v1
	v3.ExpiresAt = &past
	assert.False(t, v3.IsValid())

	// 4. Max uses reached
	v4 := v1
	v4.UsedCount = 100
	assert.False(t, v4.IsValid())

	// 5. BeforeCreate auto-generates UUID
	var v5 models.Voucher
	err := v5.BeforeCreate(nil)
	assert.NoError(t, err)
	assert.NotEqual(t, uuid.Nil, v5.ID)
}
