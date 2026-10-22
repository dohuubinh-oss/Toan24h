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
	"regexp"
	"strconv"
	"strings"
	"time"
	"unicode"

	"github.com/modeptrai/exam-model-backend/internal/utils"
)

type DiagramInfo struct {
	ImageIndex  int       `json:"image_index"`
	Box2D       []float64 `json:"box_2d"` // [ymin, xmin, ymax, xmax]
	Placeholder string    `json:"placeholder"`
}

type FlexibleInt int

func (fi *FlexibleInt) UnmarshalJSON(data []byte) error {
	str := strings.Trim(string(data), `"`)
	if str == "null" || str == "" {
		*fi = 0
		return nil
	}
	if val, err := strconv.ParseFloat(str, 64); err == nil {
		*fi = FlexibleInt(int(val + 0.5))
		return nil
	}
	return nil
}

func (fi FlexibleInt) MarshalJSON() ([]byte, error) {
	return json.Marshal(int(fi))
}

type ExtractedQuestionItem struct {
	Content         string      `json:"content"`
	Type            string      `json:"type"`
	Grade           int         `json:"grade"`
	Topic           string      `json:"topic"`
	DifficultyLevel string      `json:"difficulty_level"`
	DifficultyPoint float32     `json:"difficulty_point"`
	Point           FlexibleInt `json:"point"`
	Tags            []string    `json:"tags"`
	Options         []string    `json:"options"`
	CorrectAnswer   string      `json:"correct_answer"`
	SolutionGuide   any         `json:"solution_guide"`
	Hint            string      `json:"hint"`
	ShortAnswer     string      `json:"short_answer,omitempty"`
	QuickSolveTips  string      `json:"quick_solve_tips,omitempty"`
	GeneralMethod   string      `json:"general_method"`
	Mistakes        string      `json:"mistakes"`
}

type ExtractedQuestionBlock struct {
	SharedContent *string                 `json:"shared_content"`
	TypeQuestion  string                  `json:"type_question"`
	Questions     []ExtractedQuestionItem `json:"questions"`
}

type rawGeminiBlock struct {
	SharedContent *string                 `json:"shared_content"`
	TypeQuestion  string                  `json:"type_question"`
	IsGroup       *bool                   `json:"is_group,omitempty"`
	Point         *FlexibleInt            `json:"point,omitempty"`
	Questions     []ExtractedQuestionItem `json:"questions"`
	Diagrams      []DiagramInfo           `json:"diagrams,omitempty"`
}

var (
	rxFraction  = regexp.MustCompile(`^[+-]?\d+\s*/\s*\d+$`)
	rxMathChars = regexp.MustCompile(`[+\-*\/=<>≤≥≠;]`)
)

// isMathExpression kiểm tra xem chuỗi có phải là biểu thức hoặc ký hiệu toán học cần bọc $...$ không
func isMathExpression(s string) bool {
	trimmed := strings.TrimSpace(s)
	if trimmed == "" {
		return false
	}
	// Đã có $ thì không cần bọc thêm
	if strings.Contains(trimmed, "$") {
		return false
	}
	// Chứa lệnh LaTeX: \frac, \sqrt, \pm, \alpha, \le, \ge, etc.
	if strings.Contains(trimmed, "\\") {
		return true
	}
	// Chứa toán tử so sánh, số mũ hoặc chỉ số dưới
	if strings.ContainsAny(trimmed, "=<>^_{}") {
		return true
	}
	// Chứa ký hiệu toán học đặc biệt unicode: ±, ∓, ≤, ≥, ≠, ≈, ∈
	if strings.ContainsAny(trimmed, "±∓≤≥≠≈∈") {
		return true
	}
	// Là số thực, số nguyên hoặc số âm: 2, -5, 3.14, +2
	if _, err := strconv.ParseFloat(trimmed, 64); err == nil {
		return true
	}
	// Là phân số: 1/2, -3/4
	if rxFraction.MatchString(trimmed) {
		return true
	}
	// Chứa các toán tử toán học (+, -, *, /, =, <, >, ;, ≤, ≥, ≠)
	if rxMathChars.MatchString(trimmed) {
		return true
	}
	// Ký tự đơn lẻ là biến toán học (x, y, z, m, a, b...)
	if len([]rune(trimmed)) == 1 && unicode.IsLetter([]rune(trimmed)[0]) {
		return true
	}
	return false
}

// EnsureMathDelimiters bắt buộc bọc tất cả các công thức toán học trong $...$, không có ngoại lệ
func EnsureMathDelimiters(s string) string {
	trimmed := strings.TrimSpace(s)
	if trimmed == "" {
		return ""
	}
	if strings.Contains(trimmed, "$") {
		return trimmed
	}

	hasP := strings.HasPrefix(trimmed, "<p>") && strings.HasSuffix(trimmed, "</p>")
	inner := trimmed
	if hasP {
		inner = strings.TrimSpace(strings.TrimSuffix(strings.TrimPrefix(inner, "<p>"), "</p>"))
		if strings.Contains(inner, "$") {
			return trimmed
		}
	}

	if isMathExpression(inner) {
		if hasP {
			return fmt.Sprintf("<p>$%s$</p>", inner)
		}
		return fmt.Sprintf("$%s$", inner)
	}

	return trimmed
}

