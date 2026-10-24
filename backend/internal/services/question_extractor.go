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

// DiagramAlertBadge là dòng chữ thông báo màu đỏ báo hiệu vị trí hình vẽ để giáo viên chèn ảnh chuẩn nét
const DiagramAlertBadge = `<p class="diagram-placeholder text-rose-600 font-bold my-2" style="color: #e11d48; font-weight: 700;">(Chèn hình ảnh tại đây)</p>`

type DiagramInfo struct {
	ImageIndex  int       `json:"image_index"`
	Box2D       []float64 `json:"box_2d"` // [ymin, xmin, ymax, xmax]
	Placeholder string    `json:"placeholder"`
	ID          string    `json:"id,omitempty"`
	Tag         string    `json:"tag,omitempty"`
	Name        string    `json:"name,omitempty"`
}

func (d *DiagramInfo) GetPlaceholder() string {
	if d.Placeholder != "" {
		return d.Placeholder
	}
	if d.ID != "" {
		return d.ID
	}
	if d.Tag != "" {
		return d.Tag
	}
	if d.Name != "" {
		return d.Name
	}
	return ""
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

type SolutionGuideStep struct {
	Step    int     `json:"step"`
	Title   string  `json:"title"`
	Content string  `json:"content"`
	Formula string  `json:"formula,omitempty"`
	Point   float32 `json:"point,omitempty"`
}

type StructuredSolutionGuide struct {
	DiagramSVG *string             `json:"diagram_svg,omitempty"`
	Steps      []SolutionGuideStep `json:"steps"`
	Conclusion string              `json:"conclusion"`
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
	DiagramSVG      *string     `json:"diagram_svg,omitempty"`
}

type rawGeminiQuestion struct {
	ExtractedQuestionItem
	Diagrams   []DiagramInfo `json:"diagrams,omitempty"`
	DiagramSVG *string       `json:"diagram_svg,omitempty"`
}

type ExtractedQuestionBlock struct {
	SharedContent *string                 `json:"shared_content"`
	DiagramSVG    *string                 `json:"diagram_svg,omitempty"`
	TypeQuestion  string                  `json:"type_question"`
	Questions     []ExtractedQuestionItem `json:"questions"`
}

type rawGeminiBlock struct {
	SharedContent *string             `json:"shared_content"`
	DiagramSVG    *string             `json:"diagram_svg,omitempty"`
	TypeQuestion  string              `json:"type_question"`
	IsGroup       *bool               `json:"is_group,omitempty"`
	Point         *FlexibleInt        `json:"point,omitempty"`
	Questions     []rawGeminiQuestion `json:"questions"`
	Diagrams      []DiagramInfo       `json:"diagrams,omitempty"`
}

var (
	rxFraction               = regexp.MustCompile(`^[+-]?\d+\s*/\s*\d+$`)
	rxMathChars              = regexp.MustCompile(`[+\-*\/=<>≤≥≠;]`)
	rxQuestionPrefixWithP    = regexp.MustCompile(`^(<p(?:\s+[^>]*)?>)\s*(?:<strong[^>]*>|<b[^>]*>|\*\*)?\s*(?:[Cc][Ââ][Uu]|[Bb][Àà][Ii])\s+\d+(?:[a-zA-Z]|\.[a-zA-Z])?(?:<\/strong>|<\/b>|\*\*)?\s*(?:[\.:\)\-]+\s*(?:<\/strong>|<\/b>|\*\*)?\s*|\s+)`)
	rxQuestionPrefixWithoutP = regexp.MustCompile(`^\s*(?:<strong[^>]*>|<b[^>]*>|\*\*)?\s*(?:[Cc][Ââ][Uu]|[Bb][Àà][Ii])\s+\d+(?:[a-zA-Z]|\.[a-zA-Z])?(?:<\/strong>|<\/b>|\*\*)?\s*(?:[\.:\)\-]+\s*(?:<\/strong>|<\/b>|\*\*)?\s*|\s+)`)
)

// CleanQuestionPrefix loại bỏ các tiền tố đánh số câu hỏi như "Câu 18.", "Câu 1:", "Bài 5.", "**Câu 18.**", "<p>Câu 18.</p>"
func CleanQuestionPrefix(s string) string {
	trimmed := strings.TrimSpace(s)
	if trimmed == "" {
		return ""
	}
	if rxQuestionPrefixWithP.MatchString(trimmed) {
		return rxQuestionPrefixWithP.ReplaceAllString(trimmed, "$1")
	}
	return rxQuestionPrefixWithoutP.ReplaceAllString(trimmed, "")
}

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

// cleanAndAppendDiagram loại bỏ placeholder khỏi giữa câu văn và nối ảnh vào cuối nội dung
func cleanAndAppendDiagram(text string, placeholder string, imgTag string) string {
	cleaned := text
	if placeholder != "" && strings.Contains(text, placeholder) {
		cleaned = strings.ReplaceAll(text, placeholder, "")
		// Dọn dẹp khoảng trắng thừa trước dấu câu (ví dụ: "600m [DIAGRAM_0_0]. Khoảng cách" -> "600m. Khoảng cách")
		rxPunct := regexp.MustCompile(`[ \t]+([.,;?!])`)
		cleaned = rxPunct.ReplaceAllString(cleaned, "$1")
		// Thu gọn khoảng trắng liên tiếp
		rxSpaces := regexp.MustCompile(`[ \t]{2,}`)
		cleaned = rxSpaces.ReplaceAllString(cleaned, " ")
	}
	cleaned = strings.TrimSpace(cleaned)
	if imgTag == "" {
		return cleaned
	}
	if cleaned == "" {
		return imgTag
	}
	if strings.Contains(cleaned, imgTag) {
		return cleaned
	}
	return cleaned + "\n" + imgTag
}

// cleanSVG chuẩn hóa mã SVG, hỗ trợ bóc tách khỏi khối mã markdown ```xml ... ``` hoặc ```svg ... ```
func cleanSVG(s string) string {
	trimmed := strings.TrimSpace(s)
	if trimmed == "" || trimmed == "null" {
		return ""
	}

	// 1. Cắt lấy chính xác từ <svg đến </svg> nếu tồn tại
	start := strings.Index(trimmed, "<svg")
	end := strings.LastIndex(trimmed, "</svg>")
	if start != -1 && end != -1 && end >= start {
		return strings.TrimSpace(trimmed[start : end+6])
	}

	// 2. Dọn dẹp khối mã ```xml hoặc ```svg nếu không tìm thấy cặp thẻ đóng mở chuẩn
	if strings.Contains(trimmed, "```") {
		lines := strings.Split(trimmed, "\n")
		var cleanLines []string
		for _, line := range lines {
			tLine := strings.TrimSpace(line)
			if strings.HasPrefix(tLine, "```") {
				continue
			}
			cleanLines = append(cleanLines, line)
		}
		trimmed = strings.TrimSpace(strings.Join(cleanLines, "\n"))
	}

	return trimmed
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

		tq := "single"
		var sharedContent *string = nil

		if len(rb.Questions) > 1 {
			isGroup := (rb.IsGroup != nil && *rb.IsGroup) || strings.EqualFold(rb.TypeQuestion, "group") || (rb.SharedContent != nil && strings.TrimSpace(*rb.SharedContent) != "")
			if isGroup {
				tq = "group"
				if rb.SharedContent != nil && strings.TrimSpace(*rb.SharedContent) != "" {
					cleaned := CleanQuestionPrefix(*rb.SharedContent)
					sharedContent = &cleaned
				}
			}
		} else if len(rb.Questions) == 1 && rb.SharedContent != nil && strings.TrimSpace(*rb.SharedContent) != "" {
			// Nếu chỉ có 1 câu hỏi nhưng AI tách đoạn dẫn chuyện vào shared_content (như bài toán thực tế Câu 9),
			// tự động gộp shared_content vào đầu content của câu hỏi đó và chuyển về câu đơn ('single').
			sc := CleanQuestionPrefix(strings.TrimSpace(*rb.SharedContent))
			qc := CleanQuestionPrefix(strings.TrimSpace(rb.Questions[0].Content))
			if qc == "" {
				rb.Questions[0].Content = sc
			} else if !strings.Contains(qc, sc) {
				rb.Questions[0].Content = sc + "\n" + qc
			} else {
				rb.Questions[0].Content = qc
			}
			rb.SharedContent = nil
			sharedContent = nil
		}

		// Hậu xử lý từng câu hỏi trong block
		for qIdx := range rb.Questions {
			q := &rb.Questions[qIdx]
			q.Content = CleanQuestionPrefix(q.Content)

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
			} else if q.ShortAnswer == "" && q.QuickSolveTips == "" {
				// Fallback: nếu AI không trả về, trích xuất ngắn gọn từ bước giải hoặc kết luận
				if solMap, ok := q.SolutionGuide.(map[string]interface{}); ok {
					conclusion, _ := solMap["conclusion"].(string)
					steps, _ := solMap["steps"].([]interface{})
					if len(steps) > 0 {
						if step1, ok := steps[0].(map[string]interface{}); ok {
							title, _ := step1["title"].(string)
							formula, _ := step1["formula"].(string)
							var parts []string
							if title != "" {
								parts = append(parts, title)
							}
							if formula != "" {
								parts = append(parts, formula)
							}
							if conclusion != "" {
								parts = append(parts, conclusion)
							}
							if len(parts) > 0 {
								q.ShortAnswer = strings.Join(parts, ": ")
								q.QuickSolveTips = q.ShortAnswer
							}
						}
					} else if conclusion != "" {
						q.ShortAnswer = conclusion
						q.QuickSolveTips = conclusion
					}
				}
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

		var allDiagrams []DiagramInfo
		allDiagrams = append(allDiagrams, rb.Diagrams...)
		for _, q := range rb.Questions {
			allDiagrams = append(allDiagrams, q.Diagrams...)
		}

		rxDiagPlaceholder := regexp.MustCompile(`\[DIAGRAM(?:_\d+_\d+)?\]`)

		if sharedContent != nil {
			// CÂU HỎI CHÙM (GROUP QUESTION):
			// Hình vẽ của bài toán chùm BẮT BUỘC đặt ở shared_content (Nội dung dẫn chung).
			// Các câu hỏi con a, b, c tuyệt đối KHÔNG chứa dòng chữ (Chèn hình ảnh tại đây).
			hasDiagram := len(allDiagrams) > 0 || rxDiagPlaceholder.MatchString(*sharedContent)
			if !hasDiagram {
				for _, q := range rb.Questions {
					if rxDiagPlaceholder.MatchString(q.Content) {
						hasDiagram = true
						break
					}
				}
			}

			if hasDiagram {
				if rxDiagPlaceholder.MatchString(*sharedContent) {
					placeholder := rxDiagPlaceholder.FindString(*sharedContent)
					*sharedContent = cleanAndAppendDiagram(*sharedContent, placeholder, DiagramAlertBadge)
					*sharedContent = rxDiagPlaceholder.ReplaceAllString(*sharedContent, "")
				} else if !strings.Contains(*sharedContent, DiagramAlertBadge) {
					*sharedContent = cleanAndAppendDiagram(*sharedContent, "", DiagramAlertBadge)
				}
			} else {
				// Nếu đề bài trong ảnh không có hình, dọn dẹp mọi placeholder nếu có
				*sharedContent = rxDiagPlaceholder.ReplaceAllString(*sharedContent, "")
			}
			*sharedContent = strings.TrimSpace(*sharedContent)

			// Xóa sạch placeholder hoặc DiagramAlertBadge khỏi các câu hỏi con
			for qIdx := range rb.Questions {
				q := &rb.Questions[qIdx]
				if rxDiagPlaceholder.MatchString(q.Content) {
					placeholder := rxDiagPlaceholder.FindString(q.Content)
					q.Content = cleanAndAppendDiagram(q.Content, placeholder, "")
				}
				q.Content = rxDiagPlaceholder.ReplaceAllString(q.Content, "")
				q.Content = strings.ReplaceAll(q.Content, DiagramAlertBadge, "")
				q.Content = CleanQuestionPrefix(strings.TrimSpace(q.Content))

				if solStr, ok := q.SolutionGuide.(string); ok && rxDiagPlaceholder.MatchString(solStr) {
					q.SolutionGuide = rxDiagPlaceholder.ReplaceAllString(solStr, "")
				}
			}
		} else {
			// CÂU HỎI ĐƠN (SINGLE QUESTION):
			// Chỉ thêm DiagramAlertBadge khi ảnh đề bài gốc thực sự có hình vẽ
			hasDiagram := len(allDiagrams) > 0
			if !hasDiagram {
				for _, q := range rb.Questions {
					if rxDiagPlaceholder.MatchString(q.Content) {
						hasDiagram = true
						break
					}
				}
			}

			if hasDiagram {
				for _, diag := range allDiagrams {
					placeholder := diag.GetPlaceholder()
					if placeholder == "" {
						for _, q := range rb.Questions {
							if match := rxDiagPlaceholder.FindString(q.Content); match != "" {
								placeholder = match
								break
							}
						}
					}
					applied := false
					for qIdx := range rb.Questions {
						q := &rb.Questions[qIdx]
						if placeholder != "" && strings.Contains(q.Content, placeholder) {
							q.Content = cleanAndAppendDiagram(q.Content, placeholder, DiagramAlertBadge)
							applied = true
						}
					}
					if !applied && len(rb.Questions) == 1 {
						rb.Questions[0].Content = cleanAndAppendDiagram(rb.Questions[0].Content, "", DiagramAlertBadge)
					}
				}

				// Thay thế placeholder còn sót lại thành DiagramAlertBadge
				for qIdx := range rb.Questions {
					q := &rb.Questions[qIdx]
					if rxDiagPlaceholder.MatchString(q.Content) {
						q.Content = rxDiagPlaceholder.ReplaceAllString(q.Content, "\n"+DiagramAlertBadge)
					}
					q.Content = CleanQuestionPrefix(strings.TrimSpace(q.Content))
				}
			} else {
				// Không có hình vẽ trong đề gốc: chỉ dọn dẹp các thẻ placeholder orphan
				for qIdx := range rb.Questions {
					q := &rb.Questions[qIdx]
					if rxDiagPlaceholder.MatchString(q.Content) {
						placeholder := rxDiagPlaceholder.FindString(q.Content)
						q.Content = cleanAndAppendDiagram(q.Content, placeholder, "")
					}
					q.Content = rxDiagPlaceholder.ReplaceAllString(q.Content, "")
					q.Content = CleanQuestionPrefix(strings.TrimSpace(q.Content))
				}
			}

			for qIdx := range rb.Questions {
				q := &rb.Questions[qIdx]
				if solStr, ok := q.SolutionGuide.(string); ok && rxDiagPlaceholder.MatchString(solStr) {
					q.SolutionGuide = rxDiagPlaceholder.ReplaceAllString(solStr, "")
				}
			}
		}

		// 1. Chuẩn hóa diagram_svg của từng câu hỏi
		for qIdx := range rb.Questions {
			q := &rb.Questions[qIdx]
			if solMap, ok := q.SolutionGuide.(map[string]interface{}); ok {
				if dSvg, ok := solMap["diagram_svg"].(string); ok && strings.TrimSpace(dSvg) != "" {
					cleaned := cleanSVG(dSvg)
					if cleaned != "" {
						solMap["diagram_svg"] = cleaned
						q.DiagramSVG = &cleaned
					} else {
						solMap["diagram_svg"] = nil
					}
				}
			}
			if q.DiagramSVG == nil && q.ExtractedQuestionItem.DiagramSVG != nil {
				cleaned := cleanSVG(*q.ExtractedQuestionItem.DiagramSVG)
				if cleaned != "" {
					q.DiagramSVG = &cleaned
				}
			}
		}

		// 2. Xác định diagram_svg chung của block:
		// Ưu tiên diagram_svg trên block -> nếu không có thì lấy hình vẽ đầy đủ nhất từ câu hỏi con cuối cùng -> câu đầu tiên
		var blockDiagramSVG *string = rb.DiagramSVG
		if blockDiagramSVG != nil {
			cleaned := cleanSVG(*blockDiagramSVG)
			if cleaned != "" {
				blockDiagramSVG = &cleaned
			} else {
				blockDiagramSVG = nil
			}
		}

		if blockDiagramSVG == nil || *blockDiagramSVG == "" {
			for i := len(rb.Questions) - 1; i >= 0; i-- {
				if rb.Questions[i].DiagramSVG != nil && *rb.Questions[i].DiagramSVG != "" {
					blockDiagramSVG = rb.Questions[i].DiagramSVG
					break
				}
			}
		}

		// 3. Toàn bộ các câu con trong block dùng chung 1 hình bao quát duy nhất:
		for qIdx := range rb.Questions {
			q := &rb.Questions[qIdx]
			if blockDiagramSVG != nil {
				q.DiagramSVG = blockDiagramSVG
				if solMap, ok := q.SolutionGuide.(map[string]interface{}); ok {
					solMap["diagram_svg"] = *blockDiagramSVG
				}
			}
			if q.DiagramSVG != nil {
				q.ExtractedQuestionItem.DiagramSVG = q.DiagramSVG
			}
		}

		finalQuestions := make([]ExtractedQuestionItem, len(rb.Questions))
		for qIdx := range rb.Questions {
			finalQuestions[qIdx] = rb.Questions[qIdx].ExtractedQuestionItem
		}

		blocks[bIdx] = ExtractedQuestionBlock{
			SharedContent: sharedContent,
			DiagramSVG:    blockDiagramSVG,
			TypeQuestion:  tq,
			Questions:     finalQuestions,
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
   - QUY TẮC BẮT BUỘC PHÂN BIỆT CÂU HỎI ĐƠN VÀ CÂU HỎI CHÙM:
     + CÂU HỎI ĐƠN ('single'): Áp dụng cho các câu hỏi độc lập (như Câu 1, Câu 2, ..., Câu 15 trắc nghiệm trong đề thi).
       * BẮT BUỘC mỗi câu hỏi đơn phải là MỘT block riêng biệt trong mảng JSON: {"shared_content": null, "type_question": "single", "questions": [ { ... } ]}.
       * ĐẶC BIỆT LƯU Ý VỚI CÂU HỎI CÓ ĐOẠN MỞ ĐẦU HOẶC BÀI TOÁN THỰC TẾ (ví dụ Câu 9: "Bạn An dự định cắt một miếng bìa... Đa thức biểu thị diện tích..."):
         Dù câu hỏi có đoạn văn mô tả tình huống thực tế hay ngữ cảnh dài, NHƯNG NẾU NÓ CHỈ CÓ 1 YÊU CẦU DUY NHẤT (không chia thành các câu hỏi con a, b, c...), thì ĐÓ 100%% LÀ CÂU HỎI ĐƠN ('single')!
         BẮT BUỘC đặt "shared_content": null, "type_question": "single", và đưa TOÀN BỘ đoạn văn mở đầu cùng câu hỏi vào trường "content".
         TUYỆT ĐỐI KHÔNG TÁCH ĐOẠN MỞ ĐẦU VÀO "shared_content" ĐỂ BIẾN THÀNH 'group'! Block chỉ có 1 câu hỏi KHÔNG BAO GIỜ ĐƯỢC LÀ 'group'!
       * TUYỆT ĐỐI KHÔNG GOM NHIỀU CÂU HỎI ĐƠN VÀO CÙNG MỘT BLOCK! Nếu đề có 15 câu trắc nghiệm độc lập thì đầu ra JSON BẮT BUỘC là một mảng gồm 15 block riêng biệt.
       * Các tiêu đề phân phần của đề thi (như "I. PHẦN TRẮC NGHIỆM", "II. TỰ LUẬN", "Phần 1: 5.0 điểm") KHÔNG PHẢI là câu hỏi chùm, TUYỆT ĐỐI KHÔNG dùng tiêu đề phần để tạo block 'group'.
     + CÂU HỎI CHÙM ('group'): BẮT BUỘC CHỈ ĐƯỢC DÙNG KHI CÓ TỪ 2 CÂU HỎI CON TRỞ LÊN (mảng "questions" có từ 2 phần tử trở lên, ví dụ: câu a và câu b, hoặc câu 1 và câu 2...) CÙNG DÙNG CHUNG một đoạn văn bản ngữ cảnh, bảng biểu hoặc bài toán gốc được đặt trong "shared_content" (ví dụ: "Cho tam giác ABC... Hãy trả lời các câu sau: a) ..., b) ..."). Khi đó "shared_content" KHÔNG ĐƯỢC để null.
       * NẾU CHỈ CÓ 1 CÂU HỎI DUY NHẤT, TUYỆT ĐỐI KHÔNG ĐƯỢC ĐỂ "type_question": "group"!
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
4. "content": Nội dung câu hỏi bằng LaTeX:
   - TUYỆT ĐỐI LOẠI BỎ TOÀN BỘ TIỀN TỐ ĐÁNH SỐ CÂU HỎI như "Câu 1.", "Câu 18.", "Câu 18:", "Bài 1.", "Bài 18:" ở đầu câu hỏi vì hệ thống quản lý đề thi sẽ tự động đánh số thứ tự. Chỉ lấy phần câu hỏi thực sự bắt đầu sau số câu (ví dụ: đề gốc ghi "Câu 18. Cho đa thức A = ..." thì chỉ lấy "Cho đa thức A = ...").
   - KHÔNG bao gồm các phương án lựa chọn A, B, C, D (các phương án phải đưa vào trường "options").
   - Mọi biểu thức/ký hiệu toán học BẮT BUỘC phải viết bằng LaTeX chuẩn ($...$ hoặc $$...$$) để hiển thị đẹp bằng KaTeX.
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
    - "diagram_svg": Luôn gán null (tuyệt đối KHÔNG sinh mã SVG trong quá trình bóc tách đề thi để tối ưu tốc độ và tiết kiệm token; hình minh họa bài toán sẽ được tạo riêng khi người dùng yêu cầu).
    - "steps": Mảng các bước giải, mỗi bước có:
      + "step": int (1, 2, 3...)
      + "title": string (Tên bước thực hiện ngắn gọn)
      + "content": string (Nội dung giải thích ngắn gọn bằng chữ, dùng ký hiệu • để đầu dòng khi liệt kê, tuyệt đối không dùng + hoặc -, không có ký tự xuống dòng, dùng <br> nếu muốn ngắt dòng)
      + "formula": string (Biểu thức LaTeX của bước này bọc trong $...$, nhưng không lặp lại Biểu thức đã có trên trường content hoặc null nếu không có)
      + "point": float (Thang điểm cho bước này. BẮT BUỘC tổng điểm các bước giải phải bằng điểm của câu hỏi "point", ví dụ câu 1 điểm thì bước 1 là 0.5, bước 2 là 0.5; câu 2 điểm thì bước 1 là 1.0, bước 2 là 1.0)
    - "conclusion": string (Nội dung kết luận/đáp số cuối cùng)
15. "hint": Chỉ dẫn nhỏ, gợi nhớ công thức hoặc hướng tiếp cận bài toán.
16. "short_answer": Lời giải ngắn gọn kèm lời giải thích ngắn súc tích (1-2 câu) giúp học sinh hiểu ngay bản chất và lý do chọn đáp án:
    - BẮT BUỘC PHẢI CÓ LỜI GIẢI THÍCH NGẮN: Nêu mấu chốt lập luận, định lý/công thức áp dụng và các bước tính toán cô đọng nhất, TUYỆT ĐỐI KHÔNG CHỈ GHI MỖI ĐÁP SỐ HOẶC CÔNG THỨC TRƠ TRỌI.
    - Với Trắc nghiệm: Nêu ngắn gọn lý do chọn đáp án đúng (ví dụ: "Áp dụng định lý Pythagoras: $BC = \sqrt{600^2 + 450^2} = 750\text{m}$. Do đó chọn đáp án C.").
    - Với Tự luận: Tóm tắt 1-2 dòng giải thích mấu chốt giải và đáp số (ví dụ: "Thay $x = 2$ vào biểu thức ta được $A = 2^2 + 3 \cdot 2 - 1 = 9$.").
    - Đồng thời gán giá trị này cho cả "quick_solve_tips".
17. "general_method": Công thức tổng quát hóa cho dạng bài toán này.
18. "mistakes": Các lỗi sai học sinh thường vấp phải.
19. Bảng biến thiên, Bảng xét dấu hoặc Bảng số liệu: HÃY chuyển đổi trực tiếp thành bảng HTML (thẻ <table>, <tr>, <td>) hoặc bảng Markdown rõ ràng, KHÔNG cắt thành ảnh.
20. QUY TẮC PHÁT HIỆN HÌNH VẼ CỦA ĐỀ BÀI (HÌNH CÓ SẴN TRONG ẢNH TẢI LÊN):
    - CHỈ KHI TRONG ẢNH ĐỀ BÀI GỐC CÓ IN SẴN HÌNH VẼ, HÌNH HỌC, ĐỒ THỊ HOẶC BẢNG MINH HỌA ĐI KÈM ĐỀ:
      + Mới được đặt placeholder [DIAGRAM] và khai báo trong mảng "diagrams": [{"placeholder": "[DIAGRAM]"}].
      + VỚI CÂU HỎI CHÙM ('group'): BẮT BUỘC đặt [DIAGRAM] ở CUỐI CÙNG của "shared_content" (Nội dung dẫn chung). TUYỆT ĐỐI KHÔNG đặt [DIAGRAM] trong "content" của các câu hỏi con a, b, c... (vì toàn bộ các câu hỏi con đều dùng chung hình ảnh đặt tại phần dẫn chung).
      + VỚI CÂU HỎI ĐƠN ('single'): Đặt [DIAGRAM] ở CUỐI CÙNG của trường "content".
    - NẾU ĐỀ BÀI TRONG ẢNH LÀ DẠNG THUẦN CHỮ (bài toán mô tả bằng lời văn, KHÔNG có in sẵn hình vẽ trong ảnh đề bài):
      + TUYỆT ĐỐI KHÔNG ĐƯỢC chèn [DIAGRAM] vào "content" hay "shared_content"!
      + TUYỆT ĐỐI KHÔNG khai báo mảng "diagrams" (để mảng rỗng [] hoặc bỏ qua)!
      + Hệ thống sẽ KHÔNG chèn dòng chữ '(Chèn hình ảnh tại đây)' nếu đề bài gốc không có in sẵn hình.
21. CẤU TRÚC ĐẦU RA JSON MẪU (OUTPUT SCHEMA - TUYỆT ĐỐI KHÔNG CÓ TRƯỜNG "is_group"):
[
  {
    "shared_content": null,
    "type_question": "single",
    "diagrams": [
      {
        "placeholder": "[DIAGRAM]"
      }
    ],
    "questions": [
      {
        "content": "Nhà bạn An (vị trí A trên hình vẽ) cách nhà bạn Châu 600m và cách nhà bạn Bình 450m. Biết rằng 3 vị trí... Khoảng cách từ nhà Bình đến nhà Châu bằng:\n[DIAGRAM]",
        "type": "Trắc nghiệm",
        "grade": 8,
        "topic": "Định lý Pythagore",
        "difficulty_level": "Thông hiểu",
        "difficulty_point": 5.0,
        "point": 1,
        "tags": ["Tam giác vuông", "Pythagore"],
        "options": ["$725\\text{m}$", "$705\\text{m}$", "$750\\text{m}$", "$725$"],
        "correct_answer": "$750\\text{m}$",
        "solution_guide": {
          "diagram_svg": null,
          "steps": [
            {
              "step": 1,
              "title": "Áp dụng định lý Pythagore",
              "content": "Áp dụng định lý Pythagore vào tam giác vuông:",
              "formula": "$BC = \\sqrt{600^2 + 450^2} = 750\\text{m}$",
              "point": 1.0
            }
          ],
          "conclusion": "Vậy khoảng cách bằng $750\\text{m}$."
        },
        "hint": "Áp dụng định lý Pythagore cho tam giác vuông",
        "short_answer": "Áp dụng định lý Pythagoras cho tam giác vuông: $BC = \\sqrt{600^2 + 450^2} = 750\\text{m}$. Do đó khoảng cách bằng $750\\text{m}$.",
        "general_method": "Sử dụng định lý Pythagore",
        "mistakes": "Nhầm cạnh huyền với cạnh góc vuông"
      }
    ]
  },
  {
    "shared_content": "Cho tam giác $ABC$ vuông tại $A$, đường cao $AH$. Biết $AB = 6\\text{ cm}$, $AC = 8\\text{ cm}$.\n[DIAGRAM]",
    "type_question": "group",
    "diagrams": [
      {
        "placeholder": "[DIAGRAM]"
      }
    ],
    "questions": [
      {
        "content": "Tính độ dài cạnh huyền $BC$.",
        "type": "Tự luận",
        "grade": 9,
        "topic": "Hệ thức giữa cạnh và góc",
        "difficulty_level": "Nhận biết",
        "difficulty_point": 2.5,
        "point": 1,
        "tags": ["Hệ thức lượng", "Tam giác vuông"],
        "options": [],
        "correct_answer": "$BC = 10\\text{ cm}$",
        "solution_guide": {
          "diagram_svg": null,
          "steps": [
            {
              "step": 1,
              "title": "Áp dụng định lý Pythagoras",
              "content": "Áp dụng định lý Pythagoras vào tam giác $ABC$ vuông tại $A$:",
              "formula": "$BC^2 = AB^2 + AC^2 = 6^2 + 8^2 = 100 \\implies BC = 10\\text{ cm}$"
            }
          ],
          "conclusion": "Vậy $BC = 10\\text{ cm}$."
        },
        "hint": "Sử dụng định lý Pythagoras trong tam giác vuông",
        "short_answer": "Áp dụng định lý Pythagoras trong tam giác $ABC$ vuông tại $A$: $BC = \\sqrt{AB^2 + AC^2} = \\sqrt{6^2 + 8^2} = 10\\text{ cm}$.",
        "general_method": "Áp dụng định lý Pythagoras $BC = \\sqrt{AB^2 + AC^2}$",
        "mistakes": "Quên khai căn bậc hai sau khi cộng bình phương"
      },
      {
        "content": "Tính độ dài đường cao $AH$.",
        "type": "Tự luận",
        "grade": 9,
        "topic": "Hệ thức giữa cạnh và góc",
        "difficulty_level": "Thông hiểu",
        "difficulty_point": 5.0,
        "point": 1,
        "tags": ["Hệ thức lượng", "Tam giác vuông"],
        "options": [],
        "correct_answer": "$AH = 4.8\\text{ cm}$",
        "solution_guide": {
          "diagram_svg": null,
          "steps": [
            {
              "step": 1,
              "title": "Áp dụng hệ thức lượng",
              "content": "Trong tam giác vuông $ABC$ có đường cao $AH$:",
              "formula": "$AB \\cdot AC = BC \\cdot AH \\implies AH = \\frac{6 \\cdot 8}{10} = 4.8\\text{ cm}$"
            }
          ],
          "conclusion": "Vậy $AH = 4.8\\text{ cm}$."
        },
        "hint": "Áp dụng hệ thức liên hệ giữa cạnh góc vuông, cạnh huyền và đường cao",
        "short_answer": "Áp dụng hệ thức lượng $AB \\cdot AC = BC \\cdot AH \\implies AH = \\frac{6 \\cdot 8}{10} = 4.8\\text{ cm}$.",
        "general_method": "Sử dụng công thức $AH = \\frac{AB \\cdot AC}{BC}$",
        "mistakes": "Tính nhầm cạnh huyền hoặc nhầm lẫn giữa các hệ thức lượng"
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
			log.Printf("[AI Question Extractor] RAW JSON: %s", rawJSON)
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
