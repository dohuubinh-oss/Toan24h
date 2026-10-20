package controllers

import (
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/modeptrai/exam-model-backend/internal/services"
	"github.com/modeptrai/exam-model-backend/internal/utils"
)

type TextExtractorFunc func(fileBytes []byte, mimeType string) (*services.OCRResult, error)

type MobileUploadResult struct {
	Text       string    `json:"text"`
	PageCount  int       `json:"pageCount"`
	CreatedAt  time.Time `json:"createdAt"`
	UpdatedAt  time.Time `json:"updatedAt"`
	IsComplete bool      `json:"isComplete"`
}

type RateLimitEntry struct {
	Count       int
	WindowStart time.Time
}

type MobileUploadController struct {
	store     sync.Map // sessionId -> MobileUploadResult
	rateLimit sync.Map // rateKey -> RateLimitEntry
	rateMu    sync.Mutex
	extractor TextExtractorFunc
}

func NewMobileUploadController() *MobileUploadController {
	c := &MobileUploadController{
		extractor: services.ExtractTextFromImageWithGemini,
	}
	// Run background cleaner every 5 minutes to remove expired sessions (>10 min)
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

// SetExtractor cho phép mock extractor phục vụ unit test
func (ctrl *MobileUploadController) SetExtractor(fn TextExtractorFunc) {
	ctrl.extractor = fn
}

// InjectSessionForTest cho phép giả lập phiên cho unit test kiểm tra TTL
func (ctrl *MobileUploadController) InjectSessionForTest(sessionID string, text string, createdAt time.Time) {
	ctrl.store.Store(sessionID, MobileUploadResult{
		Text:       text,
		PageCount:  1,
		CreatedAt:  createdAt,
		UpdatedAt:  createdAt,
		IsComplete: true,
	})
}

// checkRateLimit giới hạn tối đa 5 lần upload/phút trên mỗi session/IP
func (ctrl *MobileUploadController) checkRateLimit(key string) bool {
	ctrl.rateMu.Lock()
	defer ctrl.rateMu.Unlock()

	now := time.Now()
	val, ok := ctrl.rateLimit.Load(key)
	if !ok {
		ctrl.rateLimit.Store(key, RateLimitEntry{Count: 1, WindowStart: now})
		return true
	}

	entry := val.(RateLimitEntry)
	if now.Sub(entry.WindowStart) > time.Minute {
		ctrl.rateLimit.Store(key, RateLimitEntry{Count: 1, WindowStart: now})
		return true
	}

	if entry.Count >= 5 {
		return false
	}

	entry.Count++
	ctrl.rateLimit.Store(key, entry)
	return true
}

func (ctrl *MobileUploadController) UploadFromMobile(c *gin.Context) {
	sessionID := c.Param("sessionId")
	if sessionID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing sessionId"})
		return
	}

	// 1. Kiểm tra Rate Limiting (tối đa 5 lượt/phút)
	rateKey := sessionID + "_" + c.ClientIP()
	if !ctrl.checkRateLimit(rateKey) {
		c.JSON(http.StatusTooManyRequests, gin.H{
			"error": "Bạn đã gửi quá nhiều yêu cầu trong thời gian ngắn (tối đa 5 lượt/phút). Vui lòng chờ giây lát.",
		})
		return
	}

	// 2. Kiểm tra TTL phiên hiện tại (tối đa 10 phút)
	var existing MobileUploadResult
	if val, ok := ctrl.store.Load(sessionID); ok {
		existing = val.(MobileUploadResult)
		if time.Since(existing.CreatedAt) > 10*time.Minute {
			ctrl.store.Delete(sessionID)
			c.JSON(http.StatusGone, gin.H{"error": "Phiên làm việc đã hết hạn (10 phút). Vui lòng quét lại mã QR trên máy tính."})
			return
		}
	} else {
		existing = MobileUploadResult{
			CreatedAt: time.Now(),
		}
	}

	// 3. Đọc danh sách file tải lên (hỗ trợ cả mảng 'files' hoặc đơn lẻ 'file')
	var fileHeaders []*multipart.FileHeader
	form, err := c.MultipartForm()
	if err == nil && form != nil {
		if files, ok := form.File["files"]; ok && len(files) > 0 {
			fileHeaders = files
		} else if file, ok := form.File["file"]; ok && len(file) > 0 {
			fileHeaders = file
		}
	}

	if len(fileHeaders) == 0 {
		file, header, err := c.Request.FormFile("file")
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Không tìm thấy file ảnh"})
			return
		}
		_ = file.Close()
		fileHeaders = []*multipart.FileHeader{header}
	}

	if len(fileHeaders) > 5 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Chỉ được gửi tối đa 5 trang ảnh cùng lúc"})
		return
	}

	// 4. Validate và nhận dạng từng trang ảnh
	for _, header := range fileHeaders {
		if header.Size > 10*1024*1024 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "File ảnh vượt quá dung lượng tối đa 10MB"})
			return
		}

		file, err := header.Open()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi khi mở file ảnh"})
			return
		}

		fileBytes, err := io.ReadAll(file)
		_ = file.Close()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi khi đọc file ảnh"})
			return
		}

		// Kiểm tra Magic Bytes nhị phân bảo mật
		if err := utils.ValidateImageBytes(fileBytes, utils.DefaultImageValidationOptions); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Định dạng ảnh không hợp lệ: " + err.Error()})
			return
		}

		mimeType := header.Header.Get("Content-Type")
		if mimeType == "" {
			mimeType = "image/jpeg"
		}

		result, err := ctrl.extractor(fileBytes, mimeType)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Đã xảy ra lỗi trong quá trình nhận dạng ảnh"})
			return
		}

		existing.PageCount++
		if existing.Text == "" {
			existing.Text = result.Text
		} else {
			existing.Text = fmt.Sprintf("%s\n\n--- Trang %d ---\n\n%s", existing.Text, existing.PageCount, result.Text)
		}
	}

	existing.UpdatedAt = time.Now()
	existing.IsComplete = true
	ctrl.store.Store(sessionID, existing)

	c.JSON(http.StatusOK, gin.H{
		"message":   "Upload và nhận dạng thành công",
		"text":      existing.Text,
		"pageCount": existing.PageCount,
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
	// Kiểm tra nếu session đã quá 10 phút
	if time.Since(res.CreatedAt) > 10*time.Minute {
		ctrl.store.Delete(sessionID)
		c.JSON(http.StatusOK, gin.H{
			"status":  "expired",
			"message": "Phiên làm việc đã hết hạn (10 phút)",
		})
		return
	}

	// Delete once consumed so it doesn't trigger multiple times
	ctrl.store.Delete(sessionID)

	c.JSON(http.StatusOK, gin.H{
		"status":    "completed",
		"text":      res.Text,
		"pageCount": res.PageCount,
	})
}