// GradeAllowedTopics chứa danh sách các chuyên đề chuẩn hóa theo từng khối lớp từ Lớp 5 đến Lớp 9.
var GradeAllowedTopics = map[int][]string{
	9: {
		"Phương trình bậc nhất hai ẩn",
		"Hệ hai phương trình bậc nhất hai ẩn",
		"Hàm số y = ax^2 (a khác 0)",
		"Đồ thị hàm số bậc hai đơn giản",
		"Công thức nghiệm phương trình bậc hai",
		"Định lý Viète và ứng dụng",
		"Tỉ số lượng giác của góc nhọn",
		"Hệ thức giữa cạnh và góc",
		"Sự xác định đường tròn và vị trí tương đối",
		"Góc với đường tròn (Góc nội tiếp, góc ở tâm)",
		"Hình trụ",
		"Hình nón",
		"Hình cầu",
	},
	8: {
		"Đơn thức và đa thức nhiều biến",
		"Các phép tính với đa thức",
		"Hằng đẳng thức đáng nhớ",
		"Khái niệm phân thức",
		"Các phép toán cộng, trừ, nhân, chia phân thức",
		"Khái niệm hàm số",
		"Hàm số bậc nhất y = ax + b",
		"Hệ số góc của đường thẳng",
		"Cách giải phương trình bậc nhất một ẩn",
		"Giải bài toán bằng cách lập phương trình",
		"Định lý Thalès thuận và đảo",
		"Đường trung bình của tam giác",
		"Các trường hợp đồng dạng của tam giác",
		"Tam giác vuông đồng dạng",
		"Hình chóp tam giác đều",
		"Hình chóp tứ giác đều",
	},
	7: {
		"Tập hợp số hữu tỉ",
		"Căn bậc hai số học và số thực",
		"Tỉ lệ thức và tính chất dãy tỉ số bằng nhau",
		"Đại lượng tỉ lệ thuận, tỉ lệ nghịch",
		"Biểu thức đại số",
		"Đa thức một biến và nghiệm của đa thức",
		"Hai góc kề bù, đối đỉnh",
		"Dấu hiệu hai đường thẳng song song",
		"Tổng các góc trong một tam giác",
		"Tam giác bằng nhau (c.c.c, c.g.c, g.c.g)",
		"Tam giác cân và định lý Pythagoras",
		"Làm quen với xác suất của biến cố ngẫu nhiên",
	},
	6: {
		"Tập hợp số tự nhiên",
		"Tính chất chia hết và ước số",
		"Tập hợp số nguyên và phép tính",
		"Phân số bằng nhau và rút gọn",
		"Các phép tính với số thập phân",
		"Hình vuông, tam giác đều, lục giác đều",
		"Hình chữ nhật, hình thoi, hình bình hành",
		"Hình có trục đối xứng",
		"Hình có tâm đối xứng",
		"Điểm, đường thẳng, đoạn thẳng",
		"Trung điểm của đoạn thẳng",
		"Góc và số đo góc",
	},
	5: {
		"Phân số thập phân và hỗn số",
		"Số thập phân và các phép toán",
		"Diện tích hình tam giác, hình thang",
		"Chu vi và diện tích hình tròn",
		"Hình hộp chữ nhật, hình lập phương",
		"Hình trụ, hình cầu",
		"Đo thể tích và chuyển đổi đơn vị",
		"Toán chuyển động đều",
		"Giải toán tỉ số phần trăm",
	},
}

