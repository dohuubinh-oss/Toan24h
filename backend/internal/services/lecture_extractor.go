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
	"strconv"
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

// ExtractLectureFromImages calls Gemini Vision to extract math lecture types, methods and step-by-step examples.
// If paraphrase is true, Gemini is instructed to change names, contexts, and numbers in example problems while preserving theory and methods.
func ExtractLectureFromImages(files [][]byte, mimeTypes []string, targetGradeStr string, paraphrase ...bool) (string, error) {
	if utils.GlobalGeminiPool == nil || utils.GlobalGeminiPool.KeyCount() == 0 {
		utils.InitGlobalGeminiPool()
	}
	if utils.GlobalGeminiPool == nil || utils.GlobalGeminiPool.KeyCount() == 0 {
		return "", fmt.Errorf("GEMINI_API_KEY is not configured")
	}

	primaryModel := os.Getenv("GEMINI_MODEL")
	if primaryModel == "" {
		primaryModel = "gemini-3.5-flash"
	}

	validModels := []string{
		"gemini-3.5-flash",
		"gemini-3.5-flash-lite",
		"gemini-3.6-flash",
		"gemini-3-flash-preview",
		"gemini-3.1-flash-lite",
		"gemini-3.8-flash",
	}

	candidateModels := []string{}
	if primaryModel != "" {
		candidateModels = append(candidateModels, primaryModel)
	}
	for _, m := range validModels {
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

	isParaphrase := false
	if len(paraphrase) > 0 && paraphrase[0] {
		isParaphrase = true
	}

	targetGradeInt := 0
	if targetGradeStr != "" {
		if g, err := strconv.Atoi(strings.TrimSpace(targetGradeStr)); err == nil {
			targetGradeInt = g
		}
	}

	gradeHint := ""
	if targetGradeInt >= 5 && targetGradeInt <= 12 {
		gradeHint = fmt.Sprintf("\nLƯU Ý KHỐI LỚP: Người dùng yêu cầu bóc tách bài giảng & phương pháp giải cho KHỐI LỚP %d. Bạn BẮT BUỘC biên soạn nội dung, thuật ngữ và ví dụ mẫu bám sát 100%% chuẩn chương trình GDPT 2018 của Lớp %d.\n", targetGradeInt, targetGradeInt)
	}

	paraphraseInstruction := ""
	if isParaphrase {
		paraphraseInstruction = `
================================================================================
CHÍNH SÁCH BẮT BUỘC: BẢO VỆ BẢN QUYỀN TUYỆT ĐỐI (100% ORIGINAL CONTENT)
================================================================================
Người dùng đã bật chế độ "Làm mới số liệu ví dụ & bối cảnh để tránh vi phạm bản quyền".
Bạn TUYỆT ĐỐI KHÔNG ĐƯỢC PHÉP sao chép nguyên văn đề bài, số liệu, bài tập mẫu từ sách giáo khoa (Bộ GD&ĐT), sách bài tập hay các tài liệu luyện thi có bản quyền. BẮT BUỘC tuân thủ 5 thiết luật sau:

1. BẢO TOÀN MỤC TIÊU NĂNG LỰC - TÁI CẤU TRÚC VĂN PHONG SƯ PHẠM 100% MỚI:
   - Giữ nguyên 100% bản chất định lý, công thức toán học và tên dạng toán ("mathType").
   - Viết lại toàn bộ câu từ giải thích phương pháp giải ("methods[].solution") bằng văn phong sư phạm mới, ngắn gọn, mạch lạc, trực quan.
   - Trình bày phương pháp theo từng bước tư duy: "Bước 1: ... \n\n Bước 2: ...". Mỗi bước cách nhau 2 dấu xuống dòng (\n\n).

2. THIẾT KẾ BÀI TOÁN NGƯỢC VỚI BỘ SỐ ĐẸP CHUẨN SƯ PHẠM CHO BÀI TẬP VÍ DỤ MẪU:
   - BẮT BUỘC THIẾT KẾ BÀI TOÁN NGƯỢC: Chọn trước nghiệm là số nguyên đẹp ($x = 1, 2, -3$) hoặc phân số tối giản mẫu số nhỏ ($1/2, 3/4$), sau đó mới tính ngược ra hệ số của đề bài mới. TUYỆT ĐỐI KHÔNG sinh số liệu ngẫu nhiên tạo ra nghiệm vô tỉ hoặc phân số cồng kềnh.
   - Bài toán hình học: Áp dụng các bộ số Pytago kinh điển ($3-4-5$, $5-12-13$, $6-8-10$) hoặc góc đặc biệt ($30^\circ, 45^\circ, 60^\circ, 90^\circ$).
   - Bài toán thực tế: Đổi mới 100% bối cảnh (mua sắm thông minh, tiết kiệm điện nước, vận tốc xe điện, năng lượng mặt trời, nông nghiệp công nghệ cao...), dùng tên nhân vật thuần Việt (Minh, An, Trang, Tuấn, Khoa, Hoàng, Đức, Vy...).

3. ĐỒNG BỘ TUYỆT ĐỐI GIỮA ĐỀ BÀI MỚI VÀ LỜI GIẢI MỚI (CHỐNG LỆCH PHA SỐ LIỆU):
   - Toàn bộ đề bài ("problem"), các bước giải chi tiết ("steps"), công thức trọng tâm ("formula") và kết luận đáp số ("conclusion") PHẢI ĐƯỢC TÍNH TOÁN LẠI 100% ĐỒNG BỘ theo bộ số liệu mới. Không để sót bất kỳ số liệu hay dấu vết nào của bài toán cũ trong tài liệu gốc.

4. BẢO VỆ BẢN QUYỀN HÌNH VẼ & BẢNG BIỂU (TUYỆT ĐỐI KHÔNG CẮT ẢNH TỪ SÁCH):
   - TUYỆT ĐỐI KHÔNG cắt ảnh từ tài liệu gốc (không tạo placeholder [DIAGRAM] cắt ảnh từ sách vì hình vẽ trong sách có logo, nét vẽ bản quyền).
   - Bảng biến thiên, bảng xét dấu, bảng giá trị tọa độ: Chuyển đổi trực tiếp thành bảng HTML sạch (<table class="table-auto border-collapse border border-slate-300">...</table>) hoặc bảng LaTeX nhúng trực tiếp vào văn bản.
   - Bài toán hình học: Mô tả đề bài rõ ràng, chính xác; hệ thống sẽ hỗ trợ giáo viên dùng AI Dựng hình vector SVG sau khi bóc tách.

5. ĐẦY ĐỦ CÁC BƯỚC GIẢI CHI TIẾT ("steps") VÀ MẸO TRÁNH BẪY ("tips"):
   - Tự động giải chi tiết từng bước cho các ví dụ mẫu. Nêu rõ định lý, công thức áp dụng.
   - Thêm "tips" ghi rõ lưu ý sư phạm, mẹo nhận dạng nhanh hoặc các bẫy sai lầm học sinh thường gặp.
`
	}

	prompt := fmt.Sprintf(`Bạn là Chuyên gia Sư phạm và Tổng chủ biên Số hóa Bài giảng Toán học Việt Nam chuẩn chương trình Giáo dục Phổ thông mới (GDPT 2018) từ cấp THCS (Lớp 6 đến Lớp 9) đến THPT (Lớp 10 đến Lớp 12).
Hãy đọc các trang ảnh tài liệu bài giảng/sách đính kèm (theo thứ tự từ trang đầu đến trang cuối) và bóc tách TOÀN BỘ các Dạng toán, Phương pháp giải và Bài tập ví dụ mẫu thành định dạng JSON chuẩn.
%s
%s
YÊU CẦU BÓC TÁCH & ĐỊNH DẠNG SƯ PHẠM NGHIÊM NGẶT:
1. CHUẨN CÔNG THỨC TOÁN LATEX (TƯƠNG THÍCH KATEX 100%%):
   - 100%% công thức toán học phải bọc trong cặp dấu $...$ (trong dòng) hoặc $$\n...\n$$ (công thức quan trọng đặt riêng dòng).
   - Ký hiệu góc hình học: Dùng \widehat{ABC} hoặc \hat{A}. TUYỆT ĐỐI KHÔNG dùng \angle.
   - Quan hệ hình học: \Delta ABC (tam giác), \parallel (song song), \perp (vuông góc).
   - Số thập phân tiếng Việt viết liền mạch dạng $2{,}5$.
2. QUY TẮC TRÌNH BÀY PHƯƠNG PHÁP GIẢI ("methods[].solution"):
   - Viết bằng văn phong sư phạm súc tích, mạch lạc, hiện đại, dễ hiểu.
   - TUYỆT ĐỐI KHÔNG viết thành một khối văn bản dính liền nhau.
   - Mỗi định lý, quy tắc hoặc bước giải phải cách nhau 2 dấu xuống dòng (\n\n). Dùng gạch đầu dòng ("- ") hoặc đánh số ("Bước 1: ", "Bước 2: ") rõ ràng.
   - Các công thức toán cốt lõi phải được đặt trên một dòng riêng biệt.
3. QUY TẮC TRÌNH BÀY VÀ TỰ ĐỘNG GIẢI VÍ DỤ MẪU ("problems"):
   - Đề bài ("problem"): Tách biệt câu dẫn và các ý con a), b), c) bằng dấu xuống dòng (\n hoặc \n\n).
   - TỰ ĐỘNG GIẢI CHI TIẾT THEO BƯỚC ("steps"): Nếu tài liệu chưa có lời giải hoặc lời giải vắn tắt, bạn BẮT BUỘC tự giải chi tiết từng bước theo chuẩn sư phạm:
     + "step": Thứ tự bước (1, 2, 3...)
     + "title": Tên bước ngắn gọn (ví dụ: "Bước 1: Đặt điều kiện xác định", "Bước 2: Phân tích thành nhân tử").
     + "content": Lời giải thích sư phạm, nêu rõ định lý/công thức áp dụng.
     + "formula": Biểu thức toán học LaTeX trọng tâm của bước đó.
     + "conclusion": Kết luận rõ ràng đáp số cuối cùng của bài toán.
     + "tips": Mẹo giải nhanh, cách nhớ công thức hoặc lưu ý tránh bẫy sai lầm thường gặp.
4. BẢNG BIẾN THIÊN, BẢNG XÉT DẤU & HÌNH VẼ HÌNH HỌC:
   - TUYỆT ĐỐI KHÔNG cắt ảnh từ sách giáo khoa (không tạo mảng "diagrams" cắt ảnh).
   - Bảng biến thiên, bảng xét dấu, bảng giá trị tọa độ: Chuyển đổi thành bảng HTML sạch (<table class="table-auto border-collapse border border-slate-300">...</table>) hoặc bảng LaTeX nhúng trực tiếp vào nội dung.
   - Bài toán hình học: Nêu đầy đủ giả thiết, dữ kiện trong đề bài để hệ thống hỗ trợ giáo viên dùng AI Dựng hình vector sau khi bóc tách.
5. CẤU TRÚC JSON ĐẦU RA BẮT BUỘC:
   - Trả về DUY NHẤT một mảng JSON thuần túy theo định dạng sau (tuyệt đối KHÔNG kèm markdown fences như ` + "```" + `json hay bất kỳ văn bản giải thích nào ngoài JSON):
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
    ]
  }
]`, gradeHint, paraphraseInstruction)

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
		resp, err := utils.GlobalGeminiPool.ExecuteWithRetry(func(currentKey string) (*http.Response, error) {
			apiUrl := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s", currentModel, currentKey)
			req, err := http.NewRequest("POST", apiUrl, bytes.NewBuffer(jsonBytes))
			if err != nil {
				return nil, err
			}
			req.Header.Set("Content-Type", "application/json")
			return client.Do(req)
		})
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
