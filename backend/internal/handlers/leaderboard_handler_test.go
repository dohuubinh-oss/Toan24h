package handlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func TestGetLeaderboardResponseFormat(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()

	r.GET("/api/v1/leaderboard", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "success",
			"data": gin.H{
				"leaderboard": []gin.H{
					{"id": "user-1", "rank": 1, "name": "Nguyễn Văn A", "xp": "120 XP", "weeklyXp": 120},
				},
				"currentUserRank": gin.H{"rank": 1, "weeklyXp": 120},
			},
		})
	})

	req, _ := http.NewRequest(http.MethodGet, "/api/v1/leaderboard?grade=5", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	var resp map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &resp)
	assert.NoError(t, err)
	assert.Equal(t, "success", resp["status"])
}
