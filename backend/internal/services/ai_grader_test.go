package services

import (
	"encoding/json"
	"os"
	"testing"

	"github.com/modeptrai/exam-model-backend/internal/utils"
	"github.com/stretchr/testify/assert"
)

func TestEssayQuestionResult_StepResultsSchema(t *testing.T) {
	rawJSON := `{
		"questionId": "q1",
		"score": 0.5,
		"maxScore": 1.0,
		"isCorrect": false,
		"isAlternativeMethod": true,
		"explanation": "Học sinh giải theo phương pháp đặt ẩn phụ khác nhưng tính nhầm ở bước 2.",
		"errorLocation": "u = 5",
		"deductionReason": "Tính toán nhầm phép cộng",
		"stepResults": [
			{
				"step": 1,
				"title": "Đặt ẩn phụ và tìm điều kiện",
				"score": 0.5,
				"max_score": 0.5,
				"is_correct": true
			},
			{
				"step": 2,
				"title": "Giải phương trình theo ẩn mới",
				"score": 0.0,
				"max_score": 0.5,
				"is_correct": false,
				"error_location": "u = 5",
				"deduction_reason": "Tính toán nhầm"
			}
		]
	}`

	var res EssayQuestionResult
	err := json.Unmarshal([]byte(rawJSON), &res)
	assert.NoError(t, err)
	assert.Equal(t, "q1", res.QuestionID)
	assert.Equal(t, 0.5, res.Score)
	assert.True(t, res.IsAlternativeMethod)
	assert.Len(t, res.StepResults, 2)
	assert.Equal(t, 0.5, res.StepResults[0].Score)
	assert.Equal(t, 0.0, res.StepResults[1].Score)
	assert.False(t, res.StepResults[1].IsCorrect)
	assert.Equal(t, "u = 5", res.StepResults[1].ErrorLocation)
}

func TestAIGrader_MissingKeys(t *testing.T) {
	origPool := utils.GlobalGeminiPool
	defer func() { utils.GlobalGeminiPool = origPool }()

	utils.GlobalGeminiPool = utils.NewGeminiPoolManager("", 0)
	// Clear env fallback as well
	origKey := os.Getenv("GEMINI_API_KEY")
	origKeys := os.Getenv("GEMINI_API_KEYS")
	defer func() {
		os.Setenv("GEMINI_API_KEY", origKey)
		os.Setenv("GEMINI_API_KEYS", origKeys)
	}()
	os.Setenv("GEMINI_API_KEY", "")
	os.Setenv("GEMINI_API_KEYS", "")
	utils.InitGlobalGeminiPool()

	_, err := gradeEssayChunk(EssayBatchInput{})
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "GEMINI_API_KEY is not set")
}

