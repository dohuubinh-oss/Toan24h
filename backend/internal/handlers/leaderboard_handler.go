package handlers

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/modeptrai/exam-model-backend/internal/config"
	"github.com/modeptrai/exam-model-backend/internal/models"
	"gorm.io/gorm"
)

type LeaderboardHandler struct {
	DB *gorm.DB
}

func NewLeaderboardHandler(db *gorm.DB) *LeaderboardHandler {
	return &LeaderboardHandler{DB: db}
}

type LeaderboardEntry struct {
	ID            uuid.UUID `json:"id"`
	Rank          int       `json:"rank"`
	Name          string    `json:"name"`
	XP            string    `json:"xp"`
	WeeklyXP      int       `json:"weeklyXp"`
	LifetimeXP    int       `json:"lifetimeXp"`
	CurrentStreak int       `json:"currentStreak"`
	IsCurrentUser bool      `json:"isCurrentUser"`
	Grade         string    `json:"grade"`
}

func (h *LeaderboardHandler) GetWeeklyLeaderboard(c *gin.Context) {
	grade := c.Query("grade")
	limit := 10

	var currentUserID *uuid.UUID

	// Check if auth token exists in header or cookie
	authHeader := c.GetHeader("Authorization")
	var tokenStr string
	if authHeader != "" && strings.HasPrefix(authHeader, "Bearer ") {
		tokenStr = strings.TrimPrefix(authHeader, "Bearer ")
	} else if cookie, err := c.Cookie("accessToken"); err == nil && cookie != "" {
		tokenStr = cookie
	}

	if tokenStr != "" && config.Env != nil && config.Env.JWTSecret != "" {
		token, err := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
			return []byte(config.Env.JWTSecret), nil
		})
		if err == nil && token.Valid {
			if claims, ok := token.Claims.(jwt.MapClaims); ok {
				if sub, ok := claims["sub"].(string); ok {
					if uid, err := uuid.Parse(sub); err == nil {
						currentUserID = &uid
					}
				}
			}
		}
	}

	query := h.DB.Model(&models.User{}).Where("role = ? AND status = ?", "student", "active")
	if grade != "" {
		query = query.Where("grade = ?", grade)
	}

	var users []models.User
	if err := query.Order("weekly_xp DESC, lifetime_xp DESC, updated_at ASC").Limit(limit).Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Failed to fetch leaderboard"})
		return
	}

	entries := make([]LeaderboardEntry, len(users))
	for i, u := range users {
		isCurrent := currentUserID != nil && u.ID == *currentUserID
		entries[i] = LeaderboardEntry{
			ID:            u.ID,
			Rank:          i + 1,
			Name:          u.FullName,
			XP:            fmt.Sprintf("%d XP", u.WeeklyXP),
			WeeklyXP:      u.WeeklyXP,
			LifetimeXP:    u.LifetimeXP,
			CurrentStreak: u.CurrentStreak,
			IsCurrentUser: isCurrent,
			Grade:         u.Grade,
		}
	}

	// Find current user's actual rank if not in top 10 or to return explicit rank
	var currentUserRank *LeaderboardEntry
	if currentUserID != nil {
		var user models.User
		if err := h.DB.First(&user, "id = ?", *currentUserID).Error; err == nil {
			userGrade := user.Grade
			if grade != "" {
				userGrade = grade
			}

			var countHigher int64
			h.DB.Model(&models.User{}).
				Where("role = ? AND status = ? AND grade = ? AND (weekly_xp > ? OR (weekly_xp = ? AND lifetime_xp > ?))",
					"student", "active", userGrade, user.WeeklyXP, user.WeeklyXP, user.LifetimeXP).
				Count(&countHigher)

			currentUserRank = &LeaderboardEntry{
				ID:            user.ID,
				Rank:          int(countHigher) + 1,
				Name:          user.FullName,
				XP:            fmt.Sprintf("%d XP", user.WeeklyXP),
				WeeklyXP:      user.WeeklyXP,
				LifetimeXP:    user.LifetimeXP,
				CurrentStreak: user.CurrentStreak,
				IsCurrentUser: true,
				Grade:         user.Grade,
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data": gin.H{
			"leaderboard":     entries,
			"currentUserRank": currentUserRank,
		},
	})
}
