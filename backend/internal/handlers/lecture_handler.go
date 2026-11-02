package handlers

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/modeptrai/exam-model-backend/internal/cache"
	"github.com/modeptrai/exam-model-backend/internal/models"
	"github.com/modeptrai/exam-model-backend/internal/services"
	"github.com/modeptrai/exam-model-backend/internal/utils"
)

type LectureHandler struct {
	service services.LectureService
}

func NewLectureHandler(service services.LectureService) *LectureHandler {
	return &LectureHandler{service: service}
}

func (h *LectureHandler) CreateLecture(c *gin.Context) {
	var req services.CreateLectureRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid JSON payload",
			"details": err.Error(),
		})
		return
	}

	// If AuthorID is not provided, default to authenticated user ID
	if req.AuthorID == nil || *req.AuthorID == "" {
		if uidStr, err := utils.GetUserIDString(c); err == nil && uidStr != "" {
			req.AuthorID = &uidStr
		}
	}

	if err := h.service.CreateLecture(c.Request.Context(), req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	// Invalidate lectures cache
	_ = cache.InvalidatePrefix(c.Request.Context(), cache.LectureCachePrefix)

	c.JSON(http.StatusCreated, gin.H{
		"message": "Lecture created successfully",
	})
}

func (h *LectureHandler) UpdateLecture(c *gin.Context) {
	id := c.Param("id")
	var req services.CreateLectureRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid JSON payload",
			"details": err.Error(),
		})
		return
	}

	if err := h.service.UpdateLecture(c.Request.Context(), id, req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	// Invalidate lectures cache
	_ = cache.InvalidatePrefix(c.Request.Context(), cache.LectureCachePrefix)

	c.JSON(http.StatusOK, gin.H{
		"message": "Lecture updated successfully",
	})
}

func getPublishedOnlyFromContext(c *gin.Context) bool {
	// 1. Check if userRole is already set in gin context
	if roleVal, exists := c.Get("userRole"); exists {
		if role, ok := roleVal.(string); ok && (role == "teacher" || role == "admin") {
			return false
		}
	}

	// 2. Fallback: Check Authorization header or accessToken cookie if endpoint is public
	var tokenString string
	authHeader := c.GetHeader("Authorization")
	if authHeader != "" {
		parts := strings.Split(authHeader, " ")
		if len(parts) == 2 && parts[0] == "Bearer" {
			tokenString = parts[1]
		}
	}
	if tokenString == "" {
		if cookieToken, err := c.Cookie("accessToken"); err == nil && cookieToken != "" {
			tokenString = cookieToken
		}
	}

	if tokenString != "" {
		if claims, err := utils.ValidateAccessToken(tokenString); err == nil && claims != nil {
			if claims.Role == "teacher" || claims.Role == "admin" {
				return false
			}
		}
	}

	// Default for student, affiliate, or unauthenticated/guest -> published only
	return true
}

func (h *LectureHandler) GetLecturesByGrade(c *gin.Context) {
	grade := c.Param("grade")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "9"))
	publishedOnly := getPublishedOnlyFromContext(c)

	cacheKey := cache.BuildLectureGradeCacheKey(grade, page, limit, publishedOnly)
	var cachedRes services.PaginatedLectures
	if cache.Get(c.Request.Context(), cacheKey, &cachedRes) {
		c.JSON(http.StatusOK, cachedRes)
		return
	}

	res, err := h.service.GetLecturesByGrade(c.Request.Context(), grade, page, limit, publishedOnly)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	_ = cache.Set(c.Request.Context(), cacheKey, res, cache.DefaultTTL)

	c.JSON(http.StatusOK, res)
}

func (h *LectureHandler) GetAllLectures(c *gin.Context) {
	publishedOnly := getPublishedOnlyFromContext(c)
	cacheKey := cache.BuildLectureAllCacheKey(publishedOnly)
	var cachedRes []models.Lecture
	if cache.Get(c.Request.Context(), cacheKey, &cachedRes) {
		c.JSON(http.StatusOK, gin.H{"data": cachedRes})
		return
	}

	res, err := h.service.GetAllLectures(c.Request.Context(), publishedOnly)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	_ = cache.Set(c.Request.Context(), cacheKey, res, cache.DefaultTTL)

	c.JSON(http.StatusOK, gin.H{"data": res})
}

func (h *LectureHandler) GetLectureByID(c *gin.Context) {
	id := c.Param("id")
	res, err := h.service.GetLectureByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, res)
}

func (h *LectureHandler) DeleteLecture(c *gin.Context) {
	id := c.Param("id")
	if err := h.service.DeleteLecture(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Invalidate lectures cache
	_ = cache.InvalidatePrefix(c.Request.Context(), cache.LectureCachePrefix)

	c.JSON(http.StatusOK, gin.H{"message": "Lecture deleted successfully"})
}
