package utils_test

import (
	"bytes"
	"image"
	"image/color"
	"image/draw"
	"image/jpeg"
	"image/png"
	"testing"

	"github.com/modeptrai/exam-model-backend/internal/utils"
	"github.com/stretchr/testify/assert"
)

func createTestJPEG(width, height int) []byte {
	img := image.NewRGBA(image.Rect(0, 0, width, height))
	draw.Draw(img, img.Bounds(), &image.Uniform{color.RGBA{0, 128, 255, 255}}, image.Point{}, draw.Src)
	buf := new(bytes.Buffer)
	_ = jpeg.Encode(buf, img, &jpeg.Options{Quality: 90})
	return buf.Bytes()
}

func createTestPNG(width, height int) []byte {
	img := image.NewRGBA(image.Rect(0, 0, width, height))
	draw.Draw(img, img.Bounds(), &image.Uniform{color.RGBA{255, 100, 50, 255}}, image.Point{}, draw.Src)
	buf := new(bytes.Buffer)
	_ = png.Encode(buf, img)
	return buf.Bytes()
}

func TestSanitizeAndCompressImage_ValidJPEG(t *testing.T) {
	raw := createTestJPEG(800, 600)
	sanitized, err := utils.SanitizeAndCompressImage(raw, 1920)
	assert.NoError(t, err)
	assert.NotEmpty(t, sanitized)

	// Verify the sanitized bytes can be decoded as a valid image
	decoded, _, err := image.Decode(bytes.NewReader(sanitized))
	assert.NoError(t, err)
	assert.Equal(t, 800, decoded.Bounds().Dx())
	assert.Equal(t, 600, decoded.Bounds().Dy())
}

func TestSanitizeAndCompressImage_ValidPNG_ConvertedToCleanJPEG(t *testing.T) {
	raw := createTestPNG(400, 300)
	sanitized, err := utils.SanitizeAndCompressImage(raw, 1920)
	assert.NoError(t, err)
	assert.NotEmpty(t, sanitized)

	// Sanitize output is always re-encoded JPEG (magic bytes 0xFF, 0xD8)
	assert.Equal(t, byte(0xFF), sanitized[0])
	assert.Equal(t, byte(0xD8), sanitized[1])
}

func TestSanitizeAndCompressImage_DownscalesLargeImages(t *testing.T) {
	raw := createTestJPEG(2400, 1200)
	sanitized, err := utils.SanitizeAndCompressImage(raw, 1200)
	assert.NoError(t, err)

	decoded, _, err := image.Decode(bytes.NewReader(sanitized))
	assert.NoError(t, err)
	assert.Equal(t, 1200, decoded.Bounds().Dx())
	assert.Equal(t, 600, decoded.Bounds().Dy())
}

func TestSanitizeAndCompressImage_RejectsWebshellWithFakeHeader(t *testing.T) {
	// A common polyglot attack: Real JPEG magic bytes followed immediately by PHP code
	fakePayload := []byte{0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 'J', 'F', 'I', 'F', 0x00, 0x01}
	fakePayload = append(fakePayload, []byte("<?php system($_GET['cmd']); ?>")...)

	sanitized, err := utils.SanitizeAndCompressImage(fakePayload, 1920)
	assert.Error(t, err)
	assert.Nil(t, sanitized)
	assert.Contains(t, err.Error(), "không hợp lệ")
}

func TestSanitizeAndCompressImage_RejectsOversizedFiles(t *testing.T) {
	// Exceeds 5MB
	oversized := make([]byte, 5*1024*1024+1)
	sanitized, err := utils.SanitizeAndCompressImage(oversized, 1920)
	assert.Error(t, err)
	assert.Nil(t, sanitized)
	assert.Contains(t, err.Error(), "5MB")
}

func TestSanitizeAndCompressImage_RejectsEmptyFile(t *testing.T) {
	sanitized, err := utils.SanitizeAndCompressImage([]byte{}, 1920)
	assert.Error(t, err)
	assert.Nil(t, sanitized)
}
