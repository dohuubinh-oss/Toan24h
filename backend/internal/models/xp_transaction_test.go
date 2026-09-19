package models

import (
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

func TestXPTransactionCreation(t *testing.T) {
	userID := uuid.New()
	sourceID := uuid.New()
	tx := XPTransaction{
		ID:         uuid.New(),
		UserID:     userID,
		SourceType: XPSourceExam,
		SourceID:   &sourceID,
		XPAmount:   30,
		CreatedAt:  time.Now(),
	}

	assert.Equal(t, userID, tx.UserID)
	assert.Equal(t, XPSourceExam, tx.SourceType)
	assert.Equal(t, 30, tx.XPAmount)
}
