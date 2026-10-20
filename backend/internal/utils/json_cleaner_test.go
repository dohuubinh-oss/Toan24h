package utils

import (
	"encoding/json"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestSanitizeJSON_LaTeXEscapes(t *testing.T) {
	tests := []struct {
		name     string
		rawJSON  string
		expected string
		checkKey string
	}{
		{
			name:     "Invalid escape \\q (quad)",
			rawJSON:  `{"content": "Cho hình chóp $x \quad y$"}`,
			expected: "Cho hình chóp $x \\quad y$",
			checkKey: "content",
		},
		{
			name:     "Invalid escape \\s (sqrt, sum)",
			rawJSON:  `{"math": "$\sqrt{x^2 + 1} + \sum_{i=1}^n x_i$"}`,
			expected: `$\sqrt{x^2 + 1} + \sum_{i=1}^n x_i$`,
			checkKey: "math",
		},
		{
			name:     "Invalid escape \\p (pm, pi)",
			rawJSON:  `{"val": "$x = \pm \pi$"}`,
			expected: `$x = \pm \pi$`,
			checkKey: "val",
		},
		{
			name:     "Invalid escape \\l (left, leq)",
			rawJSON:  `{"val": "$\left( \frac{a}{b} \right) \leq 1$"}`,
			expected: `$\left( \frac{a}{b} \right) \leq 1$`,
			checkKey: "val",
		},
		{
			name:     "Invalid escape \\{ and \\}",
			rawJSON:  `{"set": "A = \{1; 2; 3\}"}`,
			expected: `A = \{1; 2; 3\}`,
			checkKey: "set",
		},
		{
			name:     "Invalid escape \\u that is NOT unicode (underline, uparrow)",
			rawJSON:  `{"style": "\underline{chú ý} \uparrow"}`,
			expected: `\underline{chú ý} \uparrow`,
			checkKey: "style",
		},
		{
			name:     "Valid unicode escape \\u003c preserved",
			rawJSON:  `{"symbol": "\u003c"}`,
			expected: "<",
			checkKey: "symbol",
		},
		{
			name:     "Already escaped \\\\frac preserved and not over-escaped",
			rawJSON:  `{"frac": "\\frac{1}{2}"}`,
			expected: `\frac{1}{2}`,
			checkKey: "frac",
		},
		{
			name:     "Unescaped \\frac converted so it does not become formfeed",
			rawJSON:  `{"frac": "\frac{1}{2}"}`,
			expected: `\frac{1}{2}`,
			checkKey: "frac",
		},
		{
			name:     "Unescaped \\text converted so it does not become tab",
			rawJSON:  `{"formula": "$\text{với } x > 0$"}`,
			expected: `$\text{với } x > 0$`,
			checkKey: "formula",
		},
		{
			name:     "Unescaped \\neq converted so it does not become newline",
			rawJSON:  `{"cond": "$x \neq 0$"}`,
			expected: `$x \neq 0$`,
			checkKey: "cond",
		},
		{
			name:     "Real newlines \\n in text are preserved",
			rawJSON:  `{"desc": "Câu 1:\nCho tam giác ABC\nTìm x"}`,
			expected: "Câu 1:\nCho tam giác ABC\nTìm x",
			checkKey: "desc",
		},
		{
			name:     "Trailing commas in JSON are cleaned",
			rawJSON:  `{"a": 1, "b": 2,}`,
			expected: "",
			checkKey: "a",
		},
		{
			name: "Markdown code fence wrapper stripped",
			rawJSON: "```json\n" + `[{"question": "Tìm x sao cho $x \quad 2$"}]` + "\n```",
			expected: "Tìm x sao cho $x \\quad 2$",
			checkKey: "question",
		},
		{
			name:     "Unescaped literal linebreaks inside string handled",
			rawJSON:  "{\"multiline\": \"Dòng 1\nDòng 2\"}",
			expected: "Dòng 1\nDòng 2",
			checkKey: "multiline",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			cleaned := SanitizeJSON(tt.rawJSON)

			// Try to unmarshal into a generic map or slice
			if tt.name == "Markdown code fence wrapper stripped" {
				var res []map[string]interface{}
				err := json.Unmarshal([]byte(cleaned), &res)
				assert.NoError(t, err, "Should unmarshal successfully after sanitization")
				if err == nil && len(res) > 0 {
					assert.Equal(t, tt.expected, res[0][tt.checkKey])
				}
			} else {
				var res map[string]interface{}
				err := json.Unmarshal([]byte(cleaned), &res)
				assert.NoError(t, err, "Should unmarshal successfully after sanitization")
				if err == nil && tt.expected != "" {
					assert.Equal(t, tt.expected, res[tt.checkKey])
				}
			}
		})
	}
}

func TestSanitizeJSON_ComplexExamQuestion(t *testing.T) {
	// A real-world raw response snippet from Gemini that caused the '\q' bug
	geminiResponse := `
	[
		{
			"shared_content": "Cho hình chóp $S.ABCD$ có đáy là hình vuông cạnh $a \sqrt{2}$.",
			"is_group": false,
			"questions": [
				{
					"type_question": "single",
					"content": "Tính khoảng cách từ điểm $S$ đến mặt phẳng $(ABCD)$ biết $SO \perp (ABCD)$ và $SO = a \quad (a > 0)$.",
					"type": "Trắc nghiệm",
					"options": [
						"A. $a \sqrt{3}$",
						"B. $\frac{a \sqrt{2}}{2}$",
						"C. $a$",
						"D. $2a$"
					],
					"correct_answer": "C",
					"solution_guide": "Do $SO \perp (ABCD)$ nên $d(S, (ABCD)) = SO = a \quad (\text{đvđd})$."
				}
			]
		}
	]
	`

	cleaned := SanitizeJSON(geminiResponse)
	var blocks []struct {
		SharedContent string `json:"shared_content"`
		Questions     []struct {
			Content       string   `json:"content"`
			Options       []string `json:"options"`
			SolutionGuide string   `json:"solution_guide"`
		} `json:"questions"`
	}

	err := json.Unmarshal([]byte(cleaned), &blocks)
	assert.NoError(t, err, "Real-world gemini response with unescaped LaTeX must unmarshal without error")
	assert.Len(t, blocks, 1)
	assert.Len(t, blocks[0].Questions, 1)

	q := blocks[0].Questions[0]
	// Verify that \quad and \frac and \sqrt survived intact in string content
	assert.Contains(t, q.Content, `\quad`)
	assert.Contains(t, q.Options[1], `\frac`)
	assert.Contains(t, q.SolutionGuide, `\text`)
}
