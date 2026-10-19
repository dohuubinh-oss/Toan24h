package utils

import (
	"bytes"
	"image"
	"image/color"
	"image/draw"
	"image/jpeg"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestCropDiagram(t *testing.T) {
	// Create a synthetic 400x400 image with red and blue zones
	src := image.NewRGBA(image.Rect(0, 0, 400, 400))
	draw.Draw(src, image.Rect(0, 0, 400, 200), &image.Uniform{color.RGBA{255, 0, 0, 255}}, image.Point{}, draw.Src)
	draw.Draw(src, image.Rect(0, 200, 400, 400), &image.Uniform{color.RGBA{0, 0, 255, 255}}, image.Point{}, draw.Src)

	// Box in 0-1000 scale: [ymin, xmin, ymax, xmax] -> top-left quadrant [0, 0, 500, 500]
	box := []float64{0, 0, 500, 500}
	tempDir := "./uploads/temp"
	defer os.RemoveAll(tempDir)

	webUrl, err := CropDiagram(src, box, tempDir)
	assert.NoError(t, err)
	assert.True(t, strings.HasPrefix(webUrl, "/uploads/temp/"))
	assert.True(t, strings.HasSuffix(webUrl, ".jpg"))

	// Verify file actually exists on disk
	fileName := filepath.Base(webUrl)
	filePath := filepath.Join(tempDir, fileName)
	info, err := os.Stat(filePath)
	assert.NoError(t, err)
	assert.True(t, info.Size() > 0)
}

func TestCropDiagram_NormalizedZeroToOne(t *testing.T) {
	src := image.NewRGBA(image.Rect(0, 0, 200, 200))
	box := []float64{0.1, 0.1, 0.9, 0.9}
	tempDir := "./uploads/temp"
	defer os.RemoveAll(tempDir)

	webUrl, err := CropDiagram(src, box, tempDir)
	assert.NoError(t, err)
	assert.True(t, strings.HasPrefix(webUrl, "/uploads/temp/"))
}

func TestCompressAndResizeImage(t *testing.T) {
	// Create a 2000x1000 RGBA image
	src := image.NewRGBA(image.Rect(0, 0, 2000, 1000))
	buf := new(bytes.Buffer)
	err := jpeg.Encode(buf, src, &jpeg.Options{Quality: 90})
	assert.NoError(t, err)

	compressedBytes, mimeType, err := CompressAndResizeImage(buf.Bytes(), 1000)
	assert.NoError(t, err)
	assert.Equal(t, "image/jpeg", mimeType)
	assert.NotEmpty(t, compressedBytes)

	// Decode back to verify dimensions
	decoded, _, err := image.Decode(bytes.NewReader(compressedBytes))
	assert.NoError(t, err)
	assert.Equal(t, 1000, decoded.Bounds().Dx())
	assert.Equal(t, 500, decoded.Bounds().Dy())
}

