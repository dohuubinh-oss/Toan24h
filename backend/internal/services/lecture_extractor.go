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
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/modeptrai/exam-model-backend/internal/utils"
)

type LectureDiagramInfo struct {
	ImageIndex  int       `json:"image_index"`
	Box2D       []float64 `json:"box_2d"` // [ymin, xmin, ymax, xmax]
	Placeholder string    `json:"placeholder"`
}

type ExtractedMathTypeBlock struct {
	MathType string               `json:"mathType"`
	Methods  []json.RawMessage    `json:"methods"`
	Diagrams []LectureDiagramInfo `json:"diagrams,omitempty"`
}

// ParseAndProcessExtractedLecture processes raw JSON from Gemini and crops any diagrams into tempDir
func ParseAndProcessExtractedLecture(rawJson string, sourceImages []image.Image, tempDir string) (string, error) {
	cleanJson := strings.TrimSpace(rawJson)
	cleanJson = strings.TrimPrefix(cleanJson, "```json")
	cleanJson = strings.TrimPrefix(cleanJson, "```")
	cleanJson = strings.TrimSuffix(cleanJson, "```")
	cleanJson = strings.TrimSpace(cleanJson)

	if tempDir == "" {
		tempDir = "./uploads/temp"
	}

	// Parse blocks to find diagrams
	var blocks []map[string]interface{}
	if err := json.Unmarshal([]byte(cleanJson), &blocks); err != nil {
		return "", fmt.Errorf("failed to parse JSON from Gemini response: %w", err)
	}

	processedJson := cleanJson

	for _, block := range blocks {
		if rawDiagrams, ok := block["diagrams"]; ok && rawDiagrams != nil {
			diagramsBytes, err := json.Marshal(rawDiagrams)
			if err == nil {
				var diagrams []LectureDiagramInfo
				if err := json.Unmarshal(diagramsBytes, &diagrams); err == nil {
					for _, diag := range diagrams {
						if diag.Placeholder == "" || len(diag.Box2D) < 4 {
							continue
						}

						if diag.ImageIndex >= 0 && diag.ImageIndex < len(sourceImages) && sourceImages[diag.ImageIndex] != nil {
							srcImg := sourceImages[diag.ImageIndex]
							croppedUrl, err := utils.CropDiagram(srcImg, diag.Box2D, tempDir)
							if err == nil && croppedUrl != "" {
								imgTag := fmt.Sprintf(`<img src=\"%s\" alt=\"Hình vẽ\" class=\"max-w-md mx-auto my-3 rounded-xl border border-slate-200\" />`, croppedUrl)
								processedJson = strings.ReplaceAll(processedJson, diag.Placeholder, imgTag)
							}
						}
					}
				}
			}
		}
	}

	// Verify valid JSON after replacement
	var recheck interface{}
	if err := json.Unmarshal([]byte(processedJson), &recheck); err != nil {
		// If replacement escaped incorrectly, fallback to cleanJson
		return cleanJson, nil
	}

	// Pretty format the JSON without escaping HTML (< to \u003c) for display in JsonInputCard
	buf := &bytes.Buffer{}
	encoder := json.NewEncoder(buf)
	encoder.SetEscapeHTML(false)
	encoder.SetIndent("", "  ")
	if err := encoder.Encode(recheck); err == nil {
		return strings.TrimSpace(buf.String()), nil
	}

	return processedJson, nil
}

