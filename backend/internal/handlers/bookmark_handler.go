package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/modeptrai/exam-model-backend/internal/models"
	"gorm.io/gorm"
)

type BookmarkHandler struct {
	db *gorm.DB
}

func NewBookmarkHandler(db *gorm.DB) *BookmarkHandler {
	return &BookmarkHandler{db: db}
}

func (h *BookmarkHandler) ToggleLectureBookmark(c *gin.Context) {
	lectureIDStr := c.Param("id")
	lectureID, err := uuid.Parse(lectureIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid lecture ID format"})
		return
	}

	userIDRaw, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userID, ok := userIDRaw.(uuid.UUID)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user ID in context"})
		return
	}

	var existingBookmark models.LectureBookmark
	err = h.db.Where("user_id = ? AND lecture_id = ?", userID, lectureID).First(&existingBookmark).Error

	if err != nil {
		if err == gorm.ErrRecordNotFound {
			// Create bookmark
			newBookmark := models.LectureBookmark{
				UserID:    userID,
				LectureID: lectureID,
			}
			if err := h.db.Create(&newBookmark).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create bookmark"})
				return
			}
			c.JSON(http.StatusOK, gin.H{"message": "Bookmark added", "action": "added"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	// Remove bookmark
	if err := h.db.Delete(&existingBookmark).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to remove bookmark"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Bookmark removed", "action": "removed"})
}

func (h *BookmarkHandler) GetBookmarkedLectures(c *gin.Context) {
	userIDRaw, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userID, ok := userIDRaw.(uuid.UUID)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user ID in context"})
		return
	}

	var bookmarks []models.LectureBookmark
	if err := h.db.Preload("Lecture").Where("user_id = ?", userID).Find(&bookmarks).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch bookmarks"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": bookmarks,
	})
}
