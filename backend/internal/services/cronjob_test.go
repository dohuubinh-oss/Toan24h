package services

import (
	"os"
	"path/filepath"
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

func TestMoveDiagramTempToPermanent(t *testing.T) {
	tempBase := filepath.Join(".", "test_diagram_move")
	defer os.RemoveAll(tempBase)

	tempUploads := filepath.Join(tempBase, "uploads", "temp")
	err := os.MkdirAll(tempUploads, 0755)
	assert.NoError(t, err)

	tempFile := filepath.Join(tempUploads, "sess123_diagram.jpg")
	err = os.WriteFile(tempFile, []byte("fake diagram bytes"), 0644)
	assert.NoError(t, err)

	// Call MoveDiagramTempToPermanent
	permURL := MoveDiagramTempToPermanent(tempBase, "/uploads/temp/sess123_diagram.jpg", "sub1", "q1")
	assert.Equal(t, "/uploads/diagrams/sub1_q1.jpg", permURL)

	// Verify temp file no longer exists, and permanent file exists
	assert.NoFileExists(t, tempFile)
	expectedPermFile := filepath.Join(tempBase, "uploads", "diagrams", "sub1_q1.jpg")
	assert.FileExists(t, expectedPermFile)
}

func TestCleanupOldSubmissionsAndDiagrams15Months(t *testing.T) {
	tempBase := filepath.Join(".", "test_diagram_cleanup_15m")
	defer os.RemoveAll(tempBase)

	diagDir := filepath.Join(tempBase, "uploads", "diagrams")
	err := os.MkdirAll(diagDir, 0755)
	assert.NoError(t, err)

	oldFile := filepath.Join(diagDir, "old_diagram.jpg")
	err = os.WriteFile(oldFile, []byte("old image"), 0644)
	assert.NoError(t, err)

	// Set file mod time to 16 months ago
	past := time.Now().AddDate(0, -16, 0)
	err = os.Chtimes(oldFile, past, past)
	assert.NoError(t, err)

	newFile := filepath.Join(diagDir, "recent_diagram.jpg")
	err = os.WriteFile(newFile, []byte("new image"), 0644)
	assert.NoError(t, err)

	// Run cleanup with retention 15 months (db nil for file-only test)
	_, deletedFiles, err := CleanupOldSubmissionsAndDiagrams(nil, tempBase, 15)
	assert.NoError(t, err)
	assert.Equal(t, 1, deletedFiles)

	assert.NoFileExists(t, oldFile)
	assert.FileExists(t, newFile)
}

