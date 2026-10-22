package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/modeptrai/exam-model-backend/internal/models"
	"github.com/modeptrai/exam-model-backend/internal/utils"
)

// --- PROMPT 1: BATCH ESSAY GRADING ---

type EssayBatchQuestionItem struct {
	QuestionID      string  `json:"questionId"`
	QuestionContent string  `json:"questionContent"`
	CorrectAnswer   string  `json:"correctAnswer"`
	SolutionGuide   string  `json:"solutionGuide,omitempty"`
	MaxScore        float64 `json:"maxScore"`
	StudentAnswer   string  `json:"studentAnswer"`
}

type EssayBatchInput struct {
	SubmissionID string                   `json:"submissionId"`
	ExamID       string                   `json:"examId"`
	StudentID    string                   `json:"studentId"`
	ExamTitle    string                   `json:"examTitle"`
	Questions    []EssayBatchQuestionItem `json:"questions"`
}

type EssayQuestionResult struct {
	QuestionID          string                   `json:"questionId"`
	Score               float64                  `json:"score"`
	MaxScore            float64                  `json:"maxScore"`
	IsCorrect           bool                     `json:"isCorrect"`
	IsAlternativeMethod bool                     `json:"isAlternativeMethod"`
	Explanation         string                   `json:"explanation"`
	ErrorLocation       string                   `json:"errorLocation"`
	DeductionReason     string                   `json:"deductionReason"`
	StepResults         []models.StepGradeResult `json:"stepResults"`
}

type EssayBatchResponse struct {
	SubmissionID         string                `json:"submissionId"`
	ExamID               string                `json:"examId"`
	StudentID            string                `json:"studentId"`
	OverallEssayFeedback string                `json:"overallEssayFeedback"`
	TotalEssayScore      float64               `json:"totalEssayScore"`
	MaxTotalEssayScore   float64               `json:"maxTotalEssayScore"`
	QuestionResults      []EssayQuestionResult `json:"questionResults"`
}

func GradeEssayBatchWithGemini(input EssayBatchInput) (*EssayBatchResponse, error) {
	if len(input.Questions) == 0 {
		return nil, nil
	}

	chunkSize := 5
	var combinedResults []EssayQuestionResult
	var feedbacks []string
	var totalEssayScore float64
	var maxTotalEssayScore float64

	for i := 0; i < len(input.Questions); i += chunkSize {
		end := i + chunkSize
		if end > len(input.Questions) {
			end = len(input.Questions)
		}

		chunkInput := input
		chunkInput.Questions = input.Questions[i:end]

		resp, err := gradeEssayChunk(chunkInput)
		if err != nil {
			fmt.Printf("Warning: Essay chunk [%d:%d] grading error: %v\n", i, end, err)
			continue
		}
		if resp != nil {
			if resp.OverallEssayFeedback != "" {
				feedbacks = append(feedbacks, resp.OverallEssayFeedback)
			}
			for _, qRes := range resp.QuestionResults {
				combinedResults = append(combinedResults, qRes)
				totalEssayScore += qRes.Score
				maxTotalEssayScore += qRes.MaxScore
			}
		}
	}

	return &EssayBatchResponse{
		SubmissionID:         input.SubmissionID,
		ExamID:               input.ExamID,
		StudentID:            input.StudentID,
		OverallEssayFeedback: strings.Join(feedbacks, " "),
		TotalEssayScore:      totalEssayScore,
		MaxTotalEssayScore:   maxTotalEssayScore,
		QuestionResults:      combinedResults,
	}, nil
}

