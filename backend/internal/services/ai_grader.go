package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"
)

type GradingResult struct {
	Score         float64 `json:"score"`
	Explanation   string  `json:"explanation"`
	ErrorLocation string  `json:"errorLocation"`
}

func GradeEssayWithGemini(questionContent, correctAnswer, studentAnswer string, maxScore float64) (*GradingResult, error) {
	apiKey := os.Getenv("GEMINI_API_KEY")
	if apiKey == "" {
		return nil, fmt.Errorf("GEMINI_API_KEY is not set")
	}

	url := "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=" + apiKey

	prompt := fmt.Sprintf(`Bạn là một giáo viên Toán khó tính nhưng công tâm. Nhiệm vụ của bạn là chấm điểm bài làm tự luận của học sinh.
Thông tin câu hỏi:
- Đề bài: %s
- Đáp án / Thang điểm chuẩn: %s
- Điểm tối đa: %v

Bài làm của học sinh:
"%s"

Yêu cầu:
1. Đối chiếu bài làm của học sinh với đáp án chuẩn.
2. Đưa ra điểm số (từ 0 đến %v). Điểm có thể lẻ đến 0.25.
3. Đưa ra lời nhận xét ngắn gọn. NẾU HỌC SINH LÀM SAI, bắt buộc phải trích dẫn lại câu/đoạn viết sai của học sinh và đánh dấu vị trí sai đó (ví dụ: "Bạn làm sai ở bước: [trích dẫn bước sai]").
4. KHÔNG chấm điểm cho những bài làm lạc đề, gian lận, hoặc viết linh tinh (chấm 0 điểm).
Trả về kết quả ĐÚNG định dạng JSON sau: { "score": number, "explanation": "string", "errorLocation": "string | null" }`, questionContent, correctAnswer, maxScore, studentAnswer, maxScore)

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
		},
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}

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
		text := res.Candidates[0].Content.Parts[0].Text
		text = strings.TrimPrefix(text, "```json")
		text = strings.TrimSuffix(text, "```")
		var result GradingResult
		if err := json.Unmarshal([]byte(text), &result); err == nil {
			return &result, nil
		}
	}

	return nil, fmt.Errorf("Failed to parse Gemini response")
}

type ReasoningResult struct {
	Score       float64 `json:"score"`
	Explanation string  `json:"explanation"`
}

func EvaluateReasoningWithGemini(questionContent, correctAnswer, studentExplanation string) (*ReasoningResult, error) {
	apiKey := os.Getenv("GEMINI_API_KEY")
	if apiKey == "" {
		return nil, fmt.Errorf("GEMINI_API_KEY is not set")
	}

	url := "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=" + apiKey

	prompt := fmt.Sprintf(`Bạn là một giáo viên Toán tận tâm và giàu kinh nghiệm. Học sinh đã làm một câu hỏi và đưa ra lời giải thích/lập luận cho lựa chọn của mình.
Nhiệm vụ của bạn là đánh giá lời giải thích này để xem học sinh có thực sự hiểu bài hay không, lập luận đã logic và chính xác chưa.

Thông tin câu hỏi:
- Đề bài: %s
- Đáp án đúng: %s

Lời giải thích của học sinh:
"%s"

Yêu cầu:
1. Đánh giá sự logic, chính xác và mức độ hiểu bài trong lời giải thích của học sinh.
2. Chấm điểm tư duy từ 0 đến 10 (10: Hoàn hảo, lập luận rất sâu sắc; 7-9: Hiểu đúng bản chất; 4-6: Hiểu một phần nhưng chưa chặt chẽ hoặc có nhầm lẫn; 1-3: Suy luận sai; 0: Viết linh tinh, đoán mò).
3. Viết lời nhận xét súc tích, chỉ rõ điểm tốt hoặc lỗi sai trong suy luận của học sinh, kèm hướng dẫn ngắn gọn nếu cần.

Trả về kết quả ĐÚNG định dạng JSON sau: { "score": number, "explanation": "string" }`, questionContent, correctAnswer, studentExplanation)

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
		},
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}

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
		text := res.Candidates[0].Content.Parts[0].Text
		text = strings.TrimPrefix(text, "```json")
		text = strings.TrimSuffix(text, "```")
		var result ReasoningResult
		if err := json.Unmarshal([]byte(text), &result); err == nil {
			return &result, nil
		}
	}

	return nil, fmt.Errorf("Failed to parse Gemini response")
}

// BATCH PROCESSING
type EssayBatchInput struct {
	ID              string  `json:"id"`
	QuestionContent string  `json:"questionContent"`
	CorrectAnswer   string  `json:"correctAnswer"`
	StudentAnswer   string  `json:"studentAnswer"`
	MaxScore        float64 `json:"maxScore"`
}

