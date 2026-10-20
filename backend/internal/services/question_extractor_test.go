package services

import (
	"image"
	"image/color"
	"image/draw"
	"os"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestParseAndProcessExtractedBlocks(t *testing.T) {
	tempDir := "./uploads/temp"
	defer os.RemoveAll(tempDir)

	// Create 1 synthetic image 300x300
	img := image.NewRGBA(image.Rect(0, 0, 300, 300))
	draw.Draw(img, img.Bounds(), &image.Uniform{color.RGBA{0, 255, 0, 255}}, image.Point{}, draw.Src)
	images := []image.Image{img}

	rawJSON := `[
		{
			"shared_content": "Cho hình chóp S.ABC [DIAGRAM_0_1]",
			"is_group": true,
			"questions": [
				{
					"type_question": "single",
					"content": "Tính thể tích khối chóp",
					"type": "Trắc nghiệm",
					"options": ["A. $V = \\frac{1}{3}Bh$", "B. $V = Bh$"],
					"correct_answer": "A",
					"solution_guide": "Áp dụng công thức $V = \\frac{1}{3}Bh$"
				}
			],
			"diagrams": [
				{
					"image_index": 0,
					"box_2d": [100, 100, 400, 400],
					"placeholder": "[DIAGRAM_0_1]"
				}
			]
		}
	]`

	blocks, err := ParseAndProcessExtractedBlocks(rawJSON, images, tempDir)
	assert.NoError(t, err)
	assert.Len(t, blocks, 1)

	// Verify placeholder was replaced by an <img> tag with /uploads/temp/ URL
	assert.NotNil(t, blocks[0].SharedContent)
	assert.True(t, strings.Contains(*blocks[0].SharedContent, `<img src="/uploads/temp/`))
	assert.False(t, strings.Contains(*blocks[0].SharedContent, `[DIAGRAM_0_1]`))
}

func TestParseAndProcessExtractedBlocks_WithoutDiagrams(t *testing.T) {
	tempDir := "./uploads/temp"
	rawJSON := `[
		{
			"shared_content": null,
			"is_group": false,
			"questions": [
				{
					"type_question": "single",
					"content": "Giải phương trình $x^2 - 4 = 0$",
					"type": "Tự luận",
					"options": [],
					"correct_answer": "$x = \\pm 2$",
					"solution_guide": "Ta có $x^2 = 4 \\Rightarrow x = \\pm 2$"
				}
			]
		}
	]`

	blocks, err := ParseAndProcessExtractedBlocks(rawJSON, nil, tempDir)
	assert.NoError(t, err)
	assert.Len(t, blocks, 1)
	assert.Nil(t, blocks[0].SharedContent, "Single question block shared_content should be null")
	assert.Equal(t, "single", blocks[0].TypeQuestion)
	assert.Equal(t, "Giải phương trình $x^2 - 4 = 0$", blocks[0].Questions[0].Content)
}

func TestNormalizeQuestionTopic(t *testing.T) {
	// Grade 9
	assert.Equal(t, "Định lý Viète và ứng dụng", NormalizeQuestionTopic(9, "Định lý Viète và ứng dụng"))
	assert.Equal(t, "Định lý Viète và ứng dụng", NormalizeQuestionTopic(9, "Định lý Vi-ét"))
	assert.Equal(t, "Hàm số y = ax^2 (a khác 0)", NormalizeQuestionTopic(9, "Hàm số y=ax^2"))
	assert.Equal(t, "Góc với đường tròn (Góc nội tiếp, góc ở tâm)", NormalizeQuestionTopic(9, "Góc nội tiếp"))
	assert.Equal(t, "Hình nón", NormalizeQuestionTopic(9, "Hình nón"))

	// Grade 8
	assert.Equal(t, "Hằng đẳng thức đáng nhớ", NormalizeQuestionTopic(8, "Hằng đẳng thức"))
	assert.Equal(t, "Định lý Thalès thuận và đảo", NormalizeQuestionTopic(8, "Định lý Ta-lét"))
	assert.Equal(t, "Đường trung bình của tam giác", NormalizeQuestionTopic(8, "Đường trung bình"))

	// Grade 7
	assert.Equal(t, "Tập hợp số hữu tỉ", NormalizeQuestionTopic(7, "Số hữu tỉ"))
	assert.Equal(t, "Tam giác cân và định lý Pythagoras", NormalizeQuestionTopic(7, "Định lý Pitago"))
	assert.Equal(t, "Làm quen với xác suất của biến cố ngẫu nhiên", NormalizeQuestionTopic(7, "Xác suất biến cố"))

	// Grade 6
	assert.Equal(t, "Tập hợp số tự nhiên", NormalizeQuestionTopic(6, "Số tự nhiên"))
	assert.Equal(t, "Hình có trục đối xứng", NormalizeQuestionTopic(6, "Trục đối xứng"))
	assert.Equal(t, "Trung điểm của đoạn thẳng", NormalizeQuestionTopic(6, "Trung điểm"))

	// Grade 5
	assert.Equal(t, "Phân số thập phân và hỗn số", NormalizeQuestionTopic(5, "Phân số thập phân"))
	assert.Equal(t, "Toán chuyển động đều", NormalizeQuestionTopic(5, "Toán chuyển động"))
	assert.Equal(t, "Chu vi và diện tích hình tròn", NormalizeQuestionTopic(5, "Hình tròn"))

	// Fallback when empty or unknown
	assert.Equal(t, "Phương trình bậc nhất hai ẩn", NormalizeQuestionTopic(9, ""))
	assert.Equal(t, "Đơn thức và đa thức nhiều biến", NormalizeQuestionTopic(8, "Không rõ chủ đề"))
}

func TestParseAndProcessExtractedBlocks_FullFields(t *testing.T) {
	tempDir := "./uploads/temp"
	rawJSON := `[
		{
			"shared_content": "",
			"is_group": false,
			"questions": [
				{
					"content": "Tìm nghiệm phương trình $x^2 - 5x + 6 = 0$",
					"type": "Trắc nghiệm",
					"grade": 9,
					"topic": "Định lý Vi-ét",
					"difficulty_level": "Thông hiểu",
					"difficulty_point": 5.0,
					"point": 1,
					"options": ["A. $x = 2; x = 3$", "B) $x = 1; x = 6$", "C. $x = -2; x = -3$", "D. Vô nghiệm"],
					"correct_answer": "A. $x = 2; x = 3$",
					"solution_guide": "Áp dụng định lý Viète: $S = 5, P = 6 \\Rightarrow x = 2, x = 3$.",
					"hint": "Phân tích đa thức thành nhân tử hoặc dùng Viète.",
					"quick_solve_tips": "Bấm phím Mode 5 3 trên máy tính Casio 580.",
					"general_method": "Phương trình $ax^2 + bx + c = 0$ có nghiệm thoả $x_1+x_2=-b/a, x_1x_2=c/a$.",
					"mistakes": "Nhầm dấu giữa tổng và tích nghiệm.",
					"tags": ["Phương trình bậc hai", "Định lý Viète"]
				}
			]
		}
	]`

	blocks, err := ParseAndProcessExtractedBlocks(rawJSON, nil, tempDir, 9)
	assert.NoError(t, err)
	assert.Len(t, blocks, 1)

	q := blocks[0].Questions[0]
	assert.Equal(t, 9, q.Grade)
	assert.Equal(t, "Định lý Viète và ứng dụng", q.Topic)
	assert.Equal(t, "Trắc nghiệm", q.Type)
	assert.Equal(t, "$x = 2; x = 3$", q.Options[0])
	assert.Equal(t, "$x = 1; x = 6$", q.Options[1])
	assert.Equal(t, "$x = 2; x = 3$", q.CorrectAnswer)
	assert.Equal(t, "Thông hiểu", q.DifficultyLevel)
	assert.Equal(t, float32(5.0), q.DifficultyPoint)
	assert.Equal(t, FlexibleInt(1), q.Point)
	assert.NotEmpty(t, q.SolutionGuide)
	assert.NotEmpty(t, q.Hint)
	assert.NotEmpty(t, q.QuickSolveTips)
	assert.NotEmpty(t, q.GeneralMethod)
	assert.NotEmpty(t, q.Mistakes)
	assert.Equal(t, 2, len(q.Tags))
}

func TestNormalizeQuestionAnswer_OptionMapping(t *testing.T) {
	tempDir := "./uploads/temp"
	defer os.RemoveAll(tempDir)

	rawJSON := `[
		{
			"shared_content": "",
			"is_group": false,
			"questions": [
				{
					"content": "Câu hỏi trắc nghiệm",
					"type": "Trắc nghiệm",
					"options": ["A. $x = 1$", "B. $x = 2$"],
					"correct_answer": "B"
				},
				{
					"content": "Câu hỏi tự luận",
					"type": "Tự luận",
					"options": [],
					"correct_answer": "$x = \\sqrt{2}$"
				}
			]
		}
	]`

	blocks, err := ParseAndProcessExtractedBlocks(rawJSON, nil, tempDir, 9)
	assert.NoError(t, err)
	assert.Len(t, blocks, 1)
	assert.Len(t, blocks[0].Questions, 2)

	// Q1: Letter "B" should be mapped to the clean content of option B: "$x = 2$"
	q1 := blocks[0].Questions[0]
	assert.Equal(t, "$x = 1$", q1.Options[0])
	assert.Equal(t, "$x = 2$", q1.Options[1])
	assert.Equal(t, "$x = 2$", q1.CorrectAnswer)

	// Q2: Essay question preserves LaTeX answer
	q2 := blocks[0].Questions[1]
	assert.Equal(t, "Tự luận", q2.Type)
	assert.Equal(t, "$x = \\sqrt{2}$", q2.CorrectAnswer)
}

func TestParseAndProcessExtractedBlocks_UnescapedLaTeX(t *testing.T) {
	tempDir := "./uploads/temp"
	defer os.RemoveAll(tempDir)

	// In backtick raw string literals, `\q`, `\s`, `\p` are raw single backslashes followed by letters.
	// This simulates exactly what Gemini returns over the wire.
	rawJSON := `[
		{
			"shared_content": "Cho tam giác $ABC$ vuông tại $A$ với đường cao $AH$.",
			"is_group": false,
			"questions": [
				{
					"type_question": "single",
					"content": "Tính $x \quad y$ biết $x = \sqrt{3} + \pm 1$",
					"type": "Trắc nghiệm",
					"options": [
						"$\frac{1}{2} \quad x$",
						"$\sqrt{2}$",
						"$\pm 3$",
						"$0$"
					],
					"correct_answer": "$\frac{1}{2} \quad x$",
					"solution_guide": "Ta có: $\text{với } x > 0$ thì $x \neq 0$."
				}
			]
		}
	]`

	blocks, err := ParseAndProcessExtractedBlocks(rawJSON, nil, tempDir, 8)
	assert.NoError(t, err, "Should successfully parse JSON even with unescaped LaTeX backslashes like \\q, \\s, \\p")
	assert.Len(t, blocks, 1)
	assert.Len(t, blocks[0].Questions, 1)

	q := blocks[0].Questions[0]
	assert.Contains(t, q.Content, `\quad`)
	assert.Contains(t, q.Content, `\sqrt`)
	assert.Contains(t, q.Options[0], `\frac`)
	assert.Contains(t, q.SolutionGuide, `\text`)
	assert.Contains(t, q.SolutionGuide, `\neq`)
}

func TestParseAndProcessExtractedBlocks_SpecificationRequirements(t *testing.T) {
	tempDir := "./uploads/temp"
	defer os.RemoveAll(tempDir)

	rawJSON := `[
		{
			"shared_content": null,
			"is_group": false,
			"questions": [
				{
					"type_question": "single",
					"content": "Rút gọn biểu thức $A = \\sqrt{16} + \\sqrt{9}$",
					"type": "Trắc nghiệm",
					"grade": 9,
					"topic": "Căn bậc hai số học và số thực",
					"difficulty_level": "Nhận biết",
					"difficulty_point": 2.5,
					"point": 1,
					"options": ["$7$", "$5$", "$1$", "$12$"],
					"correct_answer": "$7$",
					"solution_guide": "Ta có $\\sqrt{16} = 4$, $\\sqrt{9} = 3 \\Rightarrow A = 4 + 3 = 7$."
				}
			]
		},
		{
			"shared_content": "Cho hình chóp tam giác đều $S.ABC$ có cạnh đáy bằng $a$.",
			"is_group": true,
			"questions": [
				{
					"content": "Tính diện tích đáy tam giác đều $ABC$",
					"type": "Trắc nghiệm",
					"grade": 8,
					"topic": "Hình chóp tam giác đều",
					"difficulty_level": "Thông hiểu",
					"difficulty_point": 5.0,
					"options": ["$\\frac{a^2\\sqrt{3}}{4}$", "$\\frac{a^2}{2}$", "$a^2\\sqrt{3}$", "$\\frac{a^2}{4}$"],
					"correct_answer": "$\\frac{a^2\\sqrt{3}}{4}$",
					"solution_guide": "Diện tích tam giác đều cạnh $a$ là $S = \\frac{a^2\\sqrt{3}}{4}$."
				},
				{
					"content": "Tính thể tích khối chóp biết chiều cao $h = 2a$",
					"type": "Tự luận",
					"grade": 8,
					"topic": "Hình chóp tam giác đều",
					"difficulty_level": "Vận dụng",
					"difficulty_point": 7.5,
					"options": [],
					"correct_answer": "$V = \\frac{a^3\\sqrt{3}}{6}$",
					"solution_guide": "Thể tích $V = \\frac{1}{3} S_{day} h = \\frac{1}{3} \\frac{a^2\\sqrt{3}}{4} (2a) = \\frac{a^3\\sqrt{3}}{6}$."
				}
			]
		}
	]`

	blocks, err := ParseAndProcessExtractedBlocks(rawJSON, nil, tempDir, 9)
	assert.NoError(t, err)
	assert.Len(t, blocks, 2)

	// Block 1: Single question
	b1 := blocks[0]
	assert.Equal(t, "single", b1.TypeQuestion)
	assert.Nil(t, b1.SharedContent, "Single question shared_content must be null")
	assert.Len(t, b1.Questions, 1)

	q1 := b1.Questions[0]
	assert.Equal(t, "Trắc nghiệm", q1.Type)
	assert.Equal(t, 9, q1.Grade)
	assert.Equal(t, "Nhận biết", q1.DifficultyLevel)
	assert.Equal(t, float32(2.5), q1.DifficultyPoint)
	assert.Equal(t, FlexibleInt(1), q1.Point)
	assert.Equal(t, 4, len(q1.Options))
	assert.Equal(t, "$7$", q1.CorrectAnswer)

	// Block 2: Group question
	b2 := blocks[1]
	assert.Equal(t, "group", b2.TypeQuestion)
	assert.NotNil(t, b2.SharedContent)
	assert.Contains(t, *b2.SharedContent, "Cho hình chóp tam giác đều")
	assert.Len(t, b2.Questions, 2)

	q2_1 := b2.Questions[0]
	assert.Equal(t, "Trắc nghiệm", q2_1.Type)
	assert.Equal(t, 8, q2_1.Grade)
	assert.Equal(t, "Thông hiểu", q2_1.DifficultyLevel)
	assert.Equal(t, float32(5.0), q2_1.DifficultyPoint)
	assert.Equal(t, FlexibleInt(1), q2_1.Point)
	assert.Equal(t, 4, len(q2_1.Options))
	assert.Equal(t, "$\\frac{a^2\\sqrt{3}}{4}$", q2_1.CorrectAnswer)

	q2_2 := b2.Questions[1]
	assert.Equal(t, "Tự luận", q2_2.Type)
	assert.Equal(t, 8, q2_2.Grade)
	assert.Equal(t, "Vận dụng", q2_2.DifficultyLevel)
	assert.Equal(t, float32(7.5), q2_2.DifficultyPoint)
	assert.Equal(t, FlexibleInt(1), q2_2.Point)
	assert.Empty(t, q2_2.Options, "Essay options must be empty []")
	assert.Equal(t, "$V = \\frac{a^3\\sqrt{3}}{6}$", q2_2.CorrectAnswer)
}

func TestParseAndProcessExtractedBlocks_StructuredSolutionGuideAndTypeQuestion(t *testing.T) {
	tempDir := "./uploads/temp"
	defer os.RemoveAll(tempDir)

	rawJSON := `[
		{
			"shared_content": null,
			"type_question": "single",
			"questions": [
				{
					"content": "Nội dung câu hỏi bằng LaTeX",
					"type": "Trắc nghiệm",
					"grade": 9,
					"topic": "Định lý Viète và ứng dụng",
					"difficulty_level": "Thông hiểu",
					"difficulty_point": 5.0,
					"point": 1,
					"tags": ["Phương trình bậc hai", "Định lý Viète"],
					"options": ["x = 2; x = 3", "x = 1; x = 6", "x = -2; x = -3", "Vô nghiệm"],
					"correct_answer": "x = 2; x = 3",
					"solution_guide": {
						"steps": [
							{
								"step": 1,
								"title": "Áp dụng định lý Viète",
								"content": "Tính tổng và tích các nghiệm:",
								"formula": "S = 5, P = 6"
							}
						],
						"conclusion": "Vậy $x = 2; x = 3$."
					},
					"hint": "Gợi ý",
					"quick_solve_tips": "Mẹo",
					"general_method": "Công thức",
					"mistakes": "Sai lầm"
				}
			]
		}
	]`

	blocks, err := ParseAndProcessExtractedBlocks(rawJSON, nil, tempDir, 9)
	assert.NoError(t, err)
	assert.Len(t, blocks, 1)
	assert.Equal(t, "single", blocks[0].TypeQuestion)
	assert.Nil(t, blocks[0].SharedContent)
	assert.Len(t, blocks[0].Questions, 1)

	q := blocks[0].Questions[0]
	assert.Equal(t, "Trắc nghiệm", q.Type)
	assert.Equal(t, 9, q.Grade)
	assert.Equal(t, "Định lý Viète và ứng dụng", q.Topic)

	solMap, ok := q.SolutionGuide.(map[string]interface{})
	assert.True(t, ok)
	assert.Equal(t, "Vậy $x = 2; x = 3$.", solMap["conclusion"])
	steps, ok := solMap["steps"].([]interface{})
	assert.True(t, ok)
	assert.Len(t, steps, 1)
	step1, ok := steps[0].(map[string]interface{})
	assert.True(t, ok)
	assert.Equal(t, "Áp dụng định lý Viète", step1["title"])
}



