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

	prompt := fmt.Sprintf(`Bạn là một giáo viên Toán thông minh. Học sinh đã chọn đúng đáp án cho một câu hỏi trắc nghiệm, và đưa ra lời giải thích cho lựa chọn của mình.
Nhiệm vụ của bạn là đánh giá lời giải thích này để xem học sinh có thực sự hiểu bài hay không, hay chỉ là đoán mò.

Thông tin câu hỏi:
- Đề bài: %s
- Đáp án đúng: %s

Lời giải thích của học sinh:
"%s"

Yêu cầu:
1. Đánh giá sự logic, chính xác và mức độ hiểu bài trong lời giải thích của học sinh.
2. Chấm điểm tư duy từ 0 đến 10. (10: Hoàn hảo, hiểu rất sâu; 5-9: Hiểu cơ bản nhưng còn thiếu sót; 1-4: Giải thích sai lệch, không logic; 0: Không giải thích hoặc giải thích linh tinh, đoán mò).
3. Viết một lời nhận xét, giải thích ngắn gọn, súc tích (có thể kèm theo lời giải đúng ngắn gọn để học sinh tham khảo).

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
