package services

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"sort"
	"strings"
	"time"

	"github.com/modeptrai/exam-model-backend/internal/models"
	"github.com/modeptrai/exam-model-backend/internal/utils"
	"gorm.io/gorm"
)

type FAQRagService struct {
	db     *gorm.DB
	client *http.Client
}

func NewFAQRagService(db *gorm.DB) *FAQRagService {
	return &FAQRagService{
		db: db,
		client: &http.Client{
			Timeout: 15 * time.Second,
		},
	}
}

type FAQSearchResult struct {
	ID       string `json:"id"`
	Question string `json:"question"`
	Answer   string `json:"answer"`
	Category string `json:"category"`
}

type FAQAnswerResponse struct {
	Answer  string            `json:"answer"`
	Sources []FAQSearchResult `json:"sources"`
}

// SearchRelevantDocuments finds the most relevant FAQs using keyword and semantic search
func (s *FAQRagService) SearchRelevantDocuments(query string, limit int) ([]models.FAQDocument, error) {
	if s.db == nil {
		return nil, nil
	}

	if limit <= 0 {
		limit = 3
	}

	trimmedQuery := strings.TrimSpace(query)
	if trimmedQuery == "" {
		var faqs []models.FAQDocument
		err := s.db.Where("is_active = ?", true).Limit(limit).Find(&faqs).Error
		return faqs, err
	}

	// 1. Try direct phrase match first (e.g. "chống gian lận" or "gian lận" or "gói VIP")
	cleanQuery := strings.Map(func(r rune) rune {
		if strings.ContainsRune("?!.,;:\"'()[]{}/-~", r) {
			return ' '
		}
		return r
	}, trimmedQuery)
	cleanQuery = strings.TrimSpace(cleanQuery)

	var matchedFAQs []models.FAQDocument
	if cleanQuery != "" {
		phraseParam := "%" + cleanQuery + "%"
		_ = s.db.Where("is_active = ? AND (question ILIKE ? OR keywords ILIKE ? OR answer ILIKE ?)", true, phraseParam, phraseParam, phraseParam).
			Limit(limit).
			Find(&matchedFAQs).Error
		if len(matchedFAQs) > 0 {
			return matchedFAQs, nil
		}
	}

	// 2. Try individual keyword matching
	rawKeywords := strings.Fields(strings.ToLower(cleanQuery))
	if len(rawKeywords) > 0 {
		var conditions []string
		var args []interface{}
		for _, kw := range rawKeywords {
			kw = strings.TrimSpace(kw)
			if len([]rune(kw)) < 2 {
				continue
			}
			param := "%" + kw + "%"
			conditions = append(conditions, "(question ILIKE ? OR keywords ILIKE ? OR answer ILIKE ?)")
			args = append(args, param, param, param)
		}

		if len(conditions) > 0 {
			orQuery := strings.Join(conditions, " OR ")
			var candidates []models.FAQDocument
			_ = s.db.Where("is_active = ?", true).
				Where(orQuery, args...).
				Find(&candidates).Error

			if len(candidates) > 0 {
				// Score and rank candidates by relevance
				type scoredDoc struct {
					doc   models.FAQDocument
					score int
				}
				scoredList := make([]scoredDoc, len(candidates))
				lowQuery := strings.ToLower(cleanQuery)

				for i, c := range candidates {
					score := 0
					qLow := strings.ToLower(c.Question)
					kLow := strings.ToLower(c.Keywords)
					aLow := strings.ToLower(c.Answer)

					if strings.Contains(qLow, lowQuery) {
						score += 100
					}
					if strings.Contains(kLow, lowQuery) {
						score += 60
					}

					for _, kw := range rawKeywords {
						if len([]rune(kw)) < 2 {
							continue
						}
						// Common stop words have lower weight
						weight := 10
						if kw == "là" || kw == "gì" || kw == "và" || kw == "các" || kw == "cho" || kw == "của" || kw == "như" || kw == "thế" || kw == "nào" {
							weight = 1
						}

						if strings.Contains(qLow, kw) {
							score += weight * 3
						}
						if strings.Contains(kLow, kw) {
							score += weight * 2
						}
						if strings.Contains(aLow, kw) {
							score += weight
						}
					}
					scoredList[i] = scoredDoc{doc: c, score: score}
				}

				sort.Slice(scoredList, func(i, j int) bool {
					return scoredList[i].score > scoredList[j].score
				})

				resCount := limit
				if len(scoredList) < resCount {
					resCount = len(scoredList)
				}
				result := make([]models.FAQDocument, resCount)
				for i := 0; i < resCount; i++ {
					result[i] = scoredList[i].doc
				}
				return result, nil
			}
		}
	}

	// If keyword search found results, return them
	if len(matchedFAQs) > 0 {
		return matchedFAQs, nil
	}

	// Fallback to general active FAQs
	var fallbackFAQs []models.FAQDocument
	err := s.db.Where("is_active = ?", true).Limit(limit).Find(&fallbackFAQs).Error
	return fallbackFAQs, err
}

