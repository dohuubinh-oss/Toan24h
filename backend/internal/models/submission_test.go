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

func TestQuestionAnswer_DiagramResult(t *testing.T) {
	qa := QuestionAnswer{
		Type:               "Tự luận",
		StudentAnswer:      "Tam giác ABC vuông tại A",
		StudentDiagramURL: "/uploads/diagrams/sub123_q456.jpg",
		Score:              2.0,
		MaxScore:           2.0,
		IsCorrect:          true,
		DiagramResult: &DiagramResult{
			HasDiagramRequired: true,
			Score:              0.5,
			MaxScore:           0.5,
			IsCorrect:          true,
			StudentDiagramURL:  "/uploads/diagrams/sub123_q456.jpg",
			Explanation:        "Hình vẽ chính xác đỉnh, cạnh và góc vuông theo giả thiết.",
		},
	}

	bytes, err := json.Marshal(qa)
	assert.NoError(t, err)

	var decoded QuestionAnswer
	err = json.Unmarshal(bytes, &decoded)
	assert.NoError(t, err)
	assert.Equal(t, "/uploads/diagrams/sub123_q456.jpg", decoded.StudentDiagramURL)
	assert.NotNil(t, decoded.DiagramResult)
	assert.True(t, decoded.DiagramResult.HasDiagramRequired)
	assert.Equal(t, 0.5, decoded.DiagramResult.Score)
	assert.Equal(t, 0.5, decoded.DiagramResult.MaxScore)
	assert.True(t, decoded.DiagramResult.IsCorrect)
	assert.Equal(t, "Hình vẽ chính xác đỉnh, cạnh và góc vuông theo giả thiết.", decoded.DiagramResult.Explanation)
}

