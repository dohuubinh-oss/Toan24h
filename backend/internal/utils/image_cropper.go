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

	// Nới rộng chiều ngang (padX = 15px) để đảm bảo không bị lẹm các nhãn chữ/số bên trái (như "x (cm)", "6 (cm)")
	// và mép phải. Không nới rộng lên trên (padYTop = 0px) để tránh cắt dính vào viền khung/chữ đề bài phía trên.
	// Nới nhẹ phía dưới (padYBottom = 4px) để hình thoáng mà không dính vào các phương án A, B, C, D.
	padX := 15
	padYTop := 0
	padYBottom := 8

	x0 := int(xmin*width) - padX
	y0 := int(ymin*height) - padYTop
	x1 := int(xmax*width) + padX
	y1 := int(ymax*height) + padYBottom

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

	// Tinh chỉnh tọa độ thông minh: loại bỏ viền khung/chữ thừa phía trên và nới rộng đủ cho nhãn
	x0, y0, x1, y1 = refineDiagramBounds(src, x0, y0, x1, y1)

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

// refineDiagramBounds tự động rà quét để:
// 1. Loại bỏ viền khung hoặc dòng chữ đề bài bị dính ở đỉnh (y0): nếu y0 rơi vào vùng chữ/khung màu
//    và có khoảng trắng (nền trắng) ngăn cách với hình vẽ, y0 sẽ nhảy xuống dưới khoảng trắng đó.
// 2. Nới rộng y1 xuống dưới nếu có các đường gióng kích thước/chữ số kích thước ở đáy (như 8 (cm), y (cm))
//    trước khi chạm đến khoảng trắng ngăn cách với các phương án A, B, C, D.
// 3. Nới rộng x0 sang trái để đảm bảo không bị lẹm các nhãn kích thước bên trái.
func refineDiagramBounds(src image.Image, x0, y0, x1, y1 int) (int, int, int, int) {
	b := src.Bounds()
	if x0 < b.Min.X {
		x0 = b.Min.X
	}
	if y0 < b.Min.Y {
		y0 = b.Min.Y
	}
	if x1 > b.Max.X {
		x1 = b.Max.X
	}
	if y1 > b.Max.Y {
		y1 = b.Max.Y
	}

	// Chỉ áp dụng tinh chỉnh nâng cao nếu tài liệu có nền sáng/trắng (kiểm tra 4 góc ảnh)
	cR, cG, cB, _ := src.At(b.Min.X, b.Min.Y).RGBA()
	if (cR>>8) < 200 || (cG>>8) < 200 || (cB>>8) < 200 {
		return x0, y0, x1, y1
	}

	isBg := func(x, y int) bool {
		r, g, b, _ := src.At(x, y).RGBA()
		r8, g8, b8 := int(r>>8), int(g>>8), int(b>>8)
		return r8 >= 246 && g8 >= 246 && b8 >= 246
	}

	// 1. Refine y0 (top): Nếu y0 chạm vào văn bản đề bài hoặc khung màu của đề bài,
	// tìm dải khoảng trắng (white gap) nằm giữa đề bài và đỉnh hình vẽ để cắt bỏ hoàn toàn phần thừa phía trên.
	sampleW := x1 - x0
	if sampleW > 10 {
		for y := y0; y < y0+90 && y < y1-20; y++ {
			bgCount := 0
			for x := x0; x < x1; x++ {
				if isBg(x, y) {
					bgCount++
				}
			}
			// Nếu hàng này gần như là nền trắng toàn bộ (>= 94%), đây là khoảng phân cách an toàn
			if bgCount*100/sampleW >= 94 {
				// Tìm hàng đầu tiên có nét vẽ/chữ của hình vẽ ngay sau khoảng trắng
				for ny := y; ny < y1; ny++ {
					hasInk := false
					for x := x0; x < x1; x++ {
						if !isBg(x, ny) {
							hasInk = true
							break
						}
					}
					if hasInk {
						y0 = ny - 2
						if y0 < b.Min.Y {
							y0 = b.Min.Y
						}
						break
					}
				}
				break
			}
		}
	}

	// 2. Refine y1 (bottom): Mở rộng xuống dưới nếu có các đường gióng kích thước/nhãn số đo ở đáy
	maxY := y1 + 70
	if maxY > b.Max.Y {
		maxY = b.Max.Y
	}
	lastInkY := y1
	for y := y1; y < maxY; y++ {
		inkCount := 0
		for x := x0; x < x1; x++ {
			if !isBg(x, y) {
				inkCount++
			}
		}
		if inkCount >= 4 {
			lastInkY = y
		} else if y > lastInkY+6 {
			// Gặp dải trắng 6px trước khi đến phương án A, B, C, D thì dừng
			break
		}
	}
	y1 = lastInkY + 6
	if y1 > b.Max.Y {
		y1 = b.Max.Y
	}

	// 3. Refine x0 (left): Mở rộng sang trái để bao trọn nhãn kích thước bên trái
	minX := x0 - 40
	if minX < b.Min.X {
		minX = b.Min.X
	}
	firstInkX := x0
	for x := x0; x >= minX; x-- {
		inkCount := 0
		for y := y0; y < y1; y++ {
			if !isBg(x, y) {
				inkCount++
			}
		}
		if inkCount >= 2 {
			firstInkX = x
		} else if x < firstInkX-5 {
			break
		}
	}
	x0 = firstInkX - 4
	if x0 < b.Min.X {
		x0 = b.Min.X
	}

	return x0, y0, x1, y1
}
