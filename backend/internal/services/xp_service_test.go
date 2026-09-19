package services

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func TestCalculateDeltaXP(t *testing.T) {
	// First attempt on Exam (factor 10) with 8.0 points -> 80 XP
	xp1 := CalculateDeltaXP("exam", 8.0, 0)
	assert.Equal(t, 80, xp1)

	// Retake on Exam with higher score 10.0 (prev 8.0) -> (10-8)*10 = 20 XP
	xp2 := CalculateDeltaXP("exam", 10.0, 8.0)
	assert.Equal(t, 20, xp2)

	// Retake on Exam with lower score 7.0 (prev 8.0) -> 0 XP
	xp3 := CalculateDeltaXP("exam", 7.0, 8.0)
	assert.Equal(t, 0, xp3)

	// First attempt on Practice (factor 5) with 10.0 points -> 50 XP
	xp4 := CalculateDeltaXP("practice", 10.0, 0)
	assert.Equal(t, 50, xp4)
}

func TestIsConsecutiveDay(t *testing.T) {
	today := time.Date(2026, 9, 20, 10, 0, 0, 0, time.UTC)
	yesterday := time.Date(2026, 9, 19, 15, 0, 0, 0, time.UTC)
	sameDay := time.Date(2026, 9, 20, 8, 0, 0, 0, time.UTC)
	twoDaysAgo := time.Date(2026, 9, 18, 10, 0, 0, 0, time.UTC)

	assert.True(t, IsConsecutiveDay(yesterday, today))
	assert.False(t, IsConsecutiveDay(twoDaysAgo, today))
	assert.False(t, IsConsecutiveDay(sameDay, today))
}