// NormalizeQuestionTopic chuẩn hóa và đảm bảo topic trả về thuộc đúng danh mục chủ đề của khối lớp.
func NormalizeQuestionTopic(grade int, rawTopic string) string {
	raw := strings.TrimSpace(rawTopic)

	// Nếu grade không hợp lệ (ngoài 5..9), cố gắng tìm trong tất cả các lớp
	if grade < 5 || grade > 9 {
		for g := 9; g >= 5; g-- {
			for _, allowed := range GradeAllowedTopics[g] {
				if strings.EqualFold(raw, allowed) {
					return allowed
				}
			}
		}
		grade = 9
	}

	allowedList, ok := GradeAllowedTopics[grade]
	if !ok || len(allowedList) == 0 {
		return raw
	}

	if raw == "" {
		return allowedList[0]
	}

	// 1. So khớp chính xác không phân biệt hoa thường
	for _, allowed := range allowedList {
		if strings.EqualFold(raw, allowed) {
			return allowed
		}
	}

	// Chuẩn hóa chuỗi phụ trợ
	normalizeStr := func(s string) string {
		s = strings.ToLower(s)
		s = strings.ReplaceAll(s, "y=ax^2", "y = ax^2")
		s = strings.ReplaceAll(s, "y=ax+b", "y = ax + b")
		s = strings.ReplaceAll(s, "vi-ét", "viète")
		s = strings.ReplaceAll(s, "viet", "viète")
		s = strings.ReplaceAll(s, "ta-lét", "thalès")
		s = strings.ReplaceAll(s, "thales", "thalès")
		s = strings.ReplaceAll(s, "pytago", "pythagoras")
		s = strings.ReplaceAll(s, "pitago", "pythagoras")
		return strings.TrimSpace(s)
	}

	normRaw := normalizeStr(raw)

	// 2. So khớp sau khi chuẩn hóa biến thể từ ngữ
	for _, allowed := range allowedList {
		if normalizeStr(allowed) == normRaw {
			return allowed
		}
	}

	// 3. So khớp chứa chuỗi (containment)
	for _, allowed := range allowedList {
		normAllowed := normalizeStr(allowed)
		if strings.Contains(normRaw, normAllowed) || strings.Contains(normAllowed, normRaw) {
			return allowed
		}
	}

	// 4. So khớp theo số lượng từ trùng khớp nhiều nhất (exact word match)
	rawWords := strings.Fields(normRaw)
	bestMatch := allowedList[0]
	maxOverlap := 0

	for _, allowed := range allowedList {
		normAllowed := normalizeStr(allowed)
		allowedWords := strings.Fields(normAllowed)
		overlap := 0
		for _, rw := range rawWords {
			if len([]rune(rw)) >= 2 {
				for _, aw := range allowedWords {
					if rw == aw {
						overlap++
						break
					}
				}
			}
		}
		if overlap > maxOverlap {
			maxOverlap = overlap
			bestMatch = allowed
		}
	}

	return bestMatch
}

// cleanOptionText loại bỏ tiền tố A., B., C., D., A), B) khỏi phương án
func cleanOptionText(opt string) string {
	trimmed := strings.TrimSpace(opt)
	// Loại bỏ tiền tố dạng A. hoặc A) hoặc <p>A.
	hasP := strings.HasPrefix(trimmed, "<p>")
	content := trimmed
	if hasP {
		content = strings.TrimPrefix(content, "<p>")
	}
	content = strings.TrimSpace(content)

	if len(content) >= 2 {
		firstChar := content[0]
		if (firstChar >= 'A' && firstChar <= 'D') || (firstChar >= 'a' && firstChar <= 'd') {
			secondChar := content[1]
			if secondChar == '.' || secondChar == ')' || secondChar == ':' {
				content = strings.TrimSpace(content[2:])
			}
		}
	}

	if hasP {
		return "<p>" + content
	}
	return content
}

// detectGradeFromTopic suy luận khối lớp dựa vào tên chủ đề hoặc fallback
func detectGradeFromTopic(rawTopic string, fallback ...int) int {
	clean := strings.ToLower(strings.TrimSpace(rawTopic))
	if clean != "" {
		for g := 9; g >= 5; g-- {
			for _, allowed := range GradeAllowedTopics[g] {
				allowedLower := strings.ToLower(allowed)
				if strings.EqualFold(clean, allowedLower) || strings.Contains(clean, allowedLower) || strings.Contains(allowedLower, clean) {
					return g
				}
			}
		}
	}
	if len(fallback) > 0 && fallback[0] >= 5 && fallback[0] <= 9 {
		return fallback[0]
	}
	return 9
}

