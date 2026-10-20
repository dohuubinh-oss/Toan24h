package utils

import (
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"path/filepath"
	"strings"
)

// ImageValidationOptions chứa các tiêu chí ràng buộc khi kiểm tra tệp ảnh
type ImageValidationOptions struct {
	MaxSizeBytes int64
	AllowedMimes []string
}

// DefaultImageValidationOptions cấu hình mặc định (tối đa 5MB, jpeg/png/webp)
var DefaultImageValidationOptions = ImageValidationOptions{
	MaxSizeBytes: 5 * 1024 * 1024, // 5MB
	AllowedMimes: []string{"image/jpeg", "image/png", "image/webp"},
}

// AvatarImageValidationOptions cấu hình cho ảnh đại diện (tối đa 5MB)
var AvatarImageValidationOptions = ImageValidationOptions{
	MaxSizeBytes: 5 * 1024 * 1024, // 5MB
	AllowedMimes: []string{"image/jpeg", "image/png", "image/webp"},
}

// MobileImageValidationOptions cấu hình cho ảnh chụp từ điện thoại (tối đa 10MB)
var MobileImageValidationOptions = ImageValidationOptions{
	MaxSizeBytes: 10 * 1024 * 1024, // 10MB
	AllowedMimes: []string{"image/jpeg", "image/png", "image/webp"},
}

// isMimeAllowed kiểm tra MIME type có nằm trong danh sách được phép không
func isMimeAllowed(detected string, allowed []string) bool {
	for _, m := range allowed {
		if strings.EqualFold(detected, m) {
			return true
		}
	}
	return false
}

// ValidateImageBytes kiểm tra mảng byte ảnh theo Magic Bytes và giới hạn dung lượng
func ValidateImageBytes(data []byte, opts ImageValidationOptions) error {
	if len(data) == 0 {
		return fmt.Errorf("empty image data")
	}

	if opts.MaxSizeBytes > 0 && int64(len(data)) > opts.MaxSizeBytes {
		return fmt.Errorf("file size exceeds limit of %d MB", opts.MaxSizeBytes/(1024*1024))
	}

	// Đọc tối đa 512 byte để phát hiện kiểu nội dung chuẩn (Magic Bytes)
	sniffLen := 512
	if len(data) < sniffLen {
		sniffLen = len(data)
	}
	detectedMime := http.DetectContentType(data[:sniffLen])

	// http.DetectContentType có thể trả về "image/jpeg", "image/png", hoặc "application/octet-stream" cho WebP
	// Cần kiểm tra thêm header RIFF...WEBP cho WebP nếu DetectContentType không nhận diện được
	if detectedMime == "application/octet-stream" && len(data) >= 12 {
		if string(data[0:4]) == "RIFF" && string(data[8:12]) == "WEBP" {
			detectedMime = "image/webp"
		}
	}

	if !isMimeAllowed(detectedMime, opts.AllowedMimes) {
		return fmt.Errorf("invalid image format: detected %s, only JPEG, PNG, and WebP are allowed", detectedMime)
	}

	return nil
}

// ValidateImageHeader kiểm tra phần mở rộng và Magic Bytes nhị phân của multipart.FileHeader
func ValidateImageHeader(header *multipart.FileHeader, opts ImageValidationOptions) error {
	if header == nil {
		return fmt.Errorf("no file header provided")
	}

	if opts.MaxSizeBytes > 0 && header.Size > opts.MaxSizeBytes {
		return fmt.Errorf("file size exceeds limit of %d MB", opts.MaxSizeBytes/(1024*1024))
	}

	// 1. Kiểm tra phần mở rộng
	ext := strings.ToLower(filepath.Ext(header.Filename))
	if ext != ".jpg" && ext != ".jpeg" && ext != ".png" && ext != ".webp" {
		return fmt.Errorf("invalid file extension %s: only .jpg, .jpeg, .png, .webp allowed", ext)
	}

	// 2. Mở file và đọc 512 byte đầu tiên để kiểm tra Magic Bytes thực tế
	file, err := header.Open()
	if err != nil {
		return fmt.Errorf("failed to open uploaded file: %w", err)
	}
	defer file.Close()

	buf := make([]byte, 512)
	n, err := file.Read(buf)
	if err != nil && err != io.EOF {
		return fmt.Errorf("failed to read file header: %w", err)
	}
	if n == 0 {
		return fmt.Errorf("file is empty")
	}

	detectedMime := http.DetectContentType(buf[:n])

	// Hỗ trợ WebP signature
	if detectedMime == "application/octet-stream" && n >= 12 {
		if string(buf[0:4]) == "RIFF" && string(buf[8:12]) == "WEBP" {
			detectedMime = "image/webp"
		}
	}

	if !isMimeAllowed(detectedMime, opts.AllowedMimes) {
		return fmt.Errorf("invalid image format: detected %s, content does not match image extension", detectedMime)
	}

	return nil
}