func gradeEssayChunk(input EssayBatchInput) (*EssayBatchResponse, error) {
	apiKey := os.Getenv("GEMINI_API_KEY")
	if apiKey == "" {
		return nil, fmt.Errorf("GEMINI_API_KEY is not set")
	}

	model := os.Getenv("GEMINI_MODEL")
	if model == "" {
		model = "gemini-3.6-flash"
	}
	url := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s", model, apiKey)

	promptBytes, _ := json.MarshalIndent(input, "", "  ")
	prompt := fmt.Sprintf(`Bạn là một Giám khảo và Giáo viên Toán học cấp trung học chuyên nghiệp. 
Nhiệm vụ của bạn là chấm điểm danh sách bài làm TỰ LUẬN của học sinh và trả về dữ liệu chuẩn JSON để lưu CSDL.

---
### 📥 DỮ LIỆU ĐẦU VÀO (INPUT):
%s

---
### ⚙️ QUY TẮC CHẤM TỰ LUẬN THEO BƯỚC (STEP-BY-STEP GRADING LOGIC):
1. ĐỐI CHIẾU THEO TỪNG BƯỚC (RUBRIC):
   - Nếu câu hỏi có solutionGuide (dạng JSON các bước hoặc chuỗi văn bản): Đối chiếu từng bước biến đổi của học sinh với các bước giải mẫu.
   - Nếu solutionGuide chưa có điểm từng bước hoặc là văn bản tự do: Hãy tự động phân rã thành các bước logic chuẩn và chia điểm tương ứng (bội số 0.25) sao cho tổng max_score các bước bằng maxScore của câu hỏi.
2. CÔNG NHẬN CÁCH GIẢI KHÁC HỢP LỆ:
   - Nếu học sinh giải bằng phương pháp toán học khác hoàn toàn so với đáp án mẫu nhưng các bước logic và kết quả đều đúng: Hãy công nhận cách làm này, đặt "isAlternativeMethod": true, tự lập ra các bước tương đương của cách giải mới và chấm điểm đầy đủ cho học sinh.
3. QUY TẮC TÍNH ĐIỂM DỨT KHOÁT MỖI BƯỚC (ALL-OR-NOTHING):
   - Bước làm đúng trọn vẹn => score = max_score, is_correct = true.
   - Bước có bất kỳ lỗi sai nào (sai công thức, biến đổi sai, tính nhầm số, thiếu điều kiện...) => MẤT TRỌN ĐIỂM CỦA BƯỚC ĐÓ: score = 0, is_correct = false, trích dẫn chính xác đoạn viết sai vào error_location và nêu cụ thể lý do trừ điểm tại deduction_reason.
4. TỔNG HỢP ĐIỂM SỐ:
   - Điểm tổng của câu hỏi ("score") BẮT BUỘC bằng tổng điểm ("score") của các bước trong "stepResults" (thang điểm lẻ 0.25).
   - isCorrect = true KHI VÀ CHỈ KHI score == maxScore.
   - Bài bỏ trống hoặc làm nhảm => score = 0, isCorrect = false.
5. Đưa ra explanation và overallEssayFeedback: Nhận xét tổng quan bài làm tự luận của học sinh (2-3 câu).

---
### 📤 ĐỊNH DẠNG ĐẦU RA (OUTPUT FORMAT - JSON ONLY):
BẮT BUỘC giữ nguyên submissionId, examId, studentId từ đầu vào. Trả về đối tượng JSON theo mẫu:
{
  "submissionId": "%s",
  "examId": "%s",
  "studentId": "%s",
  "overallEssayFeedback": "string",
  "totalEssayScore": number,
  "maxTotalEssayScore": number,
  "questionResults": [
    {
      "questionId": "string",
      "score": number,
      "maxScore": number,
      "isCorrect": boolean,
      "isAlternativeMethod": boolean,
      "explanation": "string",
      "errorLocation": "string",
      "deductionReason": "string",
      "stepResults": [
        {
          "step": 1,
          "title": "string",
          "score": number,
          "max_score": number,
          "is_correct": boolean,
          "error_location": "string",
          "deduction_reason": "string"
        }
      ]
    }
  ]
}
`, string(promptBytes), input.SubmissionID, input.ExamID, input.StudentID)

	payload := map[string]interface{}{
		"contents": []map[string]interface{}{
			{
				"parts": []map[string]interface{}{
					{"text": prompt},
				},
			},
		},
		"generationConfig": map[string]interface{}{
			"responseMimeType": "application/json",
			"maxOutputTokens":  8192,
			"responseSchema": map[string]interface{}{
				"type": "OBJECT",
				"properties": map[string]interface{}{
					"submissionId":         map[string]interface{}{"type": "STRING"},
					"examId":               map[string]interface{}{"type": "STRING"},
					"studentId":            map[string]interface{}{"type": "STRING"},
					"overallEssayFeedback": map[string]interface{}{"type": "STRING"},
					"totalEssayScore":      map[string]interface{}{"type": "NUMBER"},
					"maxTotalEssayScore":   map[string]interface{}{"type": "NUMBER"},
					"questionResults": map[string]interface{}{
						"type": "ARRAY",
						"items": map[string]interface{}{
							"type": "OBJECT",
							"properties": map[string]interface{}{
								"questionId":          map[string]interface{}{"type": "STRING"},
								"score":               map[string]interface{}{"type": "NUMBER"},
								"maxScore":            map[string]interface{}{"type": "NUMBER"},
								"isCorrect":           map[string]interface{}{"type": "BOOLEAN"},
								"isAlternativeMethod": map[string]interface{}{"type": "BOOLEAN"},
								"explanation":         map[string]interface{}{"type": "STRING"},
								"errorLocation":       map[string]interface{}{"type": "STRING"},
								"deductionReason":     map[string]interface{}{"type": "STRING"},
								"stepResults": map[string]interface{}{
									"type": "ARRAY",
									"items": map[string]interface{}{
										"type": "OBJECT",
										"properties": map[string]interface{}{
											"step":             map[string]interface{}{"type": "INTEGER"},
											"title":            map[string]interface{}{"type": "STRING"},
											"score":            map[string]interface{}{"type": "NUMBER"},
											"max_score":        map[string]interface{}{"type": "NUMBER"},
											"is_correct":       map[string]interface{}{"type": "BOOLEAN"},
											"error_location":   map[string]interface{}{"type": "STRING"},
											"deduction_reason": map[string]interface{}{"type": "STRING"},
										},
										"required": []string{"step", "title", "score", "max_score", "is_correct"},
									},
								},
							},
							"required": []string{"questionId", "score", "maxScore", "explanation"},
						},
					},
				},
				"required": []string{"submissionId", "overallEssayFeedback", "questionResults"},
			},
		},
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}

	result, err := utils.AIBreaker.Execute(func() (interface{}, error) {
		return utils.ExecuteWithRetry(3, 1*time.Second, func() (interface{}, error) {
			resp, err := http.Post(url, "application/json", bytes.NewBuffer(body))
			if err != nil {
				return nil, err
			}
			defer resp.Body.Close()

			if resp.StatusCode != http.StatusOK {
				return nil, fmt.Errorf("Gemini API error: status %d", resp.StatusCode)
			}

			var res struct {
				Candidates []struct {
					Content struct {
						Parts []struct {
							Text string `json:"text"`
						} `json:"parts"`
					} `json:"content"`
				} `json:"candidates"`
			}

			if err := json.NewDecoder(resp.Body).Decode(&res); err != nil {
				return nil, err
			}

			if len(res.Candidates) > 0 && len(res.Candidates[0].Content.Parts) > 0 {
				text := utils.SanitizeJSON(res.Candidates[0].Content.Parts[0].Text)
				var response EssayBatchResponse
				if err := json.Unmarshal([]byte(text), &response); err == nil {
					return &response, nil
				} else {
					fmt.Printf("GradeEssayBatch JSON unmarshal error: %v\nRaw Text: %s\n", err, text)
				}
			}

			return nil, fmt.Errorf("Failed to parse Gemini essay response")
		})
	})

	if err != nil {
		return nil, err
	}

	return result.(*EssayBatchResponse), nil
}

