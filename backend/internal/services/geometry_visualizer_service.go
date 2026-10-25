package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"regexp"
	"strings"
	"time"

	"github.com/modeptrai/exam-model-backend/internal/utils"
)

// GeometryVisualizerRequest contains parameters for dedicated AI geometry illustration
type GeometryVisualizerRequest struct {
	Content       string `json:"content"`        // Đề bài hoặc câu hỏi
	SolutionGuide string `json:"solution_guide"` // Lời giải chi tiết
	CurrentSVG    string `json:"current_svg"`    // SVG hiện có nếu muốn bổ sung nét
	CustomPrompt  string `json:"custom_prompt"`  // Ghi chú bổ sung từ giáo viên
}

// ExtractCleanSVG finds and normalizes the <svg>...</svg> block from raw model output
func ExtractCleanSVG(raw string) string {
	cleaned := strings.TrimSpace(raw)
	// Remove markdown blocks ```xml ... ``` or ```svg ... ``` or ```json ... ```
	if strings.Contains(cleaned, "```") {
		re := regexp.MustCompile("(?s)```(?:xml|svg|json)?\\s*([\\s\\S]*?)\\s*```")
		matches := re.FindAllStringSubmatch(cleaned, -1)
		for _, m := range matches {
			if len(m) > 1 && strings.Contains(m[1], "<svg") {
				cleaned = m[1]
				break
			}
		}
	}

	// If it's a JSON object like {"diagram_svg": "<svg...>"}
	if strings.HasPrefix(cleaned, "{") {
		var res map[string]interface{}
		if err := json.Unmarshal([]byte(cleaned), &res); err == nil {
			if svgVal, ok := res["diagram_svg"].(string); ok && strings.Contains(svgVal, "<svg") {
				cleaned = svgVal
			}
		}
	}

	start := strings.Index(cleaned, "<svg")
	end := strings.LastIndex(cleaned, "</svg>")
	if start != -1 && end != -1 && end >= start {
		return strings.TrimSpace(cleaned[start : end+6])
	}

	return ""
}

// BuildGeometryContext creates the structured context text for the geometry visualizer prompt
func BuildGeometryContext(req GeometryVisualizerRequest) string {
	contextBuilder := strings.Builder{}
	if req.CustomPrompt != "" {
		contextBuilder.WriteString("=================================================================\n")
		contextBuilder.WriteString("🚨 MỆNH LỆNH & CHỈ DẪN BỔ SUNG CỦA GIÁO VIÊN (ƯU TIÊN TUYỆT ĐỐI CAO NHẤT):\n")
		contextBuilder.WriteString(fmt.Sprintf("%s\n", strings.TrimSpace(req.CustomPrompt)))

		lowerPrompt := strings.ToLower(req.CustomPrompt)
		if strings.Contains(lowerPrompt, "sai") || strings.Contains(lowerPrompt, "lệch") || strings.Contains(lowerPrompt, "không đúng") || strings.Contains(lowerPrompt, "vẽ lại") {
			contextBuilder.WriteString("👉 BẮT BUỘC: Giáo viên đã chỉ ra hình vẽ bị SAI. Hãy hủy bỏ toàn bộ hệ tọa độ cũ, tư duy lại bài toán từ đầu và tính toán lại toàn bộ tọa độ giải tích thật chuẩn xác và cẩn thận!\n")
		} else {
			contextBuilder.WriteString("👉 BẮT BUỘC: Hãy tuân thủ tuyệt đối chỉ dẫn trên của giáo viên khi dựng hình!\n")
		}
		contextBuilder.WriteString("=================================================================\n\n")
	}

	contextBuilder.WriteString("THÔNG TIN BÀI TOÁN CẦN DỰNG HÌNH:\n")
	if req.Content != "" {
		contextBuilder.WriteString(fmt.Sprintf("- Đề bài/Nội dung câu hỏi:\n%s\n\n", strings.TrimSpace(req.Content)))
	}
	if req.SolutionGuide != "" {
		contextBuilder.WriteString(fmt.Sprintf("- Lời giải chi tiết:\n%s\n\n", strings.TrimSpace(req.SolutionGuide)))
	}
	if req.CurrentSVG != "" {
		if req.CustomPrompt != "" {
			contextBuilder.WriteString(fmt.Sprintf("- Mã SVG hiện tại (CHỈ ĐỂ THAM KHẢO LỖI SAI ĐÃ MẮC HOẶC BỔ SUNG, NẾU ĐÃ BỊ BÁO SAI THÌ PHẢI TÍNH TOÁN LẠI TỌA ĐỘ MỚI):\n%s\n", strings.TrimSpace(req.CurrentSVG)))
		} else {
			contextBuilder.WriteString(fmt.Sprintf("- Mã SVG hiện tại (để đối chiếu hoặc bổ sung nét vẽ):\n%s\n", strings.TrimSpace(req.CurrentSVG)))
		}
	}
	return contextBuilder.String()
}

