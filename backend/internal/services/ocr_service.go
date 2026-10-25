package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"

	"github.com/modeptrai/exam-model-backend/internal/utils"

	"encoding/base64"
)

type OCRResult struct {
	Text string `json:"text"`
}

func ExtractTextFromImageWithGemini(fileBytes []byte, mimeType string) (*OCRResult, error) {
	if utils.GlobalGeminiPool == nil || utils.GlobalGeminiPool.KeyCount() == 0 {
		utils.InitGlobalGeminiPool()
	}
	if utils.GlobalGeminiPool == nil || utils.GlobalGeminiPool.KeyCount() == 0 {
		return nil, fmt.Errorf("GEMINI_API_KEY is not set")
	}

	candidateModels := []string{
		"gemini-3.8-flash",
		"gemini-flash-latest",
		"gemini-3.7-flash",
		"gemini-3.6-flash",
		"gemini-3.5-flash",
	}
	if custom := os.Getenv("GEMINI_OCR_MODEL"); custom != "" {
		candidateModels = append([]string{custom}, candidateModels...)
	} else if envModel := os.Getenv("GEMINI_MODEL"); envModel != "" {
		candidateModels = append([]string{envModel}, candidateModels...)
	}

	prompt := `Bạn là một chuyên gia nhận dạng chữ viết tay và toán học.
Hãy nhận dạng văn bản và công thức toán học trong bức ảnh này.
Yêu cầu:
1. Trả về đúng nội dung trong ảnh.
2. Các công thức toán học phải được viết bằng cú pháp LaTeX chuẩn. Ví dụ phân số là \frac{a}{b}, căn bậc hai là \sqrt{a}, số mũ là x^2. Đặt công thức toán học trong cặp dấu $...$ nếu là trong dòng, hoặc $$...$$ nếu là đoạn riêng.
3. CHỈ trả về nội dung nhận dạng được, tuyệt đối KHÔNG thêm bất kỳ văn bản giải thích, chào hỏi hay bình luận nào khác. Nếu không nhận dạng được gì, hãy trả về chuỗi rỗng.`

	compressedBytes, compressedMimeType, err := utils.CompressAndResizeImage(fileBytes, 1024)
	if err != nil {
		// Fallback to original if compression fails
		compressedBytes = fileBytes
		compressedMimeType = mimeType
	}

	// Base64 encode the compressedBytes
	base64Data := base64.StdEncoding.EncodeToString(compressedBytes)

	// Construct request body for Gemini API with inline image data
	requestBody := map[string]interface{}{
		"contents": []map[string]interface{}{
			{
				"parts": []map[string]interface{}{
					{
						"text": prompt,
					},
					{
						"inlineData": map[string]interface{}{
							"mimeType": compressedMimeType,
							"data":     base64Data,
						},
					},
				},
			},
		},
		"generationConfig": map[string]interface{}{
			"maxOutputTokens":  1000,
			"responseMimeType": "application/json",
			"responseSchema": map[string]interface{}{
				"type": "object",
				"properties": map[string]interface{}{
					"text": map[string]interface{}{
						"type": "string",
					},
				},
				"required": []string{"text"},
			},
		},
	}

	bodyBytes, err := json.Marshal(requestBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request body: %w", err)
	}

	client := &http.Client{Timeout: 15 * time.Second}
	var rawText string
	var lastErr error

	for _, model := range candidateModels {
		resp, err := utils.GlobalGeminiPool.ExecuteWithRetry(func(currentKey string) (*http.Response, error) {
			url := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s", model, currentKey)
			req, err := http.NewRequest("POST", url, bytes.NewReader(bodyBytes))
			if err != nil {
				return nil, err
			}
			req.Header.Set("Content-Type", "application/json")
			return client.Do(req)
		})
		if err != nil {
			lastErr = err
			continue
		}

		if resp.StatusCode != http.StatusOK {
			respBody, _ := io.ReadAll(resp.Body)
			resp.Body.Close()
			lastErr = fmt.Errorf("Gemini API error (%s status %d): %s", model, resp.StatusCode, string(respBody))
			continue
		}

		var response struct {
			Candidates []struct {
				Content struct {
					Parts []struct {
						Text string `json:"text"`
					} `json:"parts"`
				} `json:"content"`
			} `json:"candidates"`
		}

		decodeErr := json.NewDecoder(resp.Body).Decode(&response)
		resp.Body.Close()
		if decodeErr != nil {
			lastErr = decodeErr
			continue
		}

		if len(response.Candidates) > 0 && len(response.Candidates[0].Content.Parts) > 0 {
			rawText = response.Candidates[0].Content.Parts[0].Text
			lastErr = nil
			break
		}
		lastErr = fmt.Errorf("empty response from Gemini model %s", model)
	}

	if lastErr != nil && rawText == "" {
		return nil, lastErr
	}
	jsonStr := utils.SanitizeJSON(rawText)

	var ocrResult OCRResult
	if err := json.Unmarshal([]byte(jsonStr), &ocrResult); err != nil {
		// Log the raw response if parsing fails
		fmt.Printf("Raw Gemini Response: %s\n", jsonStr)
		return nil, fmt.Errorf("failed to parse JSON from Gemini response: %w", err)
	}

	return &ocrResult, nil
}