// ParseAndProcessExtractedBlocks processes raw JSON from Gemini and crops any diagrams
func ParseAndProcessExtractedBlocks(rawJson string, sourceImages []image.Image, tempDir string, fallbackGrade ...int) ([]ExtractedQuestionBlock, error) {
	cleanJson := utils.SanitizeJSON(rawJson)

	var rawBlocks []rawGeminiBlock
	if err := json.Unmarshal([]byte(cleanJson), &rawBlocks); err != nil {
		return nil, fmt.Errorf("failed to parse JSON from Gemini response: %w", err)
	}

	if tempDir == "" {
		tempDir = "./uploads/temp"
	}

	blocks := make([]ExtractedQuestionBlock, len(rawBlocks))

	for bIdx := range rawBlocks {
		rb := &rawBlocks[bIdx]

		isGroup := (rb.IsGroup != nil && *rb.IsGroup) || strings.EqualFold(rb.TypeQuestion, "group") || len(rb.Questions) > 1 || (rb.SharedContent != nil && strings.TrimSpace(*rb.SharedContent) != "")
		tq := "single"
		var sharedContent *string = nil
		if isGroup {
			tq = "group"
			if rb.SharedContent != nil && strings.TrimSpace(*rb.SharedContent) != "" {
				sharedContent = rb.SharedContent
			}
		}

		// Hậu xử lý từng câu hỏi trong block
		for qIdx := range rb.Questions {
			q := &rb.Questions[qIdx]

			// Xác định khối lớp
			if q.Grade == 0 && len(fallbackGrade) > 0 && fallbackGrade[0] > 0 {
				q.Grade = fallbackGrade[0]
			}
			if q.Grade < 5 || q.Grade > 9 {
				q.Grade = detectGradeFromTopic(q.Topic, fallbackGrade...)
			}

			// Bắt buộc chuẩn hóa Topic thành 1 và chỉ 1 chủ đề hợp lệ của khối lớp đó
			q.Topic = NormalizeQuestionTopic(q.Grade, q.Topic)

			// Chuẩn hóa loại câu hỏi và phương án
			if strings.EqualFold(q.Type, "Trắc nghiệm") {
				q.Type = "Trắc nghiệm"
				for oIdx := range q.Options {
					q.Options[oIdx] = EnsureMathDelimiters(cleanOptionText(q.Options[oIdx]))
				}

				// Chuẩn hóa correct_answer: nếu là chữ cái 'A', 'B', 'C', 'D' thì map sang nội dung options tương ứng
				trimmedAns := strings.TrimSpace(q.CorrectAnswer)
				if len(trimmedAns) == 1 {
					first := strings.ToUpper(trimmedAns)[0]
					if first >= 'A' && first <= 'D' {
						idx := int(first - 'A')
						if idx < len(q.Options) && q.Options[idx] != "" {
							q.CorrectAnswer = q.Options[idx]
						}
					}
				} else if len(trimmedAns) >= 2 {
					first := strings.ToUpper(trimmedAns)[0]
					if (first >= 'A' && first <= 'D') && (trimmedAns[1] == '.' || trimmedAns[1] == ')' || trimmedAns[1] == ':') {
						cleaned := cleanOptionText(trimmedAns)
						if cleaned != "" {
							q.CorrectAnswer = EnsureMathDelimiters(cleaned)
						} else {
							idx := int(first - 'A')
							if idx < len(q.Options) && q.Options[idx] != "" {
								q.CorrectAnswer = q.Options[idx]
							}
						}
					}
				}

				// Fallback: Nếu correct_answer vẫn rỗng nhưng có options, gán phương án đầu tiên
				if q.CorrectAnswer == "" && len(q.Options) > 0 {
					q.CorrectAnswer = q.Options[0]
				}
				q.CorrectAnswer = EnsureMathDelimiters(q.CorrectAnswer)
			} else {
				q.Type = "Tự luận"
				if q.Options == nil {
					q.Options = []string{}
				}
				q.CorrectAnswer = EnsureMathDelimiters(q.CorrectAnswer)
			}

			// Chuẩn hóa DifficultyLevel và DifficultyPoint
			switch q.DifficultyLevel {
			case "Nhận biết":
				if q.DifficultyPoint == 0 {
					q.DifficultyPoint = 2.5
				}
			case "Thông hiểu":
				if q.DifficultyPoint == 0 {
					q.DifficultyPoint = 5.0
				}
			case "Vận dụng":
				if q.DifficultyPoint == 0 {
					q.DifficultyPoint = 7.5
				}
			case "Vận dụng cao":
				if q.DifficultyPoint == 0 {
					q.DifficultyPoint = 9.0
				}
			default:
				if q.DifficultyPoint > 0 {
					if q.DifficultyPoint <= 3.5 {
						q.DifficultyLevel = "Nhận biết"
					} else if q.DifficultyPoint <= 6.5 {
						q.DifficultyLevel = "Thông hiểu"
					} else if q.DifficultyPoint <= 8.5 {
						q.DifficultyLevel = "Vận dụng"
					} else {
						q.DifficultyLevel = "Vận dụng cao"
					}
				} else {
					q.DifficultyLevel = "Thông hiểu"
					q.DifficultyPoint = 5.0
				}
			}

			// Chuẩn hóa Point: nếu không gửi kèm bảng điểm thì mỗi câu đơn 1 điểm, mỗi câu con 1 điểm
			if q.Point <= 0 {
				q.Point = 1
			}

			// Chuẩn hóa Tags: nếu chưa có, thêm ít nhất 1 tag chính là Topic
			if len(q.Tags) == 0 {
				if q.Topic != "" {
					q.Tags = []string{q.Topic}
				} else {
					q.Tags = []string{}
				}
			}

			if q.Options == nil {
				q.Options = []string{}
			}

			// Đồng bộ 2 chiều giữa ShortAnswer và QuickSolveTips
			if q.ShortAnswer == "" && q.QuickSolveTips != "" {
				q.ShortAnswer = q.QuickSolveTips
			} else if q.QuickSolveTips == "" && q.ShortAnswer != "" {
				q.QuickSolveTips = q.ShortAnswer
			}

			// Đảm bảo solution_guide không bị null và bọc công thức nếu có
			if q.SolutionGuide == nil {
				q.SolutionGuide = map[string]interface{}{
					"steps":      []interface{}{},
					"conclusion": "",
				}
			} else if solMap, ok := q.SolutionGuide.(map[string]interface{}); ok {
				if steps, ok := solMap["steps"].([]interface{}); ok {
					for _, stepItem := range steps {
						if stepMap, ok := stepItem.(map[string]interface{}); ok {
							if formula, ok := stepMap["formula"].(string); ok && strings.TrimSpace(formula) != "" && strings.TrimSpace(formula) != "null" {
								stepMap["formula"] = EnsureMathDelimiters(formula)
							}
						}
					}
				}
			}
		}

		for _, diag := range rb.Diagrams {
			if diag.Placeholder == "" || len(diag.Box2D) < 4 {
				continue
			}

			if diag.ImageIndex >= 0 && diag.ImageIndex < len(sourceImages) && sourceImages[diag.ImageIndex] != nil {
				srcImg := sourceImages[diag.ImageIndex]
				croppedUrl, err := utils.CropDiagram(srcImg, diag.Box2D, tempDir)
				if err == nil && croppedUrl != "" {
					imgTag := fmt.Sprintf(`<img src="%s" alt="Hình vẽ" class="max-w-md mx-auto my-3 rounded-xl border border-slate-200" />`, croppedUrl)

					if sharedContent != nil {
						updated := strings.ReplaceAll(*sharedContent, diag.Placeholder, imgTag)
						sharedContent = &updated
					}

					for qIdx := range rb.Questions {
						q := &rb.Questions[qIdx]
						q.Content = strings.ReplaceAll(q.Content, diag.Placeholder, imgTag)
						if solStr, ok := q.SolutionGuide.(string); ok {
							q.SolutionGuide = strings.ReplaceAll(solStr, diag.Placeholder, imgTag)
						} else if solMap, ok := q.SolutionGuide.(map[string]interface{}); ok {
							if conclusion, ok := solMap["conclusion"].(string); ok {
								solMap["conclusion"] = strings.ReplaceAll(conclusion, diag.Placeholder, imgTag)
							}
							if steps, ok := solMap["steps"].([]interface{}); ok {
								for _, stepItem := range steps {
									if stepMap, ok := stepItem.(map[string]interface{}); ok {
										if content, ok := stepMap["content"].(string); ok {
											stepMap["content"] = strings.ReplaceAll(content, diag.Placeholder, imgTag)
										}
										if formula, ok := stepMap["formula"].(string); ok {
											stepMap["formula"] = strings.ReplaceAll(formula, diag.Placeholder, imgTag)
										}
									}
								}
							}
						}
					}
				}
			}
		}

		blocks[bIdx] = ExtractedQuestionBlock{
			SharedContent: sharedContent,
			TypeQuestion:  tq,
			Questions:     rb.Questions,
		}
	}

	return blocks, nil
}

