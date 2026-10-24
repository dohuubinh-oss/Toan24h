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
	apiKey := os.Getenv("GEMINI_API_KEY")
	if apiKey == "" {
		return "", fmt.Errorf("GEMINI_API_KEY is not configured")
	}

	primaryModel := os.Getenv("GEMINI_MODEL")
	if primaryModel == "" {
		primaryModel = "gemini-3.8-flash"
	}

	validModels := []string{
		"gemini-3.8-flash",
		"gemini-flash-latest",
		"gemini-3.7-flash",
		"gemini-3.6-flash",
		"gemini-3.5-flash",
		"gemini-3.1-pro-preview",
		"gemini-pro-latest",
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

	prompt := `Bạn là chuyên gia sư phạm toán học hình học và kỹ sư đồ họa vector SVG cấp cao (Senior Mathematical Geometry & SVG Visualizer Specialist).
Nhiệm vụ của bạn: Dựa vào đề bài toán học, lời giải chi tiết và chỉ dẫn bổ sung của giáo viên (nếu có), hãy tạo ra DUY NHẤT MỘT HÌNH VẼ SVG HOÀN CHỈNH, CHUẨN XÁC 100% VỀ GIẢI TÍCH HÌNH HỌC, ĐẸP MẮT VÀ BAO QUÁT TOÀN BỘ BÀI TOÁN theo đúng chuẩn mực sách giáo khoa Toán học Việt Nam.

══════════════════════════════════════════════════════════════════════════
★ QUY TẮC DỰNG HÌNH: PHƯƠNG PHÁP ĐỘ LỆCH SỐ NGUYÊN (LOCAL DELTA Oxy)
══════════════════════════════════════════════════════════════════════════
Để dựng hình chuẩn mực sách giáo khoa mà KHÔNG BAO GIỜ bị tính nhầm tọa độ hay méo hình:
1. KHUNG VẼ VÀ GỐC TỌA ĐỘ CỐ ĐỊNH TRÊN SVG 600 x 500:
   - Với hình học phẳng (tam giác, tứ giác): Chọn GỐC TỌA ĐỘ O_gốc = (140, 400) ở góc dưới bên trái.
   - Với hình tròn / hình đối xứng: Chọn GỐC TỌA ĐỘ O_gốc = (300, 250) ở chính giữa khung vẽ.
   - Hệ số tỉ lệ chuẩn: k = 40 (nghĩa là 1 đơn vị toán học = 40 pixel trên màn hình).

2. CÔNG THỨC DUY NHẤT ĐỂ TÍNH TỌA ĐỘ MỌI ĐIỂM M(x, y) TRONG Oxy:
   Mọi điểm M(x, y) trong hệ Descartes Oxy (y hướng lên trên) được chuyển thành tọa độ SVG như sau:
   👉 X_svg = X_gốc + 40 * x    (Đi sang phải x đơn vị thì CỘNG vào X)
   👉 Y_svg = Y_gốc - 40 * y    (Đi LÊN TRÊN y đơn vị thì TRỪ đi ở Y)

3. CÁC MẪU HÌNH HỌC KINH ĐIỂN THEO CHUẨN ĐỘ LỆCH SỐ NGUYÊN:

   ➤ MẪU 1: TAM GIÁC VUÔNG TẠI A (ĐẶC BIỆT LƯU Ý - GÓC VUÔNG BẮT BUỘC Ở ĐỈNH A):
     - Đặt đỉnh vuông A ngay tại gốc: A = (140, 400) [tương ứng A(0, 0)].
     - Cạnh góc vuông AC nằm ngang sang phải 8 đơn vị:
       C = (140 + 40*8, 400) = (460, 400).
     - Cạnh góc vuông AB thẳng đứng HƯỚNG LÊN TRÊN 6 đơn vị:
       B = (140, 400 - 40*6) = (140, 160).
     - Cạnh huyền BC là đường chéo nối B(140, 160) với C(460, 400).
     - Ký hiệu góc vuông tại A:
       <path d="M 140 380 L 160 380 L 160 400" fill="none" stroke="#0f172a" stroke-width="1.5"/>
     => GÓC VUÔNG CHẮC CHẮN 100% NẰM Ở ĐỈNH A! Nhãn A ở góc vuông, B ở trên cao, C ở bên phải!

   ➤ MẪU 2: TAM GIÁC VUÔNG CÓ ĐƯỜNG CAO AH HẠ XUỐNG CẠNH HUYỀN BC NẰM NGANG Ở ĐÁY:
     - Gốc O_gốc = (300, 400) là trung điểm cạnh huyền BC. Bán kính nửa đường tròn R = 200.
     - Đỉnh B ở bên trái: B = (300 - 200, 400) = (100, 400).
     - Đỉnh C ở bên phải: C = (300 + 200, 400) = (500, 400).
     - Đỉnh vuông A ở trên cao: Chọn lệch sang trái 100px => A = (200, 227).
       (Vì 200^2 - 100^2 = 30000 => sqrt(30000) ≈ 173 => 400 - 173 = 227).
     - Chân đường cao AH: H = (200, 400). Đoạn AH thẳng đứng nối từ A(200, 227) xuống H(200, 400).
     - Ký hiệu góc vuông chân đường cao H:
       <path d="M 186 400 L 186 386 L 200 386" fill="none" stroke="#0f172a" stroke-width="1.5"/>

   ➤ MẪU 3: ĐƯỜNG TRÒN TÂM O VÀ TAM GIÁC NỘI TIẾP / TIẾP TUYẾN:
     - Tâm đường tròn: O = (300, 250), bán kính R = 140.
     - Tọa độ điểm M trên đường tròn góc alpha (alpha tính theo độ ngược chiều kim đồng hồ):
       X_M = 300 + 140 * cos(alpha)
       Y_M = 250 - 140 * sin(alpha)   (trừ sin để góc quay ngược chiều kim đồng hồ chuẩn toán học).
     - Tiếp tuyến tại M: Tiếp tuyến vuông góc với bán kính OM tại điểm M.

   ➤ MẪU 4: HÌNH HỌC KHÔNG GIAN (Hình chóp S.ABC, S.ABCD, lăng trụ...):
     - Mặt đáy vẽ dạng phối cảnh hình bình hành.
     - Nét khuất (cạnh bị che lấp ở mặt sau hoặc bên trong): BẮT BUỘC vẽ nét đứt (stroke-dasharray="5,4").
     - Nét thấy: Vẽ nét liền.

══════════════════════════════════════════════════════════════════════════
★ QUY TẮC HIỂN THỊ HỆ TRỤC Oxy
══════════════════════════════════════════════════════════════════════════
1. VỚI BÀI TOÁN HÌNH HỌC PHẲNG / KHÔNG GIAN THUẦN TÚY (Tam giác, tứ giác, đường tròn, hình chóp...):
   - KHÔNG VẼ TRỤC TỌA ĐỘ Ox, Oy LÊN HÌNH. Hệ trục Oxy chỉ dùng trong pha tư duy toán học để tính tọa độ.
   - Giữ hình vẽ sạch sẽ, trực quan theo đúng quy chuẩn sách giáo khoa Toán học.
2. VỚI BÀI TOÁN ĐỒ THỊ / TỌA ĐỘ Oxy (Đại số 9, 10, 11, 12, Parabol, hàm số bậc nhất, tọa độ Vectơ Oxy):
   - BẮT BUỘC vẽ đầy đủ 2 trục Ox, Oy có mũi tên nhọn ở đầu trục, nhãn chữ 'x', 'y', gốc 'O', và các vạch chia đơn vị (ticks).

══════════════════════════════════════════════════════════════════════════
★ QUY TẮC ƯU TIÊN TUYỆT ĐỐI CHO "CHỈ DẪN BỔ SUNG CỦA GIÁO VIÊN"
══════════════════════════════════════════════════════════════════════════
- Khi giáo viên nói "hình vẽ sai rồi", "sai rồi", "vẽ lại", hoặc chỉ ra lỗi sai:
  + ĐÂY LÀ MỆNH LỆNH SỬA SAI ƯU TIÊN CAO NHẤT.
  + HỦY BỎ HOÀN TOÀN hệ tọa độ cũ. Mã SVG cũ chỉ là tham khảo lỗi sai để tránh lặp lại.
  + Dừng lại, áp dụng lại QUY TRÌNH 2 PHA (Descartes Oxy -> Ánh xạ SVG) từ đầu thật cẩn thận để khắc phục triệt để lỗi giáo viên đã chỉ ra.

══════════════════════════════════════════════════════════════════════════
★ THỨ BẬC NÉT VẼ, KÝ HIỆU SƯ PHẠM VÀ NHÃN CHỮ
══════════════════════════════════════════════════════════════════════════
1. Thứ bậc nét vẽ:
   - Hình gốc của đề bài: Nét liền màu xanh than (#0f172a), stroke-width="2.5", fill="none".
   - TẤT CẢ đường phụ / đường dựng thêm của lời giải: Nét đứt (stroke-dasharray="6,4") màu xanh dương hoàng gia (#2563eb) hoặc xanh ngọc (#059669), stroke-width="2".
   - Hình không gian: Nét khuất (bị che lấp bên trong/sau) BẮT BUỘC vẽ nét đứt (stroke-dasharray="5,4").
2. Ký hiệu góc vuông (~14x14px): BẮT BUỘC vẽ tại tất cả các góc vuông bằng thẻ <path ... />.
3. Điểm: Mỗi điểm vẽ <circle cx="..." cy="..." r="3.5" fill="#0f172a"/>.
4. Nhãn chữ cái: Sử dụng thẻ <text x="..." y="..." font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="bold" fill="#0f172a" text-anchor="...">A</text>.
   Đặt nhãn cách điểm 12-15px về phía ngoài góc đa giác để không đè lên nét vẽ.

══════════════════════════════════════════════════════════════════════════
★ ĐỊNH DẠNG ĐẦU RA (OUTPUT FORMAT) - HỖ TRỢ 2 HÌNH THỨC
══════════════════════════════════════════════════════════════════════════
Bạn hãy trả về DUY NHẤT một đối tượng JSON thuộc một trong hai hình thức sau (ƯU TIÊN HÌNH THỨC 1):

👉 HÌNH THỨC 1 (KHUYẾN NGHỊ CAO NHẤT - MÔ HÌNH HÌNH HỌC OXY CHUẨN XÁC 100%):
Khai báo trực tiếp các điểm theo hệ tọa độ Oxy chuẩn toán học phổ thông (y hướng lên trên), Engine nội bộ của hệ thống sẽ tự động chuyển đổi sang SVG, căn giữa, tính Bounding Box và vẽ ký hiệu góc vuông tự động:
{
  "points": {
    "A": [0, 0],
    "B": [0, 6],
    "C": [8, 0],
    "H": [0, 0]
  },
  "segments": [
    {"from": "A", "to": "B", "style": "solid"},
    {"from": "B", "to": "C", "style": "solid"},
    {"from": "C", "to": "A", "style": "solid"},
    {"from": "A", "to": "H", "style": "dashed", "color": "#2563eb"}
  ],
  "right_angles": [
    {"vertex": "A", "arm1": "B", "arm2": "C"}
  ],
  "circles": [
    {"center": "O", "radius": 4, "style": "solid"}
  ],
  "directions": {
    "A": "bottom-left",
    "B": "top",
    "C": "bottom-right"
  },
  "show_axes": false
}

👉 HÌNH THỨC 2: Trả về trực tiếp chuỗi SVG hoàn chỉnh:
{"diagram_svg": "<svg viewBox=\"0 0 600 500\" width=\"100%\" height=\"auto\" xmlns=\"http://www.w3.org/2000/svg\"><rect width=\"600\" height=\"500\" fill=\"#ffffff\" rx=\"12\"/>...</svg>"}

- Tuyệt đối không bọc markdown hay thêm bất kỳ chữ nào ngoài chuỗi JSON.`

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
		apiUrl := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s", currentModel, apiKey)
		httpReq, err := http.NewRequest("POST", apiUrl, bytes.NewReader(bodyBytes))
		if err != nil {
			lastErr = fmt.Errorf("failed to create request for %s: %w", currentModel, err)
			continue
		}
		httpReq.Header.Set("Content-Type", "application/json")

		resp, err := client.Do(httpReq)
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
