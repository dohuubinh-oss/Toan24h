package services

import (
	"math"
	"time"

	"github.com/google/uuid"
	"github.com/modeptrai/exam-model-backend/internal/models"
	"gorm.io/gorm"
)

// CalculateDeltaXP calculates earned XP based on category and score improvement
func CalculateDeltaXP(cate string, newScore float64, prevHighestScore float64) int {
	factor := 10
	if cate == "practice" {
		factor = 5
	}

	if newScore <= prevHighestScore {
		return 0
	}

	diff := newScore - prevHighestScore
	earned := int(math.Round(diff * float64(factor)))
	if earned < 0 {
		return 0
	}
	return earned
}

// IsConsecutiveDay returns true if date2 is the calendar day immediately after date1
func IsConsecutiveDay(date1, date2 time.Time) bool {
	y1, m1, d1 := date1.UTC().Date()
	y2, m2, d2 := date2.UTC().Date()

	t1 := time.Date(y1, m1, d1, 0, 0, 0, 0, time.UTC)
	t2 := time.Date(y2, m2, d2, 0, 0, 0, 0, time.UTC)

	return t2.Sub(t1) == 24*time.Hour
}

// AwardExamXP handles XP calculation, user balance update, and streak tracking
func AwardExamXP(db *gorm.DB, userID uuid.UUID, examID uuid.UUID, cate string, newScore float64) (int, bool, error) {
	var user models.User
	if err := db.First(&user, "id = ?", userID).Error; err != nil {
		return 0, false, err
	}

	// 1. Find previous highest score for this exam by this user
	var maxScore *float64
	row := db.Model(&models.Submission{}).
		Where("user_id = ? AND exam_id = ? AND status = ?", userID, examID, models.StatusGraded).
		Select("MAX(total_score)").
		Row()
	_ = row.Scan(&maxScore)

	prevMax := 0.0
	if maxScore != nil {
		prevMax = *maxScore
	}

	deltaXP := CalculateDeltaXP(cate, newScore, prevMax)
	now := time.Now()
	streakBonus := false

	// 2. Check Daily Streak
	if user.LastActiveDate == nil {
		user.CurrentStreak = 1
		streakBonus = true
		deltaXP += 10 // Daily streak first bonus
	} else {
		lastY, lastM, lastD := user.LastActiveDate.UTC().Date()
		nowY, nowM, nowD := now.UTC().Date()

		if lastY != nowY || lastM != nowM || lastD != nowD {
			if IsConsecutiveDay(*user.LastActiveDate, now) {
				user.CurrentStreak += 1
			} else {
				user.CurrentStreak = 1
			}
			streakBonus = true
			deltaXP += 10 // First action of the day
		}
	}
	user.LastActiveDate = &now

	// 3. Update User XP if earned
	if deltaXP > 0 {
		user.WeeklyXP += deltaXP
		user.LifetimeXP += deltaXP

		sourceType := models.XPSourceExam
		if cate == "practice" {
			sourceType = models.XPSourcePractice
		}

		txRecord := models.XPTransaction{
			UserID:     userID,
			SourceType: sourceType,
			SourceID:   &examID,
			XPAmount:   deltaXP,
			CreatedAt:  now,
		}
		if err := db.Create(&txRecord).Error; err != nil {
			return 0, false, err
		}
	}

	if err := db.Save(&user).Error; err != nil {
		return 0, false, err
	}

	return deltaXP, streakBonus, nil
}