// ExtractLectureFromImages calls Gemini Vision to extract math lecture types, methods and step-by-step examples
func ExtractLectureFromImages(files [][]byte, mimeTypes []string) (string, error) {
	apiKey := os.Getenv("GEMINI_API_KEY")
	if apiKey == "" {
		return "", fmt.Errorf("GEMINI_API_KEY is not configured")
	}

	model := os.Getenv("GEMINI_MODEL")
	if model == "" {
		model = "gemini-3.8-flash"
	}

	url := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s", model, apiKey)

	prompt := `Bạn là chuyên gia sư phạm và số hóa bài giảng Toán học Việt Nam.
Hãy đọc các trang ảnh tài liệu bài giảng/sách tham khảo đính kèm (theo thứ tự từ trang đầu đến trang cuối) và bóc tách TOÀN BỘ các Dạng toán, Phương pháp giải và Bài tập ví dụ mẫu thành định dạng JSON chuẩn.

Yêu cầu nghiêm ngặt:
1. Tất cả công thức toán học phải được định dạng bằng cú pháp LaTeX chuẩn: trong dòng dùng $...$, hiển thị riêng dùng $$...$$.
2. Với Bảng biến thiên, Bảng xét dấu hoặc Bảng số liệu: HÃY chuyển đổi trực tiếp thành bảng HTML (thẻ <table>, <tr>, <td>) hoặc bảng Markdown, KHÔNG cắt thành ảnh.
3. Nếu Bài tập ví dụ mẫu trong tài liệu CHƯA CÓ LỜI GIẢI hoặc lời giải vắn tắt: Bạn hãy TỰ ĐỘNG GIẢI CHI TIẾT TỪNG BƯỚC một cách sư phạm vào mảng "steps" (ví dụ: Bước 1, Bước 2...), có "formula" (nếu có), diễn giải "content" và đưa ra "conclusion" kết luận rõ ràng.
4. Với Hình vẽ hình học và Đồ thị hàm số trên hệ trục Oxy:
   - Điền một mã định danh vào vị trí tương ứng trong đề bài hoặc lời giải, ví dụ: [DIAGRAM_0_1] (trong đó 0 là chỉ số trang ảnh 0-indexed, 1 là thứ tự hình).
   - Khai báo thông tin vào mảng "diagrams" với tọa độ chuẩn hóa box_2d [ymin, xmin, ymax, xmax] (thang đo 0-1000).
5. Định dạng JSON bắt buộc phải là một mảng [] các Dạng toán theo cấu trúc:
[
  {
    "mathType": "Dạng 1. Tên dạng toán",
    "methods": [
      {
        "methodName": "Phương pháp giải",
        "solution": "Nội dung phương pháp giải lý thuyết...",
        "problems": [
          {
            "problem": "Nội dung ví dụ mẫu 1...",
            "steps": [
              {
                "step": 1,
                "title": "Bước 1",
                "content": "Nội dung diễn giải bước 1...",
                "formula": "x = 1"
              }
            ],
            "conclusion": "Kết luận...",
            "tips": "Gợi ý / mẹo (nếu có)"
          }
        ]
      }
    ],
    "diagrams": [
      {
        "image_index": 0,
        "box_2d": [100, 200, 500, 600],
        "placeholder": "[DIAGRAM_0_1]"
      }
    ]
  }
]
6. CHỈ trả về duy nhất chuỗi JSON hợp lệ, tuyệt đối KHÔNG kèm markdown fences (như ` + "```" + `json) hay bất kỳ văn bản giải thích nào ngoài JSON.`

	parts := []map[string]interface{}{
		{"text": prompt},
	}

	var sourceImages []image.Image

	for i, fileBytes := range files {
		mime := "image/jpeg"
		if i < len(mimeTypes) && mimeTypes[i] != "" {
			mime = mimeTypes[i]
		}

		b64 := base64.StdEncoding.EncodeToString(fileBytes)
		parts = append(parts, map[string]interface{}{
			"inlineData": map[string]string{
				"mimeType": mime,
				"data":     b64,
			},
		})

		img, _, err := image.Decode(bytes.NewReader(fileBytes))
		if err == nil {
			sourceImages = append(sourceImages, img)
		} else {
			sourceImages = append(sourceImages, nil)
		}
	}

	requestBody := map[string]interface{}{
		"contents": []map[string]interface{}{
			{"parts": parts},
		},
		"generationConfig": map[string]interface{}{
			"temperature":     0.1,
			"responseMimeType": "application/json",
		},
	}

	jsonBytes, err := json.Marshal(requestBody)
	if err != nil {
		return "", fmt.Errorf("failed to marshal Gemini request: %w", err)
	}

	client := &http.Client{Timeout: 90 * time.Second}
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonBytes))
	if err != nil {
		return "", fmt.Errorf("failed to create Gemini HTTP request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("gemini API call failed: %w", err)
	}
	defer resp.Body.Close()

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read Gemini API response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("gemini API error (status %d): %s", resp.StatusCode, string(bodyBytes))
	}

	var geminiResp struct {
		Candidates []struct {
			Content struct {
				Parts []struct {
					Text string `json:"text"`
				} `json:"parts"`
			} `json:"content"`
		} `json:"candidates"`
	}

	if err := json.Unmarshal(bodyBytes, &geminiResp); err != nil {
		return "", fmt.Errorf("failed to unmarshal Gemini response: %w", err)
	}

	if len(geminiResp.Candidates) == 0 || len(geminiResp.Candidates[0].Content.Parts) == 0 {
		return "", fmt.Errorf("gemini returned empty response")
	}

	rawText := geminiResp.Candidates[0].Content.Parts[0].Text

	// Crop diagrams and inject into output
	return ParseAndProcessExtractedLecture(rawText, sourceImages, "./uploads/temp")
}