// ExtractQuestionsFromImages calls Gemini Vision to extract math questions across multiple exam images
func ExtractQuestionsFromImages(files [][]byte, mimeTypes []string, targetGradeStr ...string) ([]ExtractedQuestionBlock, error) {
	apiKey := os.Getenv("GEMINI_API_KEY")
	if apiKey == "" {
		return nil, fmt.Errorf("GEMINI_API_KEY is not configured")
	}

	targetGradeInt := 0
	if len(targetGradeStr) > 0 && targetGradeStr[0] != "" {
		if g, err := strconv.Atoi(strings.TrimSpace(targetGradeStr[0])); err == nil {
			targetGradeInt = g
		}
	}

	primaryModel := os.Getenv("GEMINI_MODEL")
	if primaryModel == "" {
		primaryModel = "gemini-3.5-flash-lite"
	}

	validModels := []string{
		"gemini-3.5-flash-lite",
		"gemini-3.5-flash",
		"gemini-flash-latest",
		"gemini-2.5-flash",
		"gemini-3.6-flash",
		"gemini-3.7-flash",
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

	gradeHint := ""
	if targetGradeInt >= 5 && targetGradeInt <= 9 {
		gradeHint = fmt.Sprintf("\nLƯU Ý KHỐI LỚP: Người dùng yêu cầu bóc tách câu hỏi cho LỚP %d. Bạn BẮT BUỘC đặt \"grade\": %d cho TẤT CẢ các câu hỏi và CHỈ ĐƯỢC CHỌN 1 \"topic\" duy nhất từ danh mục chủ đề của Lớp %d dưới đây.\n", targetGradeInt, targetGradeInt, targetGradeInt)
	}

	prompt := fmt.Sprintf(`Bạn là chuyên gia biên tập và số hóa đề thi Toán học Việt Nam.
Hãy đọc các trang ảnh đề thi đính kèm (theo thứ tự từ trang đầu đến trang cuối) và bóc tách TOÀN BỘ các câu hỏi có trong tài liệu thành định dạng JSON chuẩn.
%s
HỆ THỐNG CHỦ ĐỀ CHUẨN THEO TỪNG KHỐI LỚP (BẮT BUỘC CHỌN 1 VÀ CHỈ 1 CHỦ ĐỀ CHÍNH XÁC PHÙ HỢP NHẤT TƯƠNG ỨNG VỚI KHỐI LỚP, TUYỆT ĐỐI KHÔNG TỰ NGHĨ TÊN KHÁC):
- Lớp 9: Phương trình bậc nhất hai ẩn, Hệ hai phương trình bậc nhất hai ẩn, Hàm số y = ax^2 (a khác 0), Đồ thị hàm số bậc hai đơn giản, Công thức nghiệm phương trình bậc hai, Định lý Viète và ứng dụng, Tỉ số lượng giác của góc nhọn, Hệ thức giữa cạnh và góc, Sự xác định đường tròn và vị trí tương đối, Góc với đường tròn (Góc nội tiếp, góc ở tâm), Hình trụ, Hình nón, Hình cầu
- Lớp 8: Đơn thức và đa thức nhiều biến, Các phép tính với đa thức, Hằng đẳng thức đáng nhớ, Khái niệm phân thức, Các phép toán cộng, trừ, nhân, chia phân thức, Khái niệm hàm số, Hàm số bậc nhất y = ax + b, Hệ số góc của đường thẳng, Cách giải phương trình bậc nhất một ẩn, Giải bài toán bằng cách lập phương trình, Định lý Thalès thuận và đảo, Đường trung bình của tam giác, Các trường hợp đồng dạng của tam giác, Tam giác vuông đồng dạng, Hình chóp tam giác đều, Hình chóp tứ giác đều
- Lớp 7: Tập hợp số hữu tỉ, Căn bậc hai số học và số thực, Tỉ lệ thức và tính chất dãy tỉ số bằng nhau, Đại lượng tỉ lệ thuận, tỉ lệ nghịch, Biểu thức đại số, Đa thức một biến và nghiệm của đa thức, Hai góc kề bù, đối đỉnh, Dấu hiệu hai đường thẳng song song, Tổng các góc trong một tam giác, Tam giác bằng nhau (c.c.c, c.g.c, g.c.g), Tam giác cân và định lý Pythagoras, Làm quen với xác suất của biến cố ngẫu nhiên
- Lớp 6: Tập hợp số tự nhiên, Tính chất chia hết và ước số, Tập hợp số nguyên và phép tính, Phân số bằng nhau và rút gọn, Các phép tính với số thập phân, Hình vuông, tam giác đều, lục giác đều, Hình chữ nhật, hình thoi, hình bình hành, Hình có trục đối xứng, Hình có tâm đối xứng, Điểm, đường thẳng, đoạn thẳng, Trung điểm của đoạn thẳng, Góc và số đo góc
- Lớp 5: Phân số thập phân và hỗn số, Số thập phân và các phép toán, Diện tích hình tam giác, hình thang, Chu vi và diện tích hình tròn, Hình hộp chữ nhật, hình lập phương, Hình trụ, hình cầu, Đo thể tích và chuyển đổi đơn vị, Toán chuyển động đều, Giải toán tỉ số phần trăm

QUY TẮC BÓC TÁCH VÀ TỰ ĐỘNG GIẢI TOÁN BẮT BUỘC CHO MỖI CÂU HỎI:
1. "shared_content": Chuỗi nội dung dẫn chung (nếu là câu hỏi chùm) hoặc null (nếu là câu hỏi đơn lẻ).
2. "type_question": string ('group' cho câu hỏi chùm | 'single' cho câu hỏi đơn).
   TUYỆT ĐỐI KHÔNG TẠO TRƯỜNG "is_group" TRONG ĐẦU RA JSON. Cấu trúc mỗi block CHỈ gồm đúng 3 trường: "shared_content", "type_question", "questions".
3. QUY TẮC BẮT BUỘC VỀ CÔNG THỨC TOÁN HỌC (TUYỆT ĐỐI KHÔNG CÓ TRƯỜNG NGOẠI LỆ):
   - BẮT BUỘC 100%% TẤT CẢ các công thức toán học, biểu thức, phương trình, hệ phương trình, ký hiệu, phân số, căn thức, biến số và đáp số toán học trong TOÀN BỘ file JSON (trong "content", từng phương án trong "options", "correct_answer", "formula", "conclusion", "hint", "short_answer") ĐỀU PHẢI ĐƯỢC BỌC TRONG CẶP DẤU $...$ (hoặc $$...$$).
   - KÝ HIỆU GÓC HÌNH HỌC: BẮT BUỘC dùng dấu mũ trên đỉnh chữ cái theo cú pháp LaTeX chuẩn: dùng \hat{A}, \hat{B}, \hat{C} cho góc 1 chữ cái hoặc \widehat{ABC}, \widehat{xOy} cho góc 3 chữ cái (ví dụ: \hat{A} = \hat{C}, \widehat{ABC} = 60^\circ). TUYỆT ĐỐI KHÔNG dùng \angle hoặc ký tự Unicode ∠.
   - Tuyệt đối không để biểu thức hay đáp án toán trần trụi không có dấu $...$.
     Ví dụ ĐÚNG:
     "options": ["$x = 2; x = 3$", "$x = 1; x = 6$", "$x = -2; x = -3$", "Vô nghiệm"],
     "correct_answer": "$x = 2; x = 3$",
     "formula": "$S = x_1 + x_2 = 5, \\quad P = x_1 x_2 = 6$"
     Ví dụ SAI (cấm):
     "options": ["x = 2; x = 3", "x = 1; x = 6"], "correct_answer": "x = 2; x = 3"
4. "content": Nội dung câu hỏi bằng LaTeX (Không bao gồm phương án lựa chọn A, B, C, D). Mọi biểu thức/ký hiệu toán học BẮT BUỘC phải viết bằng LaTeX chuẩn ($...$ hoặc $$...$$) để hiển thị đẹp bằng KaTeX.
5. "type": string (Chỉ chọn một trong hai: 'Trắc nghiệm' hoặc 'Tự luận').
6. "grade": int (Chỉ chọn một trong các số: 5, 6, 7, 8, 9).
7. "topic": string (Tùy theo khối lớp và nội dung câu hỏi, chọn 1 và chỉ 1 chủ đề tương ứng lớp và phù hợp nhất trong danh mục chủ đề ở trên).
8. "difficulty_level": string (Chỉ chọn một trong: 'Nhận biết', 'Thông hiểu', 'Vận dụng', 'Vận dụng cao').
9. "difficulty_point": float (Từ 0.0 đến 10.0: Nhận biết = 2.5, Thông hiểu = 5.0, Vận dụng = 7.5, Vận dụng cao = 9.0).
10. "point": int, nếu không gửi kèm bảng điểm thì mỗi câu đơn 1 điểm, câu hỏi chùm bằng số câu con.
11. "tags": Mảng các từ_khóa chuyên môn (ví dụ: ["Phương trình bậc hai", "Định lý Viète"]).
12. "options": Mảng các phương án lựa chọn bằng LaTeX (CHỈ LẤY NỘI DUNG, loại bỏ hoàn toàn tiền tố nhãn A., B., C., D.), để trống [] nếu là tự luận. Với Trắc nghiệm: đúng 4 phương án [A, B, C, D]. BẮT BUỘC tất cả công thức/biểu thức toán học phải bọc trong $...$.
13. "correct_answer": Đáp án đúng bằng LaTeX bọc trong $...$.
    - BẮT BUỘC LUÔN PHẢI TRẢ VỀ GIÁ TRỊ, TUYỆT ĐỐI KHÔNG ĐƯỢC ĐỂ TRỐNG HOẶC NULL.
    - NẾU tài liệu ảnh CÓ SẴN đáp án mẫu hoặc khoanh sẵn: trích xuất đáp án đúng đó.
    - NẾU tài liệu ảnh KHÔNG CÓ đáp án mẫu: AI BẮT BUỘC PHẢI TỰ GIẢI TOÁN để tìm ra đáp án đúng chính xác tuyệt đối!
    - Với Trắc nghiệm: BẮT BUỘC điền nội dung phương án đúng khớp chính xác với 1 trong 4 phương án trong "options" (ví dụ: "$x = 2$"). Biểu thức toán phải ở dạng LaTeX chuẩn ($...$).
    - Với Tự luận: BẮT BUỘC điền kết quả / đáp số cuối cùng của bài toán dưới dạng LaTeX chuẩn ($...$, ví dụ: "$x = 3$").
14. "solution_guide": Cấu trúc object chi tiết từng bước:
    - "steps": Mảng các bước giải, mỗi bước có:
      + "step": int (1, 2, 3...)
      + "title": string (Tên bước thực hiện ngắn gọn)
      + "content": string (Nội dung giải thích ngắn gọn bằng chữ, dùng ký hiệu • để đầu dòng khi liệt kê, tuyệt đối không dùng + hoặc -, không có ký tự xuống dòng, dùng <br> nếu muốn ngắt dòng)
      + "formula": string (Biểu thức LaTeX của bước này bọc trong $...$, nhưng không lặp lại Biểu thức đã có trên trường content hoặc null nếu không có)
    - "conclusion": string (Nội dung kết luận/đáp số cuối cùng)
15. "hint": Chỉ dẫn nhỏ, gợi nhớ công thức hoặc hướng tiếp cận bài toán.
16. "short_answer": Lời giải ngắn gọn, cô đọng nhất giúp học sinh nhìn vào là biết ngay cách giải bài toán. Nếu đề bài/tài liệu gốc có sẵn đáp án mẫu hoặc lời giải vắn tắt thì trích xuất vào; nếu không có thì AI bắt buộc phải tự giải và sinh ra lời giải ngắn gọn, súc tích nhất.
17. "general_method": Công thức tổng quát hóa cho dạng bài toán này.
18. "mistakes": Các lỗi sai học sinh thường vấp phải.
19. Bảng biến thiên, Bảng xét dấu hoặc Bảng số liệu: HÃY chuyển đổi trực tiếp thành bảng HTML (thẻ <table>, <tr>, <td>) hoặc bảng Markdown rõ ràng, KHÔNG cắt thành ảnh.
20. Với Hình vẽ hình học (hình học phẳng, hình không gian) và Đồ thị hàm số trên hệ trục Oxy:
    - Điền mã định danh vào vị trí tương ứng trong đề bài hoặc lời giải, ví dụ: [DIAGRAM_0_1] (0 là chỉ số trang ảnh 0-indexed, 1 là thứ tự hình).
    - Khai báo thông tin vào mảng "diagrams" với tọa độ chuẩn hóa box_2d [ymin, xmin, ymax, xmax] (thang đo 0-1000).
21. CẤU TRÚC ĐẦU RA JSON MẪU (OUTPUT SCHEMA - TUYỆT ĐỐI KHÔNG CÓ TRƯỜNG "is_group"):
[
  {
    "shared_content": "Chuỗi nội dung dẫn chung (nếu là câu hỏi chùm) hoặc null (nếu là câu hỏi đơn lẻ)",
    "type_question": "string ('group' cho câu hỏi chùm | 'single' cho câu hỏi đơn)",
    "questions": [
      {
        "content": "Nội dung câu hỏi bằng LaTeX: Cho phương trình $x^2 - 5x + 6 = 0$...",
        "type": "string (Chỉ chọn một trong hai: 'Trắc nghiệm' hoặc 'Tự luận')",
        "grade": 9,
        "topic": "Định lý Viète và ứng dụng",
        "difficulty_level": "string (Chỉ chọn một trong: 'Nhận biết', 'Thông hiểu', 'Vận dụng', 'Vận dụng cao')",
        "difficulty_point": 5.0,
        "point": 1,
        "tags": ["Phương trình bậc hai", "Định lý Viète"],
        "options": ["$x = 2; x = 3$", "$x = 1; x = 6$", "$x = -2; x = -3$", "Vô nghiệm"],
        "correct_answer": "$x = 2; x = 3$",
        "solution_guide": {
          "steps": [
            {
              "step": 1,
              "title": "Áp dụng định lý Viète",
              "content": "Tính tổng và tích các nghiệm của phương trình:",
              "formula": "$S = x_1 + x_2 = 5, \\quad P = x_1 x_2 = 6$"
            },
            {
              "step": 2,
              "title": "Tìm nghiệm",
              "content": "Các nghiệm của phương trình là:",
              "formula": "$x_1 = 2, \\quad x_2 = 3$"
            }
          ],
          "conclusion": "Vậy phương trình có hai nghiệm là $x = 2$ và $x = 3$."
        },
        "hint": "Chỉ dẫn nhỏ, gợi nhớ công thức hoặc hướng tiếp cận bài toán",
        "short_answer": "Lời giải ngắn gọn, cô đọng nhất giúp học sinh nhìn vào là biết cách giải",
        "general_method": "Công thức tổng quát hóa cho dạng bài toán này",
        "mistakes": "Các lỗi sai học sinh thường vấp phải"
      }
    ]
  }
]
CHỈ trả về DUY NHẤT chuỗi JSON hợp lệ (mảng các block), tuyệt đối KHÔNG kèm lời chào hay giải thích nào khác ngoài JSON.
22. QUY TẮC ĐẶC BIỆT VỀ DẤU GẠCH CHÉO NGƯỢC (\) TRONG JSON:
    - Trong chuỗi JSON, mọi dấu gạch chéo ngược (\) của công thức LaTeX (ví dụ: \frac, \sqrt, \quad, \pm, \left, \right) PHẢI ĐƯỢC ESCAPE thành hai dấu gạch chéo ngược (ví dụ: "\\frac", "\\sqrt", "\\quad", "\\pm").`, gradeHint)

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
			if resp.StatusCode == http.StatusServiceUnavailable || resp.StatusCode == http.StatusTooManyRequests {
				log.Printf("[AI Question Extractor] Model %s is busy/unavailable (status %d). Waiting 1s and switching to next model...", currentModel, resp.StatusCode)
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

	return ParseAndProcessExtractedBlocks(rawJSON, decodedImages, "./uploads/temp", targetGradeInt)
}
