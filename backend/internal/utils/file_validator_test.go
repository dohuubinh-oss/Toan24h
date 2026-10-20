package utils

import (
	"bytes"
	"mime/multipart"
	"net/textproto"
	"testing"

	"github.com/stretchr/testify/assert"
)

func createMockFileHeader(filename string, content []byte) *multipart.FileHeader {
	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)
	h := make(textproto.MIMEHeader)
	h.Set("Content-Disposition", `form-data; name="file"; filename="`+filename+`"`)
	h.Set("Content-Type", "image/png")
	part, _ := writer.CreatePart(h)
	_, _ = part.Write(content)
	_ = writer.Close()

	reader := multipart.NewReader(body, writer.Boundary())
	form, _ := reader.ReadForm(int64(body.Len()))
	if len(form.File["file"]) > 0 {
		return form.File["file"][0]
	}
	return nil
}

func TestValidateImageBytes(t *testing.T) {
	opts := DefaultImageValidationOptions

	t.Run("Valid PNG bytes", func(t *testing.T) {
		pngBytes := []byte{0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52}
		err := ValidateImageBytes(pngBytes, opts)
		assert.NoError(t, err)
	})

	t.Run("Valid JPEG bytes", func(t *testing.T) {
		jpegBytes := []byte{0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01}
		err := ValidateImageBytes(jpegBytes, opts)
		assert.NoError(t, err)
	})

	t.Run("Fake image with PHP script", func(t *testing.T) {
		maliciousBytes := []byte("<?php echo 'hacked'; ?>")
		err := ValidateImageBytes(maliciousBytes, opts)
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "invalid image format")
	})

	t.Run("SVG XML script disguised as image", func(t *testing.T) {
		svgBytes := []byte("<svg xmlns=\"http://www.w3.org/2000/svg\"><script>alert(1)</script></svg>")
		err := ValidateImageBytes(svgBytes, opts)
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "invalid image format")
	})

	t.Run("Empty bytes", func(t *testing.T) {
		err := ValidateImageBytes([]byte{}, opts)
		assert.Error(t, err)
	})

	t.Run("Oversized bytes", func(t *testing.T) {
		customOpts := ImageValidationOptions{
			MaxSizeBytes: 10,
			AllowedMimes: []string{"image/png"},
		}
		pngBytes := []byte{0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52}
		err := ValidateImageBytes(pngBytes, customOpts)
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "file size exceeds limit")
	})
}

func TestValidateImageHeader(t *testing.T) {
	opts := DefaultImageValidationOptions

	t.Run("Valid PNG FileHeader", func(t *testing.T) {
		pngBytes := []byte{0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52}
		fh := createMockFileHeader("photo.png", pngBytes)
		assert.NotNil(t, fh)
		err := ValidateImageHeader(fh, opts)
		assert.NoError(t, err)
	})

	t.Run("Invalid file extension", func(t *testing.T) {
		pngBytes := []byte{0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A}
		fh := createMockFileHeader("script.sh", pngBytes)
		assert.NotNil(t, fh)
		err := ValidateImageHeader(fh, opts)
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "invalid file format")
	})

	t.Run("Mismatched extension and content", func(t *testing.T) {
		fakeBytes := []byte("plain text disguised as image")
		fh := createMockFileHeader("avatar.png", fakeBytes)
		assert.NotNil(t, fh)
		err := ValidateImageHeader(fh, opts)
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "invalid image format")
	})
}
