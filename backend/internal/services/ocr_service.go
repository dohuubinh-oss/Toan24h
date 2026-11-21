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
		"gemini-3.5-flash",
		"gemini-3.5-flash-lite",
		"gemini-3.6-flash",
		"gemini-3-flash-preview",
		"gemini-3.1-flash-lite",
		"gemini-3.8-flash",
	}
	if custom := os.Getenv("GEMINI_OCR_MODEL"); custom != "" {
		candidateModels = append([]string{custom}, candidateModels...)
	} else if envModel := os.Getenv("GEMINI_MODEL"); envModel != "" {
		candidateModels = append([]string{envModel}, candidateModels...)
	}

	prompt := `Bạn là chuyên gia nhận dạng chữ viết tay và số hóa bài giải Toán học THCS (Lớp 6, 7, 8, 9) tại Việt Nam.
Nhiệm vụ của bạn là bóc tách toàn bộ văn bản và công thức toán học từ ảnh chụp bài làm của học sinh.

YÊU CẦU BÓC TÁCH NGHIÊM NGẶT:
1. TRẢ VỀ NỘI DUNG CHÍNH XÁC & BẢO TOÀN CẤU TRÚC:
   - Giữ nguyên cấu trúc xuống dòng (\n) của từng bước giải bài toán. Không gom thành một khối văn bản liền nhau.
   - BỎ QUA các phần chữ viết bị gạch xoá, bôi đen, nháp bên lề mép giấy, hoặc hình ảnh ngón tay/thước kẻ chụp dính vào ảnh.
   - CHỈ lấy phần bài làm chính thức mà học sinh muốn nộp.

2. CÔNG THỨC TOÁN HỌC CHUẨN LATEX (TƯƠNG THÍCH KATEX 100%):
   - Mọi biểu thức, số liệu, biến số, phương trình toán học BẮT BUỘC đặt trong cặp dấu $...$ (nếu trong dòng) hoặc $$...$$ (nếu là một dòng biến đổi độc lập).
   - Phân số dùng \frac{a}{b}, căn thức dùng \sqrt{a}, số mũ dùng x^{2}.
   - Ký hiệu góc hình học: BẮT BUỘC dùng \widehat{ABC} hoặc \hat{A}. TUYỆT ĐỐI KHÔNG dùng \angle hoặc ký tự ∠.
   - Ký hiệu quan hệ hình học: \Delta ABC (tam giác), \parallel (song song), \perp (vuông góc), \sim (đồng dạng).
   - Hệ phương trình: Dùng môi trường \begin{cases} ... \end{cases}.
   - Phép nhân đại số: Dùng \cdot (ví dụ $2 \cdot 3$), không dùng chữ cái x làm dấu nhân.
   - Số thập phân tiếng Việt: Viết ở dạng $2{,}5$ thay vì $2,5$ để hiển thị khoảng cách đẹp mắt.

3. NGUYÊN TẮC ĐẦU RA (OUTPUT):
   - CHỈ trả về đúng nội dung bài làm đã số hóa.
   - TUYỆT ĐỐI KHÔNG tự ý giải thêm, không sửa lỗi sai của học sinh, không thêm nhận xét, chào hỏi hay giải thích ("Dưới đây là nội dung...", "Bài làm gồm có...").
   - Nếu ảnh bị mờ, trắng tinh hoặc không chứa chữ viết bài làm, hãy trả về chuỗi rỗng "".`

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

	client := &http.Client{Timeout: 60 * time.Second}
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

