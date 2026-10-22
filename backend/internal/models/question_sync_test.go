package models_test

import (
	"testing"

	"github.com/modeptrai/exam-model-backend/internal/models"
	"github.com/stretchr/testify/assert"
)

func TestQuestion_ShortAnswer_QuickSolveTips_Sync(t *testing.T) {
	// 1. Given QuickSolveTips, BeforeCreate should populate ShortAnswer
	q1 := models.Question{
		QuickSolveTips: "Mẹo giải nhanh 1",
	}
	err := q1.BeforeCreate(nil)
	assert.NoError(t, err)
	assert.Equal(t, "Mẹo giải nhanh 1", q1.ShortAnswer)
	assert.Equal(t, "Mẹo giải nhanh 1", q1.QuickSolveTips)

	// 2. Given ShortAnswer, AfterFind should populate QuickSolveTips
	q2 := models.Question{
		ShortAnswer: "Lời giải ngắn 2",
	}
	err = q2.AfterFind(nil)
	assert.NoError(t, err)
	assert.Equal(t, "Lời giải ngắn 2", q2.ShortAnswer)
	assert.Equal(t, "Lời giải ngắn 2", q2.QuickSolveTips)
}
