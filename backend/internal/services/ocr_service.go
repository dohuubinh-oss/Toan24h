package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"encoding/base64"
)

type OCRResult struct {
	Text string `json:"text"`
}

func ExtractTextFromImageWithGemini(fileBytes []byte, mimeType string) (*OCRResult, error) {
	apiKey := os.Getenv("GEMINI_API_KEY")
	if apiKey == "" {
		return nil, fmt.Errorf("GEMINI_API_KEY is not set")
	}

	url := "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + apiKey

	prompt := `Bạn là một chuyên gia nhận dạng chữ viết tay và toán học.
Hãy nhận dạng văn bản và công thức toán học trong bức ảnh này.
Yêu cầu:
1. Trả về đúng nội dung trong ảnh.
2. Các công thức toán học phải được viết bằng cú pháp LaTeX chuẩn. Ví dụ phân số là \frac{a}{b}, căn bậc hai là \sqrt{a}, số mũ là x^2. Đặt công thức toán học trong cặp dấu $...$ nếu là trong dòng, hoặc $$...$$ nếu là đoạn riêng.
3. CHỈ trả về nội dung nhận dạng được, tuyệt đối KHÔNG thêm bất kỳ văn bản giải thích, chào hỏi hay bình luận nào khác. Nếu không nhận dạng được gì, hãy trả về chuỗi rỗng.`

	// Base64 encode the fileBytes
	base64Data := base64.StdEncoding.EncodeToString(fileBytes)

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
							"mimeType": mimeType,
							"data":     base64Data,
						},
					},
				},
			},
		},
	}

	bodyBytes, err := json.Marshal(requestBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request body: %w", err)
	}

	req, err := http.NewRequest("POST", url, bytes.NewReader(bodyBytes))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to call Gemini API: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		respBody, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("Gemini API error: status %d, response: %s", resp.StatusCode, string(respBody))
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

	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		return nil, fmt.Errorf("failed to decode Gemini API response: %w", err)
	}

	if len(response.Candidates) > 0 && len(response.Candidates[0].Content.Parts) > 0 {
		return &OCRResult{
			Text: response.Candidates[0].Content.Parts[0].Text,
		}, nil
	}

	return nil, fmt.Errorf("failed to parse Gemini response: unexpected format")
}