// --- PROMPT 2: BATCH MC REASONING & COMPREHENSION ---

type ReasoningBatchQuestionItem struct {
	QuestionID         string `json:"questionId"`
	QuestionContent    string `json:"questionContent"`
	CorrectAnswer      string `json:"correctAnswer"`
	SelectedAnswer     string `json:"selectedAnswer"`
	StudentExplanation string `json:"studentExplanation"`
}

type ReasoningBatchInput struct {
	SubmissionID string                       `json:"submissionId"`
	ExamID       string                       `json:"examId"`
	StudentID    string                       `json:"studentId"`
	ExamTitle    string                       `json:"examTitle"`
	Questions    []ReasoningBatchQuestionItem `json:"questions"`
}

type ReasoningQuestionResult struct {
	QuestionID         string  `json:"questionId"`
	ReasoningScore     float64 `json:"reasoningScore"`
	ComprehensionLevel string  `json:"comprehensionLevel"`
	IsRandomGuess      bool    `json:"isRandomGuess"`
	ReasoningRemark    string  `json:"reasoningRemark"`
}

type ReasoningBatchResponse struct {
	SubmissionID                 string                    `json:"submissionId"`
	ExamID                       string                    `json:"examId"`
	StudentID                    string                    `json:"studentId"`
	OverallComprehensionFeedback string                    `json:"overallComprehensionFeedback"`
	QuestionResults              []ReasoningQuestionResult `json:"questionResults"`
}

