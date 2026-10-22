package models

import (
	"encoding/json"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestQuestionAnswer_StepResultsSerialization(t *testing.T) {
	qa := QuestionAnswer{
		Type:                "Tự luận",
		StudentAnswer:       "x = 2",
		Score:               1.0,
		MaxScore:            1.0,
		IsCorrect:           true,
		IsAlternativeMethod: false,
		StepResults: []StepGradeResult{
			{
				Step:      1,
				Title:     "Điều kiện xác định",
				Score:     0.5,
				MaxScore:  0.5,
				IsCorrect: true,
			},
			{
				Step:      2,
				Title:     "Giải phương trình",
				Score:     0.5,
				MaxScore:  0.5,
				IsCorrect: true,
			},
		},
	}

	bytes, err := json.Marshal(qa)
	assert.NoError(t, err)

	var decoded QuestionAnswer
	err = json.Unmarshal(bytes, &decoded)
	assert.NoError(t, err)
	assert.Len(t, decoded.StepResults, 2)
	assert.Equal(t, 0.5, decoded.StepResults[0].Score)
	assert.False(t, decoded.IsAlternativeMethod)
}
