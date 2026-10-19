package services

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"image"
	_ "image/jpeg"
	_ "image/png"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/modeptrai/exam-model-backend/internal/utils"
)

type DiagramInfo struct {
	ImageIndex  int       `json:"image_index"`
	Box2D       []float64 `json:"box_2d"` // [ymin, xmin, ymax, xmax]
	Placeholder string    `json:"placeholder"`
}

type ExtractedQuestionItem struct {
	TypeQuestion    string   `json:"type_question"`
	Content         string   `json:"content"`
	Type            string   `json:"type"`
	Grade           int      `json:"grade,omitempty"`
	Topic           string   `json:"topic,omitempty"`
	DifficultyLevel string   `json:"difficulty_level,omitempty"`
	Options         []string `json:"options,omitempty"`
	CorrectAnswer   string   `json:"correct_answer,omitempty"`
	SolutionGuide   string   `json:"solution_guide,omitempty"`
}

type ExtractedQuestionBlock struct {
	SharedContent string                  `json:"shared_content,omitempty"`
	IsGroup       bool                    `json:"is_group"`
	Questions     []ExtractedQuestionItem `json:"questions"`
	Diagrams      []DiagramInfo           `json:"diagrams,omitempty"`
}

// ParseAndProcessExtractedBlocks processes raw JSON from Gemini and crops any diagrams
func ParseAndProcessExtractedBlocks(rawJson string, sourceImages []image.Image, tempDir string) ([]ExtractedQuestionBlock, error) {
	cleanJson := strings.TrimSpace(rawJson)
	cleanJson = strings.TrimPrefix(cleanJson, "```json")
	cleanJson = strings.TrimPrefix(cleanJson, "```")
	cleanJson = strings.TrimSuffix(cleanJson, "```")
	cleanJson = strings.TrimSpace(cleanJson)

	var blocks []ExtractedQuestionBlock
	if err := json.Unmarshal([]byte(cleanJson), &blocks); err != nil {
		return nil, fmt.Errorf("failed to parse JSON from Gemini response: %w", err)
	}

	if tempDir == "" {
		tempDir = "./uploads/temp"
	}

	for bIdx := range blocks {
		block := &blocks[bIdx]
		for _, diag := range block.Diagrams {
			if diag.Placeholder == "" || len(diag.Box2D) < 4 {
				continue
			}

			if diag.ImageIndex >= 0 && diag.ImageIndex < len(sourceImages) && sourceImages[diag.ImageIndex] != nil {
				srcImg := sourceImages[diag.ImageIndex]
				croppedUrl, err := utils.CropDiagram(srcImg, diag.Box2D, tempDir)
				if err == nil && croppedUrl != "" {
					imgTag := fmt.Sprintf(`<img src="%s" alt="Hình vẽ" class="max-w-md mx-auto my-3 rounded-xl border border-slate-200" />`, croppedUrl)

					block.SharedContent = strings.ReplaceAll(block.SharedContent, diag.Placeholder, imgTag)

					for qIdx := range block.Questions {
						q := &block.Questions[qIdx]
						q.Content = strings.ReplaceAll(q.Content, diag.Placeholder, imgTag)
						q.SolutionGuide = strings.ReplaceAll(q.SolutionGuide, diag.Placeholder, imgTag)
					}
				}
			}
		}
	}

	return blocks, nil
}

