package controllers

import (
	"io"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/modeptrai/exam-model-backend/internal/services"
)

type MobileUploadResult struct {
	Text      string    `json:"text"`
	CreatedAt time.Time `json:"createdAt"`
}

type MobileUploadController struct {
	store sync.Map
}

func NewMobileUploadController() *MobileUploadController {
	c := &MobileUploadController{}
	// Run background cleaner every 5 minutes to remove expired sessions
	go func() {
		for {
			time.Sleep(5 * time.Minute)
			now := time.Now()
			c.store.Range(func(key, value any) bool {
				if res, ok := value.(MobileUploadResult); ok {
					if now.Sub(res.CreatedAt) > 10*time.Minute {
						c.store.Delete(key)
					}
				}
				return true
			})
		}
	}()
	return c
}

func (ctrl *MobileUploadController) UploadFromMobile(c *gin.Context) {
	sessionID := c.Param("sessionId")
	if sessionID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing sessionId"})
		return
	}

	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Không tìm thấy file ảnh"})
		return
	}
	defer file.Close()

	// Limit file size to 10MB to prevent DoS RAM exhaustion
	if header.Size > 10*1024*1024 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File ảnh vượt quá dung lượng tối đa 10MB"})
		return
	}

	fileBytes, err := io.ReadAll(file)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi khi đọc file ảnh"})
		return
	}

	mimeType := header.Header.Get("Content-Type")
	if mimeType == "" {
		mimeType = "image/jpeg"
	}

	result, err := services.ExtractTextFromImageWithGemini(fileBytes, mimeType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Đã xảy ra lỗi trong quá trình nhận dạng ảnh"})
		return
	}

	ctrl.store.Store(sessionID, MobileUploadResult{
		Text:      result.Text,
		CreatedAt: time.Now(),
	})

	c.JSON(http.StatusOK, gin.H{
		"message": "Upload và nhận dạng thành công",
		"text":    result.Text,
	})
}

func (ctrl *MobileUploadController) CheckUploadStatus(c *gin.Context) {
	sessionID := c.Param("sessionId")
	if sessionID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing sessionId"})
		return
	}

	val, ok := ctrl.store.Load(sessionID)
	if !ok {
		c.JSON(http.StatusOK, gin.H{
			"status": "waiting",
		})
		return
	}

	res := val.(MobileUploadResult)
	// Delete once consumed so it doesn't trigger multiple times
	ctrl.store.Delete(sessionID)

	c.JSON(http.StatusOK, gin.H{
		"status": "completed",
		"text":   res.Text,
	})
}
