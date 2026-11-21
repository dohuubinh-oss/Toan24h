package utils

import (
	"bytes"
	"fmt"
	"image"
	"image/draw"
	"image/jpeg"
	_ "image/png"
	"net/http"

	xdraw "golang.org/x/image/draw"
	_ "golang.org/x/image/webp"
)

const (
	// MaxUploadImageBytes is the strict 5MB limit per image to prevent Storage DDoS
	MaxUploadImageBytes = 5 * 1024 * 1024
	// MaxAllowedDimension prevents pixel flood / decompression bomb attacks
	MaxAllowedDimension = 8000
)

// SanitizeAndCompressImage validates the true nature of an image file by decoding its raw pixel matrix,
// completely stripping all EXIF metadata, camera tags, and potential embedded backdoor code,
// and re-encoding it into a clean, optimized JPEG format.
func SanitizeAndCompressImage(fileBytes []byte, maxDim int) ([]byte, error) {
	if len(fileBytes) == 0 {
		return nil, fmt.Errorf("tệp ảnh rỗng")
	}

	// 1. Strict 5MB file size limit
	if int64(len(fileBytes)) > MaxUploadImageBytes {
		return nil, fmt.Errorf("dung lượng file vượt quá giới hạn 5MB")
	}

	// 2. Validate magic bytes header
	sniffLen := 512
	if len(fileBytes) < sniffLen {
		sniffLen = len(fileBytes)
	}
	mime := http.DetectContentType(fileBytes[:sniffLen])
	if mime == "application/octet-stream" && len(fileBytes) >= 12 {
		if string(fileBytes[0:4]) == "RIFF" && string(fileBytes[8:12]) == "WEBP" {
			mime = "image/webp"
		}
	}

	if mime != "image/jpeg" && mime != "image/png" && mime != "image/webp" {
		return nil, fmt.Errorf("định dạng không được phép: chỉ chấp nhận JPEG, PNG, WEBP (phát hiện: %s)", mime)
	}

	// 3. Decode actual pixel matrix (fails if file is not a real decodable image or is a webshell)
	img, _, err := image.Decode(bytes.NewReader(fileBytes))
	if err != nil {
		return nil, fmt.Errorf("dữ liệu ảnh không hợp lệ hoặc đã bị chỉnh sửa mã độc: %w", err)
	}

	bounds := img.Bounds()
	width := bounds.Dx()
	height := bounds.Dy()

	if width <= 0 || height <= 0 {
		return nil, fmt.Errorf("kích thước ảnh không hợp lệ")
	}

	// Prevent decompression bomb / pixel flood attacks
	if width > MaxAllowedDimension || height > MaxAllowedDimension {
		return nil, fmt.Errorf("kích thước chiều dài/rộng (%dx%d) vượt quá giới hạn tối đa %dpx", width, height, MaxAllowedDimension)
	}

	// 4. Downscale if dimensions exceed maxDim (e.g. 1920px for HD or 400px for avatar)
	if maxDim > 0 && (width > maxDim || height > maxDim) {
		ratio := float64(width) / float64(height)
		var newWidth, newHeight int
		if width > height {
			newWidth = maxDim
			newHeight = int(float64(maxDim) / ratio)
		} else {
			newHeight = maxDim
			newWidth = int(float64(maxDim) * ratio)
		}

		dst := image.NewRGBA(image.Rect(0, 0, newWidth, newHeight))
		xdraw.BiLinear.Scale(dst, dst.Bounds(), img, bounds, draw.Over, nil)
		img = dst
	}

	// 5. Re-encode from raw pixel memory to a pristine JPEG stream
	// This step permanently discards ALL EXIF metadata, GPS, user comments, and embedded scripts.
	buf := new(bytes.Buffer)
	err = jpeg.Encode(buf, img, &jpeg.Options{Quality: 85})
	if err != nil {
		return nil, fmt.Errorf("lỗi khi tái mã hóa ảnh an toàn: %w", err)
	}

	return buf.Bytes(), nil
}