// ExtractQuestionsFromImages calls Gemini Vision to extract math questions across multiple exam images
func ExtractQuestionsFromImages(files [][]byte, mimeTypes []string) ([]ExtractedQuestionBlock, error) {
	apiKey := os.Getenv("GEMINI_API_KEY")
	if apiKey == "" {
		return nil, fmt.Errorf("GEMINI_API_KEY is not configured")
	}

	primaryModel := os.Getenv("GEMINI_MODEL")
	if primaryModel == "" {
		primaryModel = "gemini-3.5-flash-lite"
	}

	candidateModels := []string{primaryModel}
	for _, m := range []string{"gemini-3.5-flash-lite", "gemini-3.8-flash", "gemini-3.6-flash"} {
		found := false
		for _, exist := range candidateModels {
			if exist == m {
				found = true
				break
			}
		}
		if !found {
			candidateModels = append(candidateModels, m)
		}
	}

	prompt := `Bạn là chuyên gia biên tập và số hóa đề thi Toán học Việt Nam.
Hãy đọc các trang ảnh đề thi đính kèm (theo thứ tự từ trang đầu đến trang cuối) và bóc tách TOÀN BỘ các câu hỏi có trong tài liệu thành định dạng JSON chuẩn.

Yêu cầu nghiêm ngặt:
1. Tất cả công thức toán học phải được định dạng bằng cú pháp LaTeX chuẩn: trong dòng dùng $...$, hiển thị riêng dùng $$...$$.
2. Với Bảng biến thiên, Bảng xét dấu hoặc Bảng số liệu: HÃY chuyển đổi trực tiếp thành bảng HTML (thẻ <table>, <tr>, <td>) hoặc bảng Markdown rõ ràng, KHÔNG cắt thành ảnh.
3. Với Hình vẽ hình học (hình học phẳng, hình không gian) và Đồ thị hàm số trên hệ trục Oxy:
   - Điền một mã định danh vào vị trí tương ứng trong đề bài hoặc lời giải, ví dụ: [DIAGRAM_0_1] (trong đó 0 là chỉ số trang ảnh 0-indexed, 1 là thứ tự hình).
   - Khai báo thông tin vào mảng "diagrams" với tọa độ chuẩn hóa box_2d [ymin, xmin, ymax, xmax] (thang đo 0-1000).
4. Phân loại câu hỏi:
   - "type": "Trắc nghiệm" (có 4 lựa chọn trong "options": ["A. ...", "B. ...", "C. ...", "D. ..."]) hoặc "Tự luận" ("options": []).
   - Nếu là câu hỏi chùm (chung một đoạn dẫn đề bài cho nhiều câu con): đặt "is_group": true, "shared_content" là đoạn dẫn chung, các câu con nằm trong mảng "questions".
   - Nếu là câu đơn: "is_group": false, "shared_content": "", "questions" chứa 1 câu.
5. Cung cấp "correct_answer" và "solution_guide" (hướng dẫn giải chi tiết từng bước) cho từng câu hỏi.
6. CHỈ trả về duy nhất chuỗi JSON hợp lệ (mảng các block), tuyệt đối KHÔNG kèm lời chào hay giải thích nào khác ngoài JSON.`

	parts := []map[string]interface{}{
		{"text": prompt},
	}

	var decodedImages []image.Image

	for i, fileBytes := range files {
		mime := "image/jpeg"
		if i < len(mimeTypes) && mimeTypes[i] != "" {
			mime = mimeTypes[i]
		}

		// Decode original image in Go for subsequent cropping if diagrams exist
		img, _, err := image.Decode(bytes.NewReader(fileBytes))
		if err != nil {
			fmt.Printf("Warning: failed to decode image %d: %v\n", i, err)
			decodedImages = append(decodedImages, nil)
		} else {
			decodedImages = append(decodedImages, img)
		}

		// Compress and resize image to max 1600px for API vision payload
		compBytes, compMime, err := utils.CompressAndResizeImage(fileBytes, 1600)
		if err != nil {
			compBytes = fileBytes
			compMime = mime
		}

		b64 := base64.StdEncoding.EncodeToString(compBytes)
		parts = append(parts, map[string]interface{}{
			"inlineData": map[string]interface{}{
				"mimeType": compMime,
				"data":     b64,
			},
		})
	}

	requestBody := map[string]interface{}{
		"contents": []map[string]interface{}{
			{
				"parts": parts,
			},
		},
		"generationConfig": map[string]interface{}{
			"temperature":     0.2,
			"responseMimeType": "application/json",
		},
	}

	bodyBytes, err := json.Marshal(requestBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request body: %w", err)
	}

	client := &http.Client{Timeout: 90 * time.Second}
	var rawJSON string
	var lastErr error

	for _, currentModel := range candidateModels {
		apiUrl := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s", currentModel, apiKey)
		req, err := http.NewRequest("POST", apiUrl, bytes.NewReader(bodyBytes))
		if err != nil {
			lastErr = fmt.Errorf("failed to create request for %s: %w", currentModel, err)
			continue
		}
		req.Header.Set("Content-Type", "application/json")

		resp, err := client.Do(req)
		if err != nil {
			log.Printf("[AI Question Extractor] Model %s failed: %v. Trying next model...", currentModel, err)
			lastErr = fmt.Errorf("failed to call Gemini Vision API (%s): %w", currentModel, err)
			continue
		}

		respBody, err := io.ReadAll(resp.Body)
		resp.Body.Close()
		if err != nil {
			log.Printf("[AI Question Extractor] Failed to read response from %s: %v. Trying next model...", currentModel, err)
			lastErr = fmt.Errorf("failed to read response (%s): %w", currentModel, err)
			continue
		}

		if resp.StatusCode != http.StatusOK {
			log.Printf("[AI Question Extractor] Model %s returned status %d. Trying next model...", currentModel, resp.StatusCode)
			lastErr = fmt.Errorf("gemini API error (%s status %d): %s", currentModel, resp.StatusCode, string(respBody))
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

		if err := json.Unmarshal(respBody, &response); err != nil {
			log.Printf("[AI Question Extractor] Failed to decode response from %s: %v. Trying next model...", currentModel, err)
			lastErr = fmt.Errorf("failed to decode Gemini API response (%s): %w", currentModel, err)
			continue
		}

		if len(response.Candidates) > 0 && len(response.Candidates[0].Content.Parts) > 0 {
			rawJSON = response.Candidates[0].Content.Parts[0].Text
			log.Printf("[AI Question Extractor] Successfully extracted questions using model: %s", currentModel)
			lastErr = nil
			break
		}

		lastErr = fmt.Errorf("empty response from Gemini Vision (%s)", currentModel)
	}

	if rawJSON == "" && lastErr != nil {
		return nil, lastErr
	}

	return ParseAndProcessExtractedBlocks(rawJSON, decodedImages, "./uploads/temp")
}