func EvaluateReasoningBatchWithGemini(input ReasoningBatchInput) (*ReasoningBatchResponse, error) {
	if len(input.Questions) == 0 {
		return nil, nil
	}

	chunkSize := 10
	var combinedResults []ReasoningQuestionResult
	var feedbacks []string

	for i := 0; i < len(input.Questions); i += chunkSize {
		end := i + chunkSize
		if end > len(input.Questions) {
			end = len(input.Questions)
		}

		chunkInput := input
		chunkInput.Questions = input.Questions[i:end]

		resp, err := evaluateReasoningChunk(chunkInput)
		if err != nil {
			fmt.Printf("Warning: Reasoning chunk [%d:%d] evaluation error: %v\n", i, end, err)
			continue
		}
		if resp != nil {
			if resp.OverallComprehensionFeedback != "" {
				feedbacks = append(feedbacks, resp.OverallComprehensionFeedback)
			}
			combinedResults = append(combinedResults, resp.QuestionResults...)
		}
	}

	return &ReasoningBatchResponse{
		SubmissionID:                 input.SubmissionID,
		ExamID:                       input.ExamID,
		StudentID:                    input.StudentID,
		OverallComprehensionFeedback: strings.Join(feedbacks, " "),
		QuestionResults:              combinedResults,
	}, nil
}

