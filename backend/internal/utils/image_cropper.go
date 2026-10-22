package utils

import (
	"bytes"
	"fmt"
	"image"
	"image/draw"
	"image/jpeg"
	_ "image/png"
	"os"
	"path/filepath"

	"github.com/google/uuid"
	xdraw "golang.org/x/image/draw"
)

// CompressAndResizeImage scales down an image if its dimensions exceed maxDim and encodes it to JPEG
func CompressAndResizeImage(fileBytes []byte, maxDim int) ([]byte, string, error) {
	img, _, err := image.Decode(bytes.NewReader(fileBytes))
	if err != nil {
		return nil, "", err
	}

	bounds := img.Bounds()
	width := bounds.Dx()
	height := bounds.Dy()

	if width > maxDim || height > maxDim {
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

	buf := new(bytes.Buffer)
	err = jpeg.Encode(buf, img, &jpeg.Options{Quality: 85})
	if err != nil {
		return nil, "", err
	}

	return buf.Bytes(), "image/jpeg", nil
}

// CropDiagram extracts a sub-region defined by box = [ymin, xmin, ymax, xmax]
// Coordinates can be normalized 0-1000 or 0.0-1.0.
// The cropped image is saved to targetDir and the web-accessible URL is returned.
func CropDiagram(src image.Image, box []float64, targetDir string) (string, error) {
	if src == nil {
		return "", fmt.Errorf("source image is nil")
	}
	if len(box) < 4 {
		return "", fmt.Errorf("bounding box must contain at least 4 coordinates [ymin, xmin, ymax, xmax]")
	}

	ymin, xmin, ymax, xmax := box[0], box[1], box[2], box[3]

	// Normalize if on 0-1000 scale
	if ymin > 1.0 || xmin > 1.0 || ymax > 1.0 || xmax > 1.0 {
		ymin /= 1000.0
		xmin /= 1000.0
		ymax /= 1000.0
		xmax /= 1000.0
	}

	bounds := src.Bounds()
	width := float64(bounds.Dx())
	height := float64(bounds.Dy())

	// Nới rộng mỗi phía 10px để tránh cắt lẹm viền, chữ hoặc chi tiết quanh hình vẽ
	padding := 10
	x0 := int(xmin*width) - padding
	y0 := int(ymin*height) - padding
	x1 := int(xmax*width) + padding
	y1 := int(ymax*height) + padding

	// Clamp to image dimensions
	if x0 < bounds.Min.X {
		x0 = bounds.Min.X
	}
	if y0 < bounds.Min.Y {
		y0 = bounds.Min.Y
	}
	if x1 > bounds.Max.X {
		x1 = bounds.Max.X
	}
	if y1 > bounds.Max.Y {
		y1 = bounds.Max.Y
	}

	// Ensure valid bounding area
	if x1 <= x0 {
		x1 = x0 + 10
		if x1 > bounds.Max.X {
			x1 = bounds.Max.X
		}
	}
	if y1 <= y0 {
		y1 = y0 + 10
		if y1 > bounds.Max.Y {
			y1 = bounds.Max.Y
		}
	}

	cropRect := image.Rect(x0, y0, x1, y1)

	// Create new RGBA image for cropped section
	cropped := image.NewRGBA(image.Rect(0, 0, cropRect.Dx(), cropRect.Dy()))
	draw.Draw(cropped, cropped.Bounds(), src, cropRect.Min, draw.Src)

	if targetDir == "" {
		targetDir = "./uploads/temp"
	}

	if err := os.MkdirAll(targetDir, 0755); err != nil {
		return "", fmt.Errorf("failed to create target directory: %w", err)
	}

	fileName := fmt.Sprintf("%s.jpg", uuid.New().String())
	filePath := filepath.Join(targetDir, fileName)

	file, err := os.Create(filePath)
	if err != nil {
		return "", fmt.Errorf("failed to create cropped image file: %w", err)
	}
	defer file.Close()

	opts := &jpeg.Options{Quality: 88}
	if err := jpeg.Encode(file, cropped, opts); err != nil {
		return "", fmt.Errorf("failed to encode cropped jpeg: %w", err)
	}

	// Always return the standard temp URL for frontend preview
	return fmt.Sprintf("/uploads/temp/%s", fileName), nil
}
