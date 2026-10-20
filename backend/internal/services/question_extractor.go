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
	DifficultyPoint float32  `json:"difficulty_point,omitempty"`
	Point           float32  `json:"point,omitempty"`
	Tags            []string `json:"tags,omitempty"`
	Options         []string `json:"options,omitempty"`
	CorrectAnswer   string   `json:"correct_answer,omitempty"`
	SolutionGuide   string   `json:"solution_guide,omitempty"`
	Hint            string   `json:"hint,omitempty"`
	QuickSolveTips  string   `json:"quick_solve_tips,omitempty"`
	GeneralMethod   string   `json:"general_method,omitempty"`
	Mistakes        string   `json:"mistakes,omitempty"`
}

type ExtractedQuestionBlock struct {
	SharedContent string                  `json:"shared_content,omitempty"`
	IsGroup       bool                    `json:"is_group"`
	Questions     []ExtractedQuestionItem `json:"questions"`
	Diagrams      []DiagramInfo           `json:"diagrams,omitempty"`
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

		// Hậu xử lý từng câu hỏi trong block
		for qIdx := range block.Questions {
			q := &block.Questions[qIdx]

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
					q.Options[oIdx] = cleanOptionText(q.Options[oIdx])
				}
				// Nếu correct_answer có tiền tố A. $...$, làm sạch tiền tố để khớp với option
				trimmedAns := strings.TrimSpace(q.CorrectAnswer)
				if len(trimmedAns) > 3 {
					first := trimmedAns[0]
					if (first >= 'A' && first <= 'D') || (first >= 'a' && first <= 'd') {
						if trimmedAns[1] == '.' || trimmedAns[1] == ')' || trimmedAns[1] == ':' {
							q.CorrectAnswer = cleanOptionText(trimmedAns)
						}
					}
				}
			} else {
				q.Type = "Tự luận"
				if q.Options == nil {
					q.Options = []string{}
				}
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

			// Chuẩn hóa Point
			if q.Point == 0 {
				if q.Type == "Trắc nghiệm" {
					q.Point = 0.5
				} else {
					q.Point = 1.0
				}
			}

			// Chuẩn hóa TypeQuestion
			if q.TypeQuestion == "" {
				q.TypeQuestion = "single"
			}

			// Chuẩn hóa Tags: nếu chưa có, thêm ít nhất 1 tag chính là Topic
			if len(q.Tags) == 0 && q.Topic != "" {
				q.Tags = []string{q.Topic}
			}
		}

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
1. "content": Nội dung câu hỏi sạch sẽ, bỏ tiền tố số thứ tự (ví dụ: "Câu 1.", "Bài 2:"). Mọi biểu thức/ký hiệu toán phải viết bằng LaTeX chuẩn ($...$ hoặc $$...$$).
2. "type": "Trắc nghiệm" (nếu có các phương án lựa chọn) hoặc "Tự luận".
3. "options":
   - Nếu là "Trắc nghiệm": mảng đúng 4 chuỗi phương án [A, B, C, D]. ĐẶC BIỆT: Chỉ ghi nội dung của phương án, TUYỆT ĐỐI KHÔNG lặp lại tiền tố "A.", "B.", "C.", "D." ở đầu chuỗi (ví dụ: "$x = 2$", chứ KHÔNG PHẢI "A. $x = 2$").
   - Nếu là "Tự luận": mảng rỗng [].
4. "correct_answer":
   - NẾU tài liệu ảnh CÓ SẴN đáp án mẫu hoặc khoanh sẵn: trích xuất đáp án đúng đó.
   - NẾU tài liệu ảnh KHÔNG CÓ đáp án mẫu: AI BẮT BUỘC PHẢI TỰ GIẢI TOÁN một cách chính xác tuyệt đối để tìm ra đáp án đúng!
   - Với Trắc nghiệm: Điền nội dung của phương án đúng (hoặc ký tự A/B/C/D).
   - Với Tự luận: Điền kết quả/đáp số cuối cùng của bài toán (ví dụ: "$x = 3$").
5. "solution_guide": Lời giải chi tiết từng bước. NẾU ảnh chưa có lời giải, AI PHẢI TỰ TRÌNH BÀY LỜI GIẢI ĐẦY ĐỦ, chặt chẽ, chuẩn sư phạm Việt Nam, có đầy đủ các bước biến đổi và lập luận toán học bằng LaTeX.
6. "hint": Gợi ý định hướng tư duy ngắn gọn (1-2 câu), gợi mở phương pháp cho học sinh.
7. "quick_solve_tips": Mẹo giải nhanh, cách bấm máy tính Casio, nhận xét loại trừ nhanh nếu có.
8. "general_method": Phương pháp tổng quát, công thức, định lý cơ bản dùng để giải dạng toán này.
9. "mistakes": Cảnh báo các sai lầm học sinh rất hay mắc (quên điều kiện, nhầm dấu, sai đơn vị...).
10. "grade": Khối lớp số nguyên (5, 6, 7, 8 hoặc 9).
11. "topic": BẮT BUỘC CHỌN 1 VÀ CHỈ 1 CHỦ ĐỀ TƯƠNG ỨNG KHỐI LỚP TỪ DANH SÁCH Ở TRÊN (tên chính xác 100%%).
12. "difficulty_level": 1 trong 4 mức độ: "Nhận biết", "Thông hiểu", "Vận dụng", "Vận dụng cao".
13. "difficulty_point": Điểm độ khó (0-10): Nhận biết = 2.5, Thông hiểu = 5.0, Vận dụng = 7.5, Vận dụng cao = 9.0.
14. "point": Điểm số (Trắc nghiệm: 0.25 hoặc 0.5; Tự luận: 1.0 hoặc 2.0).
15. "tags": Mảng 2-4 từ khóa chuyên môn (ví dụ: ["Phương trình bậc hai", "Định lý Viète"]).
16. Bảng biến thiên, Bảng xét dấu hoặc Bảng số liệu: HÃY chuyển đổi trực tiếp thành bảng HTML (thẻ <table>, <tr>, <td>) hoặc bảng Markdown rõ ràng, KHÔNG cắt thành ảnh.
17. Với Hình vẽ hình học (hình học phẳng, hình không gian) và Đồ thị hàm số trên hệ trục Oxy:
    - Điền mã định danh vào vị trí tương ứng trong đề bài hoặc lời giải, ví dụ: [DIAGRAM_0_1] (0 là chỉ số trang ảnh 0-indexed, 1 là thứ tự hình).
    - Khai báo thông tin vào mảng "diagrams" với tọa độ chuẩn hóa box_2d [ymin, xmin, ymax, xmax] (thang đo 0-1000).
18. Cấu trúc JSON trả về:
    - Nếu là câu đơn: "is_group": false, "shared_content": "", "questions": [ {...} ]
    - Nếu là câu hỏi chùm (chung một đoạn dẫn đề bài cho nhiều câu con): "is_group": true, "shared_content": "Đoạn đề dẫn chung...", "questions": [ {...}, {...} ]
    - CHỈ trả về duy nhất chuỗi JSON hợp lệ (mảng các block), tuyệt đối KHÔNG kèm lời chào hay giải thích nào khác ngoài JSON.`, gradeHint)

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

	return ParseAndProcessExtractedBlocks(rawJSON, decodedImages, "./uploads/temp", targetGradeInt)
}
