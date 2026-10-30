package services

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func TestNextMay25Midnight(t *testing.T) {
	loc, err := time.LoadLocation("Asia/Ho_Chi_Minh")
	if err != nil {
		loc = time.FixedZone("ICT", 7*3600)
	}

	t.Run("Before May 25 of current year schedules to current year May 25", func(t *testing.T) {
		// Mock current time: 2026-03-15 10:00:00
		now := time.Date(2026, 3, 15, 10, 0, 0, 0, loc)
		nextTarget := NextMay25Midnight(now, loc)

		expected := time.Date(2026, 5, 25, 0, 0, 0, 0, loc)
		assert.Equal(t, expected, nextTarget)
	})

	t.Run("On May 25 after 00:00:00 schedules to next year May 25", func(t *testing.T) {
		// Mock current time: 2026-05-25 12:00:00
		now := time.Date(2026, 5, 25, 12, 0, 0, 0, loc)
		nextTarget := NextMay25Midnight(now, loc)

		expected := time.Date(2027, 5, 25, 0, 0, 0, 0, loc)
		assert.Equal(t, expected, nextTarget)
	})

	t.Run("After May 25 (e.g. October 30) schedules to next year May 25", func(t *testing.T) {
		// Mock current time: 2026-10-30 13:00:00
		now := time.Date(2026, 10, 30, 13, 0, 0, 0, loc)
		nextTarget := NextMay25Midnight(now, loc)

		expected := time.Date(2027, 5, 25, 0, 0, 0, 0, loc)
		assert.Equal(t, expected, nextTarget)
	})
}
