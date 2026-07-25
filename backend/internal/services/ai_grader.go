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