func evaluateReasoningChunk(input ReasoningBatchInput) (*ReasoningBatchResponse, error) {
	apiKey := os.Getenv("GEMINI_API_KEY")
	if apiKey == "" {
		return nil, fmt.Errorf("GEMINI_API_KEY is not set")
	}

	model := os.Getenv("GEMINI_MODEL")
	if model == "" {
		model = "gemini-3.6-flash"
	}
	url := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s", model, apiKey)

	promptBytes, _ := json.MarshalIndent(input, "", "  ")
	prompt := fmt.Sprintf(`Bạn là một Chuyên gia Đánh giá Tư duy Toán học. 
Nhiệm vụ của bạn là phân tích lời giải thích (studentExplanation) đối với các câu TRẮC NGHIỆM để xác định học sinh THỰC SỰ HIỂU BÀI hay ĐOÁN MÒ / ĐÁNH BỪA (gieo xúc xắc).

---
### 📥 DỮ LIỆU ĐẦU VÀO (INPUT):
%s

---
### ⚙️ QUY TẮC ĐÁNH GIÁ TƯ DUY (COMPREHENSION LOGIC):
1. Phân loại tư duy (comprehensionLevel):
   - "HOAN_HAO": Lập luận chuẩn xác, hiểu sâu bản chất.
   - "HIEU_BAI": Hiểu đúng hướng nhưng diễn đạt chưa chặt chẽ.
   - "NHAM_LAN": Có suy luận nhưng nhầm lẫn công thức.
   - "DOAN_MO_DANH_BUA": Viết linh tinh, giải thích qua loa, hoặc thừa nhận đánh bừa/khoanh đại.
2. Cảnh báo đánh bừa (isRandomGuess):
   - true nếu thể hiện đoán mò, chọn đại, không có cơ sở toán học (kể cả khi chọn đúng đáp án).
   - false nếu thực sự có suy luận toán học.
3. Chấm điểm tư duy (reasoningScore từ 0.0 đến 10.0): 10 (Hoàn hảo), 7-8 (Hiểu bài), 4-6 (Nhầm lẫn), 0-3 (Đoán mò).
4. Viết overallComprehensionFeedback: Nhận xét tổng quan về mức độ hiểu bản chất toán học của học sinh.

---
### 📤 ĐỊNH DẠNG ĐẦU RA (OUTPUT FORMAT - JSON ONLY):
BẮT BUỘC giữ nguyên submissionId, examId, studentId từ đầu vào. Trả về đối tượng JSON theo mẫu:
{
  "submissionId": "%s",
  "examId": "%s",
  "studentId": "%s",
  "overallComprehensionFeedback": "string",
  "questionResults": [
    {
      "questionId": "string",
      "reasoningScore": number,
      "comprehensionLevel": "HOAN_HAO | HIEU_BAI | NHAM_LAN | DOAN_MO_DANH_BUA",
      "isRandomGuess": boolean,
      "reasoningRemark": "string"
    }
  ]
}
`, string(promptBytes), input.SubmissionID, input.ExamID, input.StudentID)

	payload := map[string]interface{}{
		"contents": []map[string]interface{}{
			{
				"parts": []map[string]interface{}{
					{"text": prompt},
				},
			},
		},
		"generationConfig": map[string]interface{}{
			"responseMimeType": "application/json",
			"maxOutputTokens":  8192,
			"responseSchema": map[string]interface{}{
				"type": "OBJECT",
				"properties": map[string]interface{}{
					"submissionId":                 map[string]interface{}{"type": "STRING"},
					"examId":                       map[string]interface{}{"type": "STRING"},
					"studentId":                    map[string]interface{}{"type": "STRING"},
					"overallComprehensionFeedback": map[string]interface{}{"type": "STRING"},
					"questionResults": map[string]interface{}{
						"type": "ARRAY",
						"items": map[string]interface{}{
							"type": "OBJECT",
							"properties": map[string]interface{}{
								"questionId":         map[string]interface{}{"type": "STRING"},
								"reasoningScore":     map[string]interface{}{"type": "NUMBER"},
								"comprehensionLevel": map[string]interface{}{"type": "STRING"},
								"isRandomGuess":      map[string]interface{}{"type": "BOOLEAN"},
								"reasoningRemark":    map[string]interface{}{"type": "STRING"},
							},
							"required": []string{"questionId", "reasoningScore", "comprehensionLevel", "isRandomGuess", "reasoningRemark"},
						},
					},
				},
				"required": []string{"submissionId", "overallComprehensionFeedback", "questionResults"},
			},
		},
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}

	result, err := utils.AIBreaker.Execute(func() (interface{}, error) {
		return utils.ExecuteWithRetry(3, 1*time.Second, func() (interface{}, error) {
			resp, err := http.Post(url, "application/json", bytes.NewBuffer(body))
			if err != nil {
				return nil, err
			}
			defer resp.Body.Close()

			if resp.StatusCode != http.StatusOK {
				return nil, fmt.Errorf("Gemini API error: status %d", resp.StatusCode)
			}

			var res struct {
				Candidates []struct {
					Content struct {
						Parts []struct {
							Text string `json:"text"`
						} `json:"parts"`
					} `json:"content"`
				} `json:"candidates"`
			}

			if err := json.NewDecoder(resp.Body).Decode(&res); err != nil {
				return nil, err
			}

			if len(res.Candidates) > 0 && len(res.Candidates[0].Content.Parts) > 0 {
				text := utils.SanitizeJSON(res.Candidates[0].Content.Parts[0].Text)
				var response ReasoningBatchResponse
				if err := json.Unmarshal([]byte(text), &response); err == nil {
					return &response, nil
				} else {
					fmt.Printf("EvaluateReasoningBatch JSON unmarshal error: %v\nRaw Text: %s\n", err, text)
				}
			}

			return nil, fmt.Errorf("Failed to parse Gemini reasoning response")
		})
	})

	if err != nil {
		return nil, err
	}

	return result.(*ReasoningBatchResponse), nil
}