type EssayBatchResult struct {
	ID            string  `json:"id"`
	Score         float64 `json:"score"`
	Explanation   string  `json:"explanation"`
	ErrorLocation string  `json:"errorLocation"`
}

func GradeEssayBatchWithGemini(inputs []EssayBatchInput) ([]EssayBatchResult, error) {
	if len(inputs) == 0 {
		return nil, nil
	}
	apiKey := os.Getenv("GEMINI_API_KEY")
	if apiKey == "" {
		return nil, fmt.Errorf("GEMINI_API_KEY is not set")
	}

	url := "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=" + apiKey

	promptBytes, _ := json.MarshalIndent(inputs, "", "  ")
	prompt := fmt.Sprintf(`Bạn là một giáo viên Toán khó tính nhưng công tâm. Nhiệm vụ của bạn là chấm điểm một HỆ THỐNG CÁC BÀI LÀM TỰ LUẬN của học sinh.
Dưới đây là danh sách các bài làm, mỗi bài có một "id", đề bài "questionContent", đáp án "correctAnswer", bài làm của học sinh "studentAnswer", và điểm tối đa "maxScore".

Danh sách bài làm:
%s

Yêu cầu:
1. Đối chiếu bài làm của học sinh với đáp án chuẩn.
2. Đưa ra điểm số (từ 0 đến maxScore tương ứng). Điểm có thể lẻ đến 0.25.
3. Nhận xét ngắn gọn. NẾU HỌC SINH LÀM SAI, trích dẫn lại câu sai vào ErrorLocation.
4. KHÔNG chấm điểm bài lạc đề (chấm 0 điểm).
Trả về mảng JSON kết quả tương ứng với danh sách đầu vào.
`, string(promptBytes))

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
			"maxOutputTokens":  2000,
			"responseSchema": map[string]interface{}{
				"type": "array",
				"items": map[string]interface{}{
					"type": "object",
					"properties": map[string]interface{}{
						"id":            map[string]interface{}{"type": "string"},
						"score":         map[string]interface{}{"type": "number"},
						"explanation":   map[string]interface{}{"type": "string"},
						"errorLocation": map[string]interface{}{"type": "string"},
					},
					"required": []string{"id", "score", "explanation"},
				},
			},
		},
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}

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
		text := res.Candidates[0].Content.Parts[0].Text
		var results []EssayBatchResult
		if err := json.Unmarshal([]byte(text), &results); err == nil {
			return results, nil
		}
	}

	return nil, fmt.Errorf("Failed to parse Gemini response")
}

type ReasoningBatchInput struct {
	ID                 string `json:"id"`
	QuestionContent    string `json:"questionContent"`
	CorrectAnswer      string `json:"correctAnswer"`
	StudentExplanation string `json:"studentExplanation"`
}

type ReasoningBatchResult struct {
	ID          string  `json:"id"`
	Score       float64 `json:"score"`
	Explanation string  `json:"explanation"`
}

func EvaluateReasoningBatchWithGemini(inputs []ReasoningBatchInput) ([]ReasoningBatchResult, error) {
	if len(inputs) == 0 {
		return nil, nil
	}
	apiKey := os.Getenv("GEMINI_API_KEY")
	if apiKey == "" {
		return nil, fmt.Errorf("GEMINI_API_KEY is not set")
	}

	url := "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=" + apiKey

	promptBytes, _ := json.MarshalIndent(inputs, "", "  ")
	prompt := fmt.Sprintf(`Bạn là một giáo viên Toán tận tâm. Dưới đây là danh sách các lời giải thích tư duy của học sinh cho nhiều câu hỏi khác nhau.
Danh sách giải thích:
%s

Yêu cầu:
1. Đánh giá sự logic, chính xác và mức độ hiểu bài.
2. Chấm điểm tư duy từ 0 đến 10 (10: Hoàn hảo; 7-9: Hiểu đúng; 4-6: Có nhầm lẫn; 1-3: Sai; 0: Đoán mò).
3. Nhận xét súc tích chỉ rõ điểm tốt/lỗi sai.
Trả về mảng JSON kết quả tương ứng.
`, string(promptBytes))

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
			"maxOutputTokens":  2000,
			"responseSchema": map[string]interface{}{
				"type": "array",
				"items": map[string]interface{}{
					"type": "object",
					"properties": map[string]interface{}{
						"id":          map[string]interface{}{"type": "string"},
						"score":       map[string]interface{}{"type": "number"},
						"explanation": map[string]interface{}{"type": "string"},
					},
					"required": []string{"id", "score", "explanation"},
				},
			},
		},
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}

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
		text := res.Candidates[0].Content.Parts[0].Text
		var results []ReasoningBatchResult
		if err := json.Unmarshal([]byte(text), &results); err == nil {
			return results, nil
		}
	}

	return nil, fmt.Errorf("Failed to parse Gemini response")
}
