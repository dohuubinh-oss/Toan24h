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
	cleanJson := utils.SanitizeJSON(rawJson)

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

	prompt := `Bạn là chuyên gia sư phạm và số hóa bài giảng Toán học Việt Nam.
Hãy đọc các trang ảnh tài liệu bài giảng/sách tham khảo đính kèm (theo thứ tự từ trang đầu đến trang cuối) và bóc tách TOÀN BỘ các Dạng toán, Phương pháp giải và Bài tập ví dụ mẫu thành định dạng JSON chuẩn.

Yêu cầu nghiêm ngặt về nội dung và định dạng văn bản:
1. Tất cả công thức toán học phải được định dạng bằng cú pháp LaTeX chuẩn: trong dòng dùng $...$, công thức quan trọng hiển thị riêng dòng dùng $$\n...\n$$.
2. Với Bảng biến thiên, Bảng xét dấu hoặc Bảng số liệu: HÃY chuyển đổi trực tiếp thành bảng HTML (thẻ <table>, <tr>, <td>) hoặc bảng Markdown, KHÔNG cắt thành ảnh.
3. Quy tắc trình bày và ngắt dòng trong trường "solution" (Phương pháp giải):
   - TUYỆT ĐỐI KHÔNG viết thành một khối văn bản dính liền nhau.
   - Mỗi định lý, quy tắc hoặc bước phương pháp phải được ngắt đoạn bằng 2 dấu xuống dòng (\n\n).
   - Sử dụng dấu gạch đầu dòng ("- ") hoặc đánh số ("1. ", "2. ") cho từng ý rõ ràng.
   - Các công thức toán cốt lõi phải được đặt trên một dòng riêng biệt.
4. Quy tắc trình bày trong trường "problem" (Đề bài ví dụ mẫu):
   - Tách biệt câu dẫn đề bài và các ý con (a, b, c...): mỗi ý con bắt buộc phải xuống dòng riêng biệt (\n hoặc \n\n).
5. Quy tắc trình bày trong mảng "steps" (Các bước giải chi tiết của ví dụ mẫu):
   - Nếu Bài tập ví dụ mẫu trong tài liệu CHƯA CÓ LỜI GIẢI hoặc lời giải vắn tắt: Bạn hãy TỰ ĐỘNG GIẢI CHI TIẾT TỪNG BƯỚC một cách sư phạm.
   - "title": Tiêu đề ngắn gọn của bước (ví dụ: "Bước 1: Tìm tập xác định", "Bước 2: Giải phương trình").
   - "content": Diễn giải sư phạm, súc tích. Nếu có nhiều ý nhỏ trong 1 bước, ngắt dòng (\n) hoặc dùng gạch đầu dòng ("- ").
   - "formula": Chứa phép biến đổi hoặc công thức toán trọng tâm của bước (dạng LaTeX).
   - "conclusion": Kết luận rõ ràng đáp số / kết quả bài toán.
   - "tips": Gợi ý, lưu ý hoặc mẹo giải nhanh (nếu có).
6. Với Hình vẽ hình học và Đồ thị hàm số trên hệ trục Oxy:
   - Điền một mã định danh vào vị trí tương ứng trong đề bài hoặc lời giải, ví dụ: [DIAGRAM_0_1] (trong đó 0 là chỉ số trang ảnh 0-indexed, 1 là thứ tự hình).
   - Khai báo thông tin vào mảng "diagrams" với tọa độ chuẩn hóa box_2d [ymin, xmin, ymax, xmax] (thang đo 0-1000).
7. Cấu trúc JSON bắt buộc phải là một mảng [] các Dạng toán theo cấu trúc:
[
  {
    "mathType": "Dạng 1. Tên dạng toán",
    "methods": [
      {
        "methodName": "Phương pháp giải",
        "solution": "- Bước 1: Điều kiện xác định...\n\n- Bước 2: Biến đổi phương trình:\n$$\nx^2 - 4x + 3 = 0\n$$\n\n- Bước 3: Kết luận nghiệm.",
        "problems": [
          {
            "problem": "Giải các phương trình sau:\na) $x^2 - 4 = 0$\nb) $2x + 1 = 5$",
            "steps": [
              {
                "step": 1,
                "title": "Bước 1: Tìm điều kiện",
                "content": "Phương trình xác định với mọi $x \\in \\mathbb{R}$.",
                "formula": "x \\in \\mathbb{R}"
              },
              {
                "step": 2,
                "title": "Bước 2: Phân tích thành nhân tử",
                "content": "Áp dụng hằng đẳng thức hiệu hai bình phương:\n- Ta có: $x^2 - 2^2 = (x - 2)(x + 2) = 0$",
                "formula": "(x - 2)(x + 2) = 0"
              }
            ],
            "conclusion": "Vậy tập nghiệm của phương trình là $S = \\{-2; 2\\}$.",
            "tips": "Nhớ kiểm tra lại điều kiện nghiệm trước khi kết luận."
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
8. CHỈ trả về duy nhất chuỗi JSON hợp lệ, tuyệt đối KHÔNG kèm markdown fences (như ` + "```" + `json) hay bất kỳ văn bản giải thích nào ngoài JSON.`

	parts := []map[string]interface{}{
		{"text": prompt},
	}

	var sourceImages []image.Image

	for i, fileBytes := range files {
		// Keep original high-resolution image for accurate diagram cropping
		img, _, err := image.Decode(bytes.NewReader(fileBytes))
		if err == nil {
			sourceImages = append(sourceImages, img)
		} else {
			sourceImages = append(sourceImages, nil)
		}

		// Compress and scale down to max 1600px for AI vision to avoid network timeout and excessive payload
		compBytes, compMime, err := utils.CompressAndResizeImage(fileBytes, 1600)
		if err != nil {
			compBytes = fileBytes
			compMime = "image/jpeg"
			if i < len(mimeTypes) && mimeTypes[i] != "" {
				compMime = mimeTypes[i]
			}
		}

		b64 := base64.StdEncoding.EncodeToString(compBytes)
		parts = append(parts, map[string]interface{}{
			"inlineData": map[string]string{
				"mimeType": compMime,
				"data":     b64,
			},
		})
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
	var rawText string
	var lastErr error

	for _, currentModel := range candidateModels {
		apiUrl := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s", currentModel, apiKey)
		req, err := http.NewRequest("POST", apiUrl, bytes.NewBuffer(jsonBytes))
		if err != nil {
			lastErr = fmt.Errorf("failed to create Gemini request for %s: %w", currentModel, err)
			continue
		}
		req.Header.Set("Content-Type", "application/json")

		resp, err := client.Do(req)
		if err != nil {
			log.Printf("[AI Lecture Extractor] Model %s failed: %v. Trying next model...", currentModel, err)
			lastErr = fmt.Errorf("gemini API call failed for %s: %w", currentModel, err)
			continue
		}

		bodyBytes, err := io.ReadAll(resp.Body)
		resp.Body.Close()
		if err != nil {
			log.Printf("[AI Lecture Extractor] Failed to read response from %s: %v. Trying next model...", currentModel, err)
			lastErr = fmt.Errorf("failed to read response from %s: %w", currentModel, err)
			continue
		}

		if resp.StatusCode != http.StatusOK {
			log.Printf("[AI Lecture Extractor] Model %s returned status %d (%s). Trying next model...", currentModel, resp.StatusCode, string(bodyBytes))
			lastErr = fmt.Errorf("gemini API error for %s (status %d): %s", currentModel, resp.StatusCode, string(bodyBytes))
			continue
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
			log.Printf("[AI Lecture Extractor] Failed to unmarshal response from %s: %v. Trying next model...", currentModel, err)
			lastErr = fmt.Errorf("failed to unmarshal response from %s: %w", currentModel, err)
			continue
		}

		if len(geminiResp.Candidates) == 0 || len(geminiResp.Candidates[0].Content.Parts) == 0 {
			log.Printf("[AI Lecture Extractor] Empty candidates from %s. Trying next model...", currentModel)
			lastErr = fmt.Errorf("empty response from %s", currentModel)
			continue
		}

		rawText = geminiResp.Candidates[0].Content.Parts[0].Text
		log.Printf("[AI Lecture Extractor] Successfully extracted lecture using model: %s", currentModel)
		lastErr = nil
		break
	}

	if rawText == "" && lastErr != nil {
		return "", lastErr
	}

	// Crop diagrams and inject into output
	return ParseAndProcessExtractedLecture(rawText, sourceImages, "./uploads/temp")
}
