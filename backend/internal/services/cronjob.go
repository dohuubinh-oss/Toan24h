package services

import (
	"log"
	"os"
	"path/filepath"
	"time"
)

// StartCronJobs khởi động các tác vụ nền định kỳ
func StartCronJobs() {
	// Chạy dọn dẹp ảnh tạm 1 tuần 1 lần (mỗi 168 giờ)
	// Hoặc có thể chạy mỗi ngày để dọn rác cũ 1 tiếng
	// Theo yêu cầu: quét mỗi 1 tuần, xoá ảnh cũ hơn 1 giờ
	go func() {
		ticker := time.NewTicker(7 * 24 * time.Hour)
		defer ticker.Stop()

		for {
			<-ticker.C
			cleanupTempUploads()
		}
	}()
	
	// Chạy ngay lần đầu tiên khi khởi động server (tuỳ chọn, ở đây ta cứ để chạy)
	go cleanupTempUploads()
}

func cleanupTempUploads() {
	tempDir := filepath.Join(".", "uploads", "temp")
	
	// Bỏ qua nếu thư mục không tồn tại
	if _, err := os.Stat(tempDir); os.IsNotExist(err) {
		return
	}

	entries, err := os.ReadDir(tempDir)
	if err != nil {
		log.Printf("Cronjob error: Failed to read temp directory: %v\n", err)
		return
	}

	now := time.Now()
	deletedCount := 0

	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}

		filePath := filepath.Join(tempDir, entry.Name())
		info, err := entry.Info()
		if err != nil {
			continue
		}

		// Nếu file cũ hơn 1 giờ, xoá
		if now.Sub(info.ModTime()) > 1*time.Hour {
			if err := os.Remove(filePath); err == nil {
				deletedCount++
			} else {
				log.Printf("Cronjob error: Failed to delete file %s: %v\n", filePath, err)
			}
		}
	}

	if deletedCount > 0 {
		log.Printf("Cronjob info: Cleaned up %d temporary images\n", deletedCount)
	}
}