// GenerateGeometrySVG sends a dedicated geometry construction prompt to Gemini
func GenerateGeometrySVG(req GeometryVisualizerRequest) (string, error) {
	if utils.GlobalGeminiPool == nil || utils.GlobalGeminiPool.KeyCount() == 0 {
		utils.InitGlobalGeminiPool()
	}
	if utils.GlobalGeminiPool == nil || utils.GlobalGeminiPool.KeyCount() == 0 {
		return "", fmt.Errorf("GEMINI_API_KEY is not configured")
	}

	primaryModel := os.Getenv("GEMINI_MODEL")
	if primaryModel == "" {
		primaryModel = "gemini-3.8-flash"
	}

	validModels := []string{
		"gemini-3.8-flash",
		"gemini-flash-latest",
		"gemini-flash-lite-latest",
		"gemini-2.5-flash",
		"gemini-2.0-flash",
		"gemini-3.7-flash",
		"gemini-3.6-flash",
		"gemini-3.5-flash",
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

	prompt := `Bạn là chuyên gia sư phạm toán học hình học và kỹ sư đồ họa vector cấp cao (Senior Mathematical Geometry Specialist).
Nhiệm vụ của bạn: Đọc kỹ ĐỀ BÀI và LỜI GIẢI CHI TIẾT (cùng chỉ dẫn bổ sung của giáo viên nếu có), hãy xây dựng MÔ HÌNH HÌNH HỌC CARTESIAN OXY (GeometryModel JSON) CHUẨN XÁC 100% VỀ GIẢI TÍCH TOÁN HỌC để phục vụ việc hiểu đề bài và các bước giải theo sách giáo khoa Toán học Việt Nam.

Engine nội bộ của hệ thống sẽ tự động chuyển đổi mô hình Oxy của bạn thành hình vẽ vector SVG, căn giữa khung hình, tính Bounding Box, vẽ ký hiệu góc vuông, chấm điểm và gắn nhãn chữ cái tự động.

══════════════════════════════════════════════════════════════════════════
★ QUY TẮC BẮT BUỘC VỀ HỆ TỌA ĐỘ DESCARTES OXY (TOÁN HỌC PHỔ THÔNG)
══════════════════════════════════════════════════════════════════════════
1. Mọi điểm M được biểu diễn bằng cặp số thực [x, y] trong mặt phẳng Oxy:
   - Trục hoành Ox hướng SANG PHẢI (x tăng).
   - Trục tung Oy hướng LÊN TRÊN (y tăng, chuẩn toán học, KHÔNG PHẢI tọa độ màn hình).
   - Đặt tọa độ trong khoảng số đẹp từ 0 đến 10 để hình vẽ cân đối.

2. PHÂN BIỆT RÕ RÀNG GIỮA "NÉT VẼ ĐỀ BÀI" VÀ "NÉT VẼ LỜI GIẢI":
   - Các điểm và đoạn thẳng thuộc ĐỀ BÀI GỐC:
     👉 BẮT BUỘC đặt "style": "solid", "color": "#0f172a" (nét liền màu xanh than).
   - Các điểm phụ và đường dựng thêm trong LỜI GIẢI (như kẻ đường cao, phân giác, nối trung điểm, kẻ tiếp tuyến...):
     👉 BẮT BUỘC đặt "style": "dashed", "color": "#2563eb" (nét đứt màu xanh dương hoàng gia).
     Giúp học sinh và giáo viên nhìn vào hình nhận biết ngay đâu là giả thiết đề bài, đâu là đường phụ do lời giải vẽ thêm!
   - Đoạn thẳng có độ dài cho trước trong đề (ví dụ 6 cm, 8 cm, a):
     👉 Đặt thêm trường "label": "6 cm" (nếu có).

══════════════════════════════════════════════════════════════════════════
★ CẨM NANG CÔNG THỨC TỌA ĐỘ TOÁN HỌC KINH ĐIỂN (CHUẨN 100% TUYỆT ĐỐI)
══════════════════════════════════════════════════════════════════════════
Hãy áp dụng chính xác các công thức giải tích tọa độ sau đây để hình vẽ không bao giờ bị sai hay lệch:

➤ 1. TAM GIÁC VUÔNG TẠI A (AB = c, AC = b):
   - Đỉnh vuông A đặt tại gốc: A = [0, 0]
   - Cạnh góc vuông AC nằm ngang sang phải: C = [b, 0] (ví dụ AC = 8 => C = [8, 0])
   - Cạnh góc vuông AB thẳng đứng lên trên: B = [0, c] (ví dụ AB = 6 => B = [0, 6])
   - Cạnh huyền BC nối B và C.
   - Góc vuông tại A: {"vertex": "A", "arm1": "B", "arm2": "C"}
   - CHÂN ĐƯỜNG CAO AH HẠ TỪ A XUỐNG CẠNH HUYỀN BC:
     Tọa độ điểm H trên đoạn BC tính theo công thức hình chiếu chuẩn xác:
     x_H = (b * c^2) / (b^2 + c^2)
     y_H = (b^2 * c) / (b^2 + c^2)
     Ví dụ: b = 8, c = 6 => b^2 + c^2 = 100 => x_H = 8*36/100 = 2.88, y_H = 64*6/100 = 3.84
     => H = [2.88, 3.84] (TUYỆT ĐỐI KHÔNG ĐỂ H = [0, 0]!)
     Góc vuông tại H: {"vertex": "H", "arm1": "A", "arm2": "C"}
   - TRUNG ĐIỂM M CỦA CẠNH HUYỀN BC: M = [b/2, c/2] = [4, 3]

➤ 2. TAM GIÁC NHỌN ABC (Cạnh đáy BC nằm ngang):
   - Đỉnh B = [0, 0]
   - Đỉnh C = [8, 0]
   - Đỉnh A = [2.5, 6] (chọn đỉnh cao 6 đơn vị, lệch nhẹ sang trái tạo tam giác nhọn đẹp)
   - Đường cao AH hạ xuống BC: H = [2.5, 0] (cùng hoành độ với A, tung độ = 0 trên BC)
     Góc vuông tại H: {"vertex": "H", "arm1": "A", "arm2": "C"}
   - Trung điểm M của BC: M = [4, 0]

➤ 3. ĐƯỜNG TRÒN TÂM O VÀ TIẾP TUYẾN / CÁT TUYẾN:
   - Tâm đường tròn: O = [0, 0], bán kính R = 3: {"center": "O", "radius": 3, "style": "solid"}
   - Điểm M nằm ngoài đường tròn: M = [6, 0] (cách tâm d = 6)
   - Hai tiếp điểm A, B của tiếp tuyến MA, MB kẻ từ M:
     cos(alpha) = R / d = 3 / 6 = 0.5 => alpha = 60 độ
     A = [R * cos(60°), R * sin(60°)] = [3 * 0.5, 3 * 0.866] = [1.5, 2.6]
     B = [R * cos(-60°), R * sin(-60°)] = [1.5, -2.6]
     Tiếp tuyến MA, MB nối từ M(6, 0) đến A và B.
     Góc vuông tiếp tuyến: {"vertex": "A", "arm1": "M", "arm2": "O"} và {"vertex": "B", "arm1": "M", "arm2": "O"}

➤ 4. TAM GIÁC ABC NỘI TIẾP ĐƯỜNG TRÒN TÂM O:
   - Tâm O = [0, 0], bán kính R = 4: {"center": "O", "radius": 4, "style": "solid"}
   - Đỉnh A ở trên cao nhất: A = [0, 4]
   - Đỉnh B ở góc 210°: B = [-3.46, -2]
   - Đỉnh C ở góc 330°: C = [3.46, -2]
   - Cạnh đáy BC nằm ngang y = -2, tam giác ABC cân hoặc nhọn nội tiếp đẹp chuẩn mực.

➤ 5. TỨ GIÁC, HÌNH THANG, HÌNH BÌNH HÀNH:
   - Hình chữ nhật: A = [0, 0], B = [8, 0], C = [8, 5], D = [0, 5]
   - Hình bình hành: A = [0, 0], B = [7, 0], C = [9, 4], D = [2, 4]
   - Hình thang vuông tại A và D: A = [0, 0], D = [0, 4], C = [5, 4], B = [8, 0]

➤ 6. HÌNH HỌC KHÔNG GIAN 3D (Hình chóp S.ABC, S.ABCD):
   - Đáy hình bình hành vẽ phối cảnh nghiêng:
     A = [1, 1], B = [6, 1], C = [8, 3], D = [3, 3]
   - Cạnh khuất (bên trong/sau): AD, CD, SA đặt "style": "dashed", "color": "#64748b"
   - Cạnh thấy: AB, BC, SB, SC, SD đặt "style": "solid"
   - Đỉnh chóp S ở trên cao: S = [3, 7]

══════════════════════════════════════════════════════════════════════════
★ ĐỊNH DẠNG ĐẦU RA JSON BẮT BUỘC (OUTPUT SCHEMA)
══════════════════════════════════════════════════════════════════════════
Bạn hãy trả về DUY NHẤT một chuỗi JSON thuần tuý (không bọc markdown, không thêm bất kỳ văn bản nào ngoài JSON) theo đúng cấu trúc sau:
{
  "points": {
    "A": [0, 0],
    "B": [0, 6],
    "C": [8, 0],
    "H": [2.88, 3.84]
  },
  "segments": [
    {"from": "A", "to": "B", "style": "solid", "label": "6 cm"},
    {"from": "B", "to": "C", "style": "solid"},
    {"from": "C", "to": "A", "style": "solid", "label": "8 cm"},
    {"from": "A", "to": "H", "style": "dashed", "color": "#2563eb"}
  ],
  "right_angles": [
    {"vertex": "A", "arm1": "B", "arm2": "C"},
    {"vertex": "H", "arm1": "A", "arm2": "C"}
  ],
  "circles": [],
  "directions": {
    "A": "bottom-left",
    "B": "top",
    "C": "bottom-right",
    "H": "top-right"
  },
  "show_axes": false
}`

	contextText := BuildGeometryContext(req)

	parts := []map[string]interface{}{
		{"text": prompt},
		{"text": contextText},
	}

	requestBody := map[string]interface{}{
		"contents": []map[string]interface{}{
			{
				"parts": parts,
			},
		},
		"generationConfig": map[string]interface{}{
			"temperature":     0.15,
			"responseMimeType": "application/json",
		},
	}

	bodyBytes, err := json.Marshal(requestBody)
	if err != nil {
		return "", fmt.Errorf("failed to marshal geometry request: %w", err)
	}

	client := &http.Client{Timeout: 15 * time.Second}
	var lastErr error

	for _, currentModel := range candidateModels {
		resp, err := utils.GlobalGeminiPool.ExecuteWithRetry(func(currentKey string) (*http.Response, error) {
			apiUrl := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s", currentModel, currentKey)
			httpReq, err := http.NewRequest("POST", apiUrl, bytes.NewReader(bodyBytes))
			if err != nil {
				return nil, err
			}
			httpReq.Header.Set("Content-Type", "application/json")
			return client.Do(httpReq)
		})
		if err != nil {
			log.Printf("[Geometry Visualizer] Model %s failed: %v. Trying next model...", currentModel, err)
			lastErr = fmt.Errorf("call failed for %s: %w", currentModel, err)
			continue
		}

		respBody, err := io.ReadAll(resp.Body)
		resp.Body.Close()
		if err != nil {
			log.Printf("[Geometry Visualizer] Failed to read response from %s: %v. Trying next model...", currentModel, err)
			lastErr = fmt.Errorf("read failed for %s: %w", currentModel, err)
			continue
		}

		if resp.StatusCode != http.StatusOK {
			log.Printf("[Geometry Visualizer] Model %s returned status %d: %s. Trying next model...", currentModel, resp.StatusCode, string(respBody))
			lastErr = fmt.Errorf("api error (%s status %d): %s", currentModel, resp.StatusCode, string(respBody))
			if resp.StatusCode == http.StatusServiceUnavailable || resp.StatusCode == http.StatusTooManyRequests {
				time.Sleep(1 * time.Second)
			}
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
			log.Printf("[Geometry Visualizer] Failed to decode JSON from %s: %v", currentModel, err)
			lastErr = fmt.Errorf("decode error for %s: %w", currentModel, err)
			continue
		}

		if len(response.Candidates) == 0 || len(response.Candidates[0].Content.Parts) == 0 {
			log.Printf("[Geometry Visualizer] Empty candidates from %s", currentModel)
			lastErr = fmt.Errorf("empty candidates from %s", currentModel)
			continue
		}

		rawText := response.Candidates[0].Content.Parts[0].Text

		// 1. First priority: Try parsing as Cartesian Oxy GeometryModel JSON (100% precision)
		if svgFromModel, ok := ParseAndRenderGeometryJSON(rawText); ok && svgFromModel != "" {
			log.Printf("[Geometry Visualizer] Successfully rendered SVG using internal Geometry Engine from Cartesian Oxy JSON (%s)", currentModel)
			return svgFromModel, nil
		}

		// 2. Fallback: Parse direct SVG string
		cleanSVG := ExtractCleanSVG(rawText)
		if cleanSVG != "" {
			return cleanSVG, nil
		}

		lastErr = fmt.Errorf("model %s output did not contain a valid geometry model or <svg> block", currentModel)
	}

	if lastErr != nil {
		return "", lastErr
	}
	return "", fmt.Errorf("failed to generate geometry SVG from all models")
}
