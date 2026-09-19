package services

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func TestNextMondayMidnight(t *testing.T) {
	loc, err := time.LoadLocation("Asia/Ho_Chi_Minh")
	if err != nil {
		loc = time.FixedZone("ICT", 7*3600)
	}

	// Sunday 2026-09-20 15:00
	sunday := time.Date(2026, 9, 20, 15, 0, 0, 0, loc)
	nextMon := NextMondayMidnight(sunday, loc)

	assert.Equal(t, time.Monday, nextMon.Weekday())
	assert.Equal(t, 2026, nextMon.Year())
	assert.Equal(t, time.September, nextMon.Month())
	assert.Equal(t, 21, nextMon.Day())
	assert.Equal(t, 0, nextMon.Hour())
	assert.Equal(t, 0, nextMon.Minute())
}