// AskFAQ generates an AI-grounded response based on system knowledge base
func (s *FAQRagService) AskFAQ(ctx context.Context, userQuestion string) (*FAQAnswerResponse, error) {
	cleanQuestion := strings.TrimSpace(userQuestion)
	if cleanQuestion == "" {
		return &FAQAnswerResponse{
			Answer:  "Dạ toan6789.vn xin chào bạn! Bạn vui lòng nhập câu hỏi để mình hỗ trợ nhé.",
			Sources: nil,
		}, nil
	}

	// 1. Retrieve relevant FAQs from knowledge base
	docs, err := s.SearchRelevantDocuments(cleanQuestion, 3)
	if err != nil {
		log.Printf("[FAQ RAG] Error searching documents: %v", err)
	}

	var sources []FAQSearchResult
	for _, doc := range docs {
		sources = append(sources, FAQSearchResult{
			ID:       doc.ID.String(),
			Question: doc.Question,
			Answer:   doc.Answer,
			Category: doc.Category,
		})
	}

	// If no documents found in knowledge base
	if len(docs) == 0 {
		return &FAQAnswerResponse{
			Answer:  "Dạ hiện tại toan6789.vn chưa tìm thấy thông tin chính thức phù hợp với câu hỏi của bạn. Bạn vui lòng liên hệ trực tiếp qua kênh hỗ trợ hoặc Telegram @toan6789_bot để được giải đáp chi tiết ạ!",
			Sources: nil,
		}, nil
	}

	// 2. Synthesize context for Gemini
	var contextBuilder strings.Builder
	for i, doc := range docs {
		contextBuilder.WriteString(fmt.Sprintf("%d. Câu hỏi thường gặp: %s\n   Nội dung giải đáp: %s\n\n", i+1, doc.Question, doc.Answer))
	}

	prompt := fmt.Sprintf(`Vai trò: Bạn là Trợ lý AI học tập thông minh và thân thiện của nền tảng toan6789.vn (Hệ thống luyện thi Toán THCS chuyên sâu Lớp 5 - 9).
Nhiệm vụ: Trả lời câu hỏi của người dùng dựa TRỰC TIẾP và CHUẨN XÁC vào các tài liệu tham khảo chính thức của toan6789.vn dưới đây.

Quy tắc ứng xử:
1. Luôn giữ thái độ lễ phép, nhã nhặn, xưng "Dạ toan6789.vn xin giải đáp..." hoặc "Dạ toan6789.vn xin gửi tới bạn thông tin...".
2. Đi thẳng vào trọng tâm, giải thích ngắn gọn, súc tích, dễ hiểu. Định dạng danh sách nếu có nhiều bước.
3. Chỉ trả lời dựa trên tài liệu được cung cấp. Không bịa đặt giá tiền hay tính năng không có. Nếu câu hỏi không có trong tài liệu, hãy lịch sự thông báo và hướng dẫn liên hệ Telegram @toan6789_bot.

TÀI LIỆU THAM KHẢO TỪ TOAN6789.VN:
%s

CÂU HỎI CỦA KHÁCH HÀNG:
%s`, contextBuilder.String(), cleanQuestion)

	// 3. Call Gemini via GlobalGeminiPool
	candidateModels := []string{"gemini-3.8-flash", "gemini-3.5-flash", "gemini-2.5-flash"}
	requestBody := map[string]interface{}{
		"contents": []map[string]interface{}{
			{
				"role": "user",
				"parts": []map[string]interface{}{
					{"text": prompt},
				},
			},
		},
		"generationConfig": map[string]interface{}{
			"temperature":     0.2,
			"maxOutputTokens": 600,
		},
	}

	bodyBytes, err := json.Marshal(requestBody)
	if err != nil {
		// Fallback to direct top answer if marshal fails
		return &FAQAnswerResponse{
			Answer:  "Dạ toan6789.vn xin gửi tới bạn thông tin liên quan nhất:\n\n" + docs[0].Answer,
			Sources: sources,
		}, nil
	}

	for _, currentModel := range candidateModels {
		if utils.GlobalGeminiPool == nil {
			break
		}

		resp, err := utils.GlobalGeminiPool.ExecuteWithRetry(func(currentKey string) (*http.Response, error) {
			apiUrl := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s", currentModel, currentKey)
			httpReq, err := http.NewRequestWithContext(ctx, "POST", apiUrl, bytes.NewReader(bodyBytes))
			if err != nil {
				return nil, err
			}
			httpReq.Header.Set("Content-Type", "application/json")
			return s.client.Do(httpReq)
		})

		if err != nil {
			log.Printf("[FAQ RAG] Model %s failed: %v", currentModel, err)
			continue
		}

		respBody, err := io.ReadAll(resp.Body)
		resp.Body.Close()
		if err != nil || resp.StatusCode != http.StatusOK {
			log.Printf("[FAQ RAG] Model %s status %d", currentModel, resp.StatusCode)
			continue
		}

		var geminiResp struct {
			Candidates []struct {
				Content struct {
					Parts []struct {
						Text string `json:"text"`
					} `json:"parts"`
				} `json:"content"`
			} `json:"candidates"`
		}

		if err := json.Unmarshal(respBody, &geminiResp); err == nil && len(geminiResp.Candidates) > 0 && len(geminiResp.Candidates[0].Content.Parts) > 0 {
			aiAnswer := strings.TrimSpace(geminiResp.Candidates[0].Content.Parts[0].Text)
			if aiAnswer != "" {
				return &FAQAnswerResponse{
					Answer:  aiAnswer,
					Sources: sources,
				}, nil
			}
		}
	}

	// 4. Graceful Fallback: Return best matching FAQ direct answer
	return &FAQAnswerResponse{
		Answer:  "Dạ toan6789.vn xin gửi tới bạn thông tin liên quan nhất:\n\n" + docs[0].Answer,
		Sources: sources,
	}, nil
}
