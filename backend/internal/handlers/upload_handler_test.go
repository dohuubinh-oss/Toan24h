package handlers_test

import (
	"bytes"
	"image"
	"image/color"
	"image/draw"
	"image/jpeg"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/modeptrai/exam-model-backend/internal/routes"
	"github.com/modeptrai/exam-model-backend/internal/utils"
	"github.com/stretchr/testify/assert"
)

func generateSyntheticJPEG() []byte {
	img := image.NewRGBA(image.Rect(0, 0, 100, 100))
	draw.Draw(img, img.Bounds(), &image.Uniform{color.RGBA{255, 0, 0, 255}}, image.Point{}, draw.Src)
	buf := new(bytes.Buffer)
	_ = jpeg.Encode(buf, img, &jpeg.Options{Quality: 85})
	return buf.Bytes()
}

func TestUploadTempImage(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := routes.SetupRouter()

	os.MkdirAll("./uploads/temp", 0755)

	userToken, _ := utils.GenerateAccessToken(uuid.New(), "student", "12")

	// 1. Positive test: Valid, decodable JPEG image
	body := new(bytes.Buffer)
	writer := multipart.NewWriter(body)
	part, err := writer.CreateFormFile("file", "test.jpg")
	assert.NoError(t, err)
	part.Write(generateSyntheticJPEG())
	writer.Close()

	req, _ := http.NewRequest("POST", "/api/v1/uploads/temp", body)
	req.Header.Set("Content-Type", writer.FormDataContentType())
	req.Header.Set("Authorization", "Bearer "+userToken)

	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusCreated, w.Code)
	assert.Contains(t, w.Body.String(), "/uploads/temp/")

	// 2. Negative test: Plain text / non-image with .jpg extension
	badBody := new(bytes.Buffer)
	badWriter := multipart.NewWriter(badBody)
	badPart, err := badWriter.CreateFormFile("file", "fake.jpg")
	assert.NoError(t, err)
	badPart.Write([]byte("not an image at all"))
	badWriter.Close()

	badReq, _ := http.NewRequest("POST", "/api/v1/uploads/temp", badBody)
	badReq.Header.Set("Content-Type", badWriter.FormDataContentType())
	badReq.Header.Set("Authorization", "Bearer "+userToken)

	badW := httptest.NewRecorder()
	r.ServeHTTP(badW, badReq)
	assert.Equal(t, http.StatusBadRequest, badW.Code)

	// 3. Security test: Polyglot webshell disguised as JPEG
	webshellBody := new(bytes.Buffer)
	webshellWriter := multipart.NewWriter(webshellBody)
	wsPart, err := webshellWriter.CreateFormFile("file", "backdoor.jpg")
	assert.NoError(t, err)
	// JPEG magic bytes + PHP backdoor
	wsPart.Write([]byte{0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 'J', 'F', 'I', 'F', 0x00, 0x01})
	wsPart.Write([]byte("<?php system($_GET['cmd']); ?>"))
	webshellWriter.Close()

	wsReq, _ := http.NewRequest("POST", "/api/v1/uploads/temp", webshellBody)
	wsReq.Header.Set("Content-Type", webshellWriter.FormDataContentType())
	wsReq.Header.Set("Authorization", "Bearer "+userToken)

	wsW := httptest.NewRecorder()
	r.ServeHTTP(wsW, wsReq)
	assert.Equal(t, http.StatusBadRequest, wsW.Code)
}
