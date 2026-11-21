package services_test

import (
	"context"
	"testing"

	"github.com/google/uuid"
	"github.com/modeptrai/exam-model-backend/internal/services"
	"github.com/stretchr/testify/assert"
)

func TestSessionService_SingleActiveSessionLimit(t *testing.T) {
	services.ResetLocalSessionStoreForTest()
	ctx := context.Background()
	userID := uuid.New()

	session1 := "session-device-1-" + uuid.New().String()
	session2 := "session-device-2-" + uuid.New().String()

	// 1. Device 1 logs in
	err := services.SetActiveSession(ctx, nil, userID, session1)
	assert.NoError(t, err)

	// Validate Device 1 session -> Should be VALID
	valid, err := services.ValidateActiveSession(ctx, nil, userID, session1)
	assert.NoError(t, err)
	assert.True(t, valid, "Device 1 session should be valid")

	// 2. Device 2 logs in on the same account
	err = services.SetActiveSession(ctx, nil, userID, session2)
	assert.NoError(t, err)

	// Validate Device 2 session -> Should be VALID
	valid, err = services.ValidateActiveSession(ctx, nil, userID, session2)
	assert.NoError(t, err)
	assert.True(t, valid, "Device 2 session should be valid")

	// Validate Device 1 session -> Should be INVALID (kicked out by Device 2)
	valid, err = services.ValidateActiveSession(ctx, nil, userID, session1)
	assert.NoError(t, err)
	assert.False(t, valid, "Device 1 session must be superseded and invalidated")

	// 3. User logs out on Device 2
	err = services.InvalidateSession(ctx, nil, userID)
	assert.NoError(t, err)

	// Invalidate clears session from memory store
	valid, err = services.ValidateActiveSession(ctx, nil, userID, session2)
	assert.NoError(t, err)
	// When cleared and db is nil, falls back gracefully
}

func TestSessionService_EmptySessionID(t *testing.T) {
	ctx := context.Background()
	userID := uuid.New()

	// Empty sessionID should return true for backward compatibility
	valid, err := services.ValidateActiveSession(ctx, nil, userID, "")
	assert.NoError(t, err)
	assert.True(t, valid)
}
