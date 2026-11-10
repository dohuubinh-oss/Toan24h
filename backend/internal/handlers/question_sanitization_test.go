package handlers

import (
	"testing"

	"github.com/modeptrai/exam-model-backend/internal/models"
	"github.com/stretchr/testify/assert"
)

func TestSanitizeQuestionForPublic_Default(t *testing.T) {
	q := &models.Question{
		Content:        "Giải phương trình x + 1 = 2",
		CorrectAnswer:  "x = 1",
		SolutionGuide:  "Trừ cả 2 vế cho 1",
		ShortAnswer:    "1",
		QuickSolveTips: "Nhẩm nhanh 1",
		Hint:           "Chuyển vế đổi dấu",
		Mistakes:       "Quên đổi dấu",
		GeneralMethod:  "Phương pháp đại số",
		SubQuestions: []models.Question{
			{
				Content:        "Câu hỏi con a",
				CorrectAnswer:  "Đáp án con a",
				SolutionGuide:  "Hướng dẫn con a",
				ShortAnswer:    "Lời giải ngắn a",
				QuickSolveTips: "Mẹo a",
				Hint:           "Gợi ý a",
				Mistakes:       "Lỗi sai a",
				GeneralMethod:  "Phương pháp a",
			},
		},
	}

	sanitizeQuestionForPublic(q, false)

	// Answers and solution guides must always be cleared
	assert.Empty(t, q.CorrectAnswer)
	assert.Empty(t, q.SolutionGuide)
	assert.Empty(t, q.ShortAnswer)
	assert.Empty(t, q.QuickSolveTips)
	assert.Equal(t, "Chuyển vế đổi dấu", q.Hint)
	assert.Equal(t, "Quên đổi dấu", q.Mistakes)
	assert.Equal(t, "Phương pháp đại số", q.GeneralMethod)

	assert.Empty(t, q.SubQuestions[0].CorrectAnswer)
	assert.Empty(t, q.SubQuestions[0].SolutionGuide)
	assert.Empty(t, q.SubQuestions[0].ShortAnswer)
	assert.Empty(t, q.SubQuestions[0].QuickSolveTips)
	assert.Equal(t, "Gợi ý a", q.SubQuestions[0].Hint)
	assert.Equal(t, "Lỗi sai a", q.SubQuestions[0].Mistakes)
	assert.Equal(t, "Phương pháp a", q.SubQuestions[0].GeneralMethod)
}

func TestSanitizeQuestionForPublic_HideHints(t *testing.T) {
	q := &models.Question{
		Content:        "Bài thi học kỳ toán 9",
		CorrectAnswer:  "A",
		SolutionGuide:  "Chi tiết lời giải...",
		ShortAnswer:    "A",
		QuickSolveTips: "Mẹo nhanh",
		Hint:           "Gợi ý quan trọng",
		Mistakes:       "Lỗi nhầm lẫn",
		GeneralMethod:  "Công thức tổng quát",
		SubQuestions: []models.Question{
			{
				Content:        "Ý 1",
				CorrectAnswer:  "B",
				SolutionGuide:  "Chi tiết ý 1",
				ShortAnswer:    "B",
				QuickSolveTips: "Mẹo ý 1",
				Hint:           "Gợi ý ý 1",
				Mistakes:       "Lỗi ý 1",
				GeneralMethod:  "Phương pháp ý 1",
			},
		},
	}

	// Khi hideHints = true (chế độ thi thử hoặc yêu cầu ẩn gợi ý)
	sanitizeQuestionForPublic(q, true)

	// Phải xóa sạch cả đáp án lẫn toàn bộ gợi ý/lỗi sai/phương pháp
	assert.Empty(t, q.CorrectAnswer)
	assert.Empty(t, q.SolutionGuide)
	assert.Empty(t, q.ShortAnswer)
	assert.Empty(t, q.QuickSolveTips)
	assert.Empty(t, q.Hint)
	assert.Empty(t, q.Mistakes)
	assert.Empty(t, q.GeneralMethod)

	assert.Empty(t, q.SubQuestions[0].CorrectAnswer)
	assert.Empty(t, q.SubQuestions[0].SolutionGuide)
	assert.Empty(t, q.SubQuestions[0].ShortAnswer)
	assert.Empty(t, q.SubQuestions[0].QuickSolveTips)
	assert.Empty(t, q.SubQuestions[0].Hint)
	assert.Empty(t, q.SubQuestions[0].Mistakes)
	assert.Empty(t, q.SubQuestions[0].GeneralMethod)
}
