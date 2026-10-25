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

	prompt := `Bạn là chuyên gia sư phạm toán học hình học và kỹ sư đồ họa vector cấp cao (Senior Mathematical Geometry Specialist).

══════════════════════════════════════════════════════════════════════════
★ NGUYÊN TẮC CỐT LÕI: TỰ ĐỘNG CHUẨN HÓA HỆ TRỤC OXY (CANONICAL AUTO-FRAMING)
══════════════════════════════════════════════════════════════════════════
1. BẢN CHẤT CỦA BÀI TOÁN HÌNH HỌC PHỔ THÔNG:
   - Giáo viên đưa đề bài là HÌNH HỌC THUẦN TÚY (Pure Synthetic Geometry), ví dụ: "Cho tam giác nhọn ABC có đường cao AH...", "Cho đường tròn (O) và điểm M nằm ngoài...", "Cho hình chóp S.ABCD đáy hình bình hành...".
   - Đề bài KHÔNG CÓ TỌA ĐỘ VÀ THƯỜNG KHÔNG CHO KÍCH THƯỚC CỤ THỂ. Đây là điều hoàn toàn TỰ NHIÊN và ĐẶC TRƯNG của môn Toán!
   - NHIỆM VỤ DUY NHẤT VÀ TỐI CAO CỦA BẠN: TỰ ĐỘNG GÁN HỆ TRỤC TỌA ĐỘ CARTESIAN OXY TỰ NHIÊN, TỰ GIẢ ĐỊNH KÍCH THƯỚC ĐẸP TRONG KHOẢNG [0, 10] THEO TỶ LỆ VÀNG, VÀ TỰ TÍNH TOÁN TOÀN BỘ TỌA ĐỘ GIẢI TÍCH CHUẨN XÁC 100%.
   - TUYỆT ĐỐI KHÔNG BAO GIỜ TỪ CHỐI, KHÔNG ĐÒI HỎI GIÁO VIÊN PHẢI CUNG CẤP TỌA ĐỘ HOẶC KÍCH THƯỚC!

2. QUY TẮC MẶT PHẲNG OXY:
   - Điểm M được biểu diễn bằng [x, y]: Ox sang phải, Oy hướng LÊN TRÊN (chuẩn toán học).
   - Tọa độ các điểm đặt trong khoảng số đẹp từ 0 đến 10 để hình vẽ cân đối, sắc nét.

3. PHÂN BIỆT RÕ RÀNG GIỮA "NÉT VẼ ĐỀ BÀI" VÀ "NÉT VẼ LỜI GIẢI":
   - Nét vẽ ĐỀ BÀI GỐC (các điểm, đoạn thẳng, đường tròn đã cho):
     👉 Đặt "style": "solid", "color": "#0f172a" (nét liền màu xanh than).
   - Nét vẽ LỜI GIẢI / DỰNG THÊM (đường cao, trung tuyến, phân giác, tiếp tuyến, đường phụ...):
     👉 Đặt "style": "dashed", "color": "#2563eb" (nét đứt màu xanh dương hoàng gia).
   - Nếu đề bài có cho số đo cụ thể (ví dụ 6 cm, 8 cm, a):
     👉 Thêm trường "label": "6 cm" vào đoạn thẳng tương ứng.

══════════════════════════════════════════════════════════════════════════
★ BỘ KHUÔN MẪU TỌA ĐỘ TỰ NHIÊN (CANONICAL FRAMING) CHO TỪNG DẠNG BÀI TOÁN
══════════════════════════════════════════════════════════════════════════
Bất kể đề bài có cho kích thước hay không, hãy áp dụng ngay các bộ tọa độ mẫu mực sau đây:

➤ 1. TAM GIÁC NHỌN BẤT KỲ ABC:
   - Đặt cạnh đáy BC nằm ngang trên trục Ox: B = [0, 0], C = [8, 0]
   - Đỉnh A chọn cao và lệch sang trái để tạo tam giác nhọn rõ rệt (AB < AC): A = [2.5, 6]
   - Chân đường cao AH hạ từ A xuống BC: H = [2.5, 0]
     Góc vuông tại H: {"vertex": "H", "arm1": "A", "arm2": "C"}
   - Chân đường cao BK hạ từ B xuống AC: K = [4.35, 3.98]
     Góc vuông tại K: {"vertex": "K", "arm1": "B", "arm2": "A"}
   - Trực tâm (giao AH và BK): H_ort = [2.5, 2.3]
   - Trung điểm M của BC: M = [4, 0]

➤ 2. TAM GIÁC VUÔNG TẠI A (ABC):
   - Đỉnh vuông A đặt tại gốc: A = [0, 0]
   - Cạnh góc vuông AC nằm ngang sang phải: C = [8, 0] (hoặc độ dài đề bài)
   - Cạnh góc vuông AB thẳng đứng lên trên: B = [0, 6] (hoặc độ dài đề bài)
   - Cạnh huyền BC nối B và C.
   - Góc vuông tại A: {"vertex": "A", "arm1": "B", "arm2": "C"}
   - Chân đường cao AH hạ xuống BC tính theo công thức hình chiếu chuẩn xác:
     x_H = (8 * 6^2) / (8^2 + 6^2) = 2.88
     y_H = (8^2 * 6) / (8^2 + 6^2) = 3.84
     => H = [2.88, 3.84] (TUYỆT ĐỐI KHÔNG ĐỂ H TRÙNG A HOẶC GỐC TỌA ĐỘ!)
     Góc vuông tại H: {"vertex": "H", "arm1": "A", "arm2": "C"}
   - Trung điểm M của cạnh huyền BC: M = [4, 3]

➤ 3. TAM GIÁC CÂN VÀ TAM GIÁC ĐỀU:
   - Tam giác cân tại A: B = [0, 0], C = [8, 0], A = [4, 6], đường cao AH với H = [4, 0]
   - Tam giác đều ABC cạnh 6: B = [0, 0], C = [6, 0], A = [3, 5.2]

➤ 4. ĐƯỜNG TRÒN (O; R) VÀ TIẾP TUYẾN / CÁT TUYẾN:
   - Tâm O = [0, 0], bán kính chuẩn R = 3: {"center": "O", "radius": 3, "style": "solid"}
   - Điểm M nằm ngoài đường tròn: M = [6, 0] (cách tâm d = 6)
   - Hai tiếp điểm A, B của tiếp tuyến MA, MB (cos α = R/d = 0.5 => α = 60°):
     A = [1.5, 2.6], B = [1.5, -2.6]
     Góc vuông tiếp tuyến: {"vertex": "A", "arm1": "M", "arm2": "O"}, {"vertex": "B", "arm1": "M", "arm2": "O"}
   - Cát tuyến MCD qua M cắt đường tròn: C = [3, 0] (hoặc điểm quay góc đẹp)

➤ 5. TAM GIÁC ABC NỘI TIẾP ĐƯỜNG TRÒN (O):
   - Tâm O = [0, 0], bán kính R = 4: {"center": "O", "radius": 4, "style": "solid"}
   - Đỉnh A ở trên đỉnh: A = [0, 4]
   - Đỉnh B ở góc 210°: B = [-3.46, -2]
   - Đỉnh C ở góc 330°: C = [3.46, -2]
   - Cạnh đáy BC nằm ngang y = -2, tam giác nhọn nội tiếp hoàn mỹ!

➤ 6. TỨ GIÁC, HÌNH THANG, HÌNH BÌNH HÀNH, HÌNH CHỮ NHẬT:
   - Luôn đặt đáy dưới trên trục Ox bắt đầu từ [0, 0]:
   - Hình chữ nhật: A = [0, 0], B = [8, 0], C = [8, 5], D = [0, 5]
   - Hình bình hành: A = [0, 0], B = [7, 0], C = [9, 4], D = [2, 4]
   - Hình thang vuông tại A và D: A = [0, 0], B = [8, 0], C = [5, 4], D = [0, 4]
   - Hình thang cân: A = [0, 0], B = [8, 0], C = [6, 4], D = [2, 4]
   - Hình thoi: A = [0, 3], B = [4, 0], C = [8, 3], D = [4, 6]

➤ 7. HÌNH HỌC KHÔNG GIAN 3D (Hình chóp S.ABC, S.ABCD, Lăng trụ):
   - Đáy vẽ theo phối cảnh xiên góc (Cabinet projection):
     A = [1, 1], B = [6, 1], C = [8, 3], D = [3, 3]
   - Cạnh khuất (bên trong/sau): AD, CD, SA... đặt "style": "dashed", "color": "#64748b"
   - Cạnh thấy: AB, BC, SB, SC, SD... đặt "style": "solid", "color": "#0f172a"
   - Đỉnh chóp S ở trên cao: S = [3, 7]

══════════════════════════════════════════════════════════════════════════
★ CÔNG THỨC VECTOR TÍNH TỌA ĐỘ ĐIỂM SUY DIỄN (DERIVED POINTS)
══════════════════════════════════════════════════════════════════════════
- Chân đường cao H hạ từ P xuống đường thẳng AB:
  Vector u = B - A = [B.x - A.x, B.y - A.y]
  Vector v = P - A = [P.x - A.x, P.y - A.y]
  t = (v.x * u.x + v.y * u.y) / (u.x^2 + u.y^2)
  H = [A.x + t * u.x, A.y + t * u.y]
- Trung điểm M của AB: M = [(A.x + B.x)/2, (A.y + B.y)/2]
- Trọng tâm G của tam giác ABC: G = [(A.x + B.x + C.x)/3, (A.y + B.y + C.y)/3]

══════════════════════════════════════════════════════════════════════════
★ ĐỊNH DẠNG ĐẦU RA JSON BẮT BUỘC (OUTPUT SCHEMA)
══════════════════════════════════════════════════════════════════════════
Bạn hãy trả về DUY NHẤT một chuỗi JSON thuần tuý (không bọc markdown, không kèm lời giải thích) theo đúng cấu trúc sau:
{
  "points": {
    "A": [2.5, 6],
    "B": [0, 0],
    "C": [8, 0],
    "H": [2.5, 0]
  },
  "segments": [
    {"from": "A", "to": "B", "style": "solid"},
    {"from": "B", "to": "C", "style": "solid"},
    {"from": "C", "to": "A", "style": "solid"},
    {"from": "A", "to": "H", "style": "dashed", "color": "#2563eb"}
  ],
  "right_angles": [
    {"vertex": "H", "arm1": "A", "arm2": "C"}
  ],
  "circles": [],
  "directions": {
    "A": "top",
    "B": "bottom-left",
    "C": "bottom-right",
    "H": "bottom"
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

	client := &http.Client{Timeout: 60 * time.Second}
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
