package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"regexp"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/modeptrai/exam-model-backend/internal/config"
	"github.com/modeptrai/exam-model-backend/internal/models"
	"github.com/modeptrai/exam-model-backend/internal/services"
)

type SubmitExamRequest struct {
	Answers []struct {
		QuestionID         string `json:"questionId"`
		StudentAnswer      string `json:"studentAnswer"`
		StudentExplanation string `json:"studentExplanation"`
		IsEssay            bool   `json:"isEssay"`
		ImagePath          string `json:"imagePath"`
	} `json:"answers"`
}

func SubmitExam(c *gin.Context) {
	examIDStr := c.Param("id")
	examID, err := uuid.Parse(examIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Invalid Exam ID"})
		return
	}

	var req SubmitExamRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Invalid request payload"})
		return
	}

	var studentID *uuid.UUID
	if val, exists := c.Get("userID"); exists {
		if id, ok := val.(uuid.UUID); ok {
			studentID = &id
		} else if idStr, ok := val.(string); ok {
			parsedID, err := uuid.Parse(idStr)
			if err == nil {
				studentID = &parsedID
			}
		}
	}

	answersMap := make(map[string]models.QuestionAnswer)
	for _, ans := range req.Answers {
		_, err := uuid.Parse(ans.QuestionID)
		if err != nil {
			continue // Skip invalid question IDs
		}
		
		qType := "Trắc nghiệm"
		if ans.IsEssay {
			qType = "Tự luận"
		}

		answersMap[ans.QuestionID] = models.QuestionAnswer{
			Type:               qType,
			StudentAnswer:      ans.StudentAnswer,
			StudentExplanation: ans.StudentExplanation,
			ImageURLs:          []string{ans.ImagePath},
			Appeal: models.AppealInfo{
				IsAppealed: false,
			},
		}
	}

	answersJSONBytes, err := json.Marshal(answersMap)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Failed to encode answers"})
		return
	}

	if studentID != nil && config.RedisClient != nil {
		lockKey := fmt.Sprintf("lock:submit_exam:%s:%s", studentID.String(), examIDStr)
		ctx := c.Request.Context()
		acquired, err := config.RedisClient.SetNX(ctx, lockKey, "locked", 15*time.Second).Result()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Lỗi hệ thống khi khóa yêu cầu nộp bài."})
			return
		}
		if !acquired {
			c.JSON(http.StatusTooManyRequests, gin.H{"status": "error", "message": "Hệ thống đang xử lý bài thi của bạn. Vui lòng không nộp nhiều lần."})
			return
		}
	}

	now := time.Now()
	var submission models.Submission
	var isUpdate bool
	if studentID != nil {
		if err := config.DB.Where("exam_id = ? AND user_id = ?", examID, studentID).First(&submission).Error; err == nil {
			isUpdate = true
		}
	}

	submission.ExamID = examID
	submission.UserID = studentID
	submission.Status = models.StatusInProgress
	submission.AnswersJSON = answersJSONBytes
	submission.SubmittedAt = &now
	submission.TotalScore = 0

	var dbErr error
	if isUpdate {
		dbErr = config.DB.Save(&submission).Error
	} else {
		dbErr = config.DB.Create(&submission).Error
	}

	if dbErr != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Failed to save submission"})
		return
	}

	// Determine if there are essay questions
	var exam models.Exam
	config.DB.First(&exam, "id = ?", examID)
	var allQuestions []models.Question
	questionIDSlice := []string(exam.QuestionIDs)
	if len(questionIDSlice) > 0 {
		config.DB.Where("id IN ? OR parent_id IN ?", questionIDSlice, questionIDSlice).Find(&allQuestions)
	}
	
	hasEssay := false
	for _, q := range allQuestions {
		if q.Type == "Tự luận" {
			hasEssay = true
			break
		}
	}

	if hasEssay {
		if err := services.QueueGradingJob(submission.ID); err != nil {
			fmt.Printf("Failed to queue grading job: %v\n", err)
		}
		c.JSON(http.StatusOK, gin.H{
			"status":  "pending",
			"message": "Nộp bài thành công. AI đang chấm điểm. Chúng tôi sẽ thông báo khi có kết quả.",
			"data": gin.H{
				"resultId": submission.ID,
			},
		})
	} else {
		if err := services.QueueGradingJob(submission.ID); err != nil {
			fmt.Printf("Failed to queue grading job: %v\n", err)
		}
		c.JSON(http.StatusOK, gin.H{
			"status":  "pending",
			"message": "Nộp bài thành công. Hệ thống đang xử lý điểm số.",
			"data": gin.H{
				"resultId": submission.ID,
			},
		})
	}
}

// ProcessExamGrading processes the grading for a submission synchronously. 
// It is intended to be called by the background grading workers.
func ProcessExamGrading(submissionID uuid.UUID) {
	var submission models.Submission
	if err := config.DB.First(&submission, "id = ?", submissionID).Error; err != nil {
		return
	}

	var answersMap map[string]models.QuestionAnswer
	if err := json.Unmarshal(submission.AnswersJSON, &answersMap); err != nil {
		return
	}

	var exam models.Exam
	if err := config.DB.First(&exam, "id = ?", submission.ExamID).Error; err != nil {
		return
	}

	var allQuestions []models.Question
	config.DB.Where("id IN ? OR parent_id IN ?", []string(exam.QuestionIDs), []string(exam.QuestionIDs)).Find(&allQuestions)

	var essayQuestions []services.EssayBatchQuestionItem
	var reasoningQuestions []services.ReasoningBatchQuestionItem
	var totalScore float64

	studentIDStr := ""
	if submission.UserID != nil {
		studentIDStr = submission.UserID.String()
	}

	for _, question := range allQuestions {
		// Ignore group parent questions because they don't have answers themselves, only their sub-questions do
		if question.TypeQuestion == "group" && question.ParentID == nil {
			continue
		}

		qID := question.ID.String()
		ans, exists := answersMap[qID]
		if !exists {
			// Initialize empty answer
			ans = models.QuestionAnswer{
				Score:         0,
				IsCorrect:     false,
				StudentAnswer: "",
			}
		}

		if question.Type == "Tự luận" {
			if ans.StudentAnswer == "" {
				ans.Score = 0
				ans.IsCorrect = false
				ans.AIExplanation = "Không có câu trả lời."
				answersMap[qID] = ans
			} else {
				essayQuestions = append(essayQuestions, services.EssayBatchQuestionItem{
					QuestionID:      qID,
					QuestionContent: question.Content,
					CorrectAnswer:   question.CorrectAnswer,
					MaxScore:        float64(question.DifficultyPoint),
					StudentAnswer:   ans.StudentAnswer,
				})
			}
		} else {
			re := regexp.MustCompile(`<[^>]*>`)
			cleanStudentAns := strings.TrimSpace(re.ReplaceAllString(ans.StudentAnswer, ""))
			cleanCorrectAns := strings.TrimSpace(re.ReplaceAllString(question.CorrectAnswer, ""))

			if cleanStudentAns == cleanCorrectAns && cleanCorrectAns != "" {
				ans.IsCorrect = true
				ans.Score = float64(question.DifficultyPoint)
			} else {
				ans.IsCorrect = false
				ans.Score = 0
			}

			// Gán AI Explanation từ SolutionGuide nếu có
			if question.SolutionGuide != "" {
				ans.AIExplanation = question.SolutionGuide
			}

			totalScore += ans.Score
			answersMap[qID] = ans

			// Đánh giá tư duy nếu học sinh nhập lời giải thích
			if ans.StudentExplanation != "" {
				reasoningQuestions = append(reasoningQuestions, services.ReasoningBatchQuestionItem{
					QuestionID:         qID,
					QuestionContent:    question.Content,
					CorrectAnswer:      question.CorrectAnswer,
					SelectedAnswer:     ans.StudentAnswer,
					StudentExplanation: ans.StudentExplanation,
				})
			}
		}
	}

	// BATCH CALL 1: ESSAY GRADING
	if len(essayQuestions) > 0 {
		essayInput := services.EssayBatchInput{
			SubmissionID: submission.ID.String(),
			ExamID:       submission.ExamID.String(),
			StudentID:    studentIDStr,
			ExamTitle:    exam.Title,
			Questions:    essayQuestions,
		}
		essayResp, err := services.GradeEssayBatchWithGemini(essayInput)
		if err == nil && essayResp != nil {
			submission.OverallEssayFeedback = essayResp.OverallEssayFeedback
			for _, res := range essayResp.QuestionResults {
				ans := answersMap[res.QuestionID]
				ans.Score = res.Score
				ans.IsCorrect = res.IsCorrect
				ans.AIExplanation = res.Explanation
				ans.ErrorLocation = res.ErrorLocation
				ans.DeductionReason = res.DeductionReason
				totalScore += ans.Score
				answersMap[res.QuestionID] = ans
			}
		} else {
			fmt.Printf("Batch essay grading failed: %v\n", err)
		}
	}

	// BATCH CALL 2: MC REASONING EVALUATION
	if len(reasoningQuestions) > 0 {
		reasoningInput := services.ReasoningBatchInput{
			SubmissionID: submission.ID.String(),
			ExamID:       submission.ExamID.String(),
			StudentID:    studentIDStr,
			ExamTitle:    exam.Title,
			Questions:    reasoningQuestions,
		}
		reasoningResp, err := services.EvaluateReasoningBatchWithGemini(reasoningInput)
		if err == nil && reasoningResp != nil {
			submission.OverallComprehensionFeedback = reasoningResp.OverallComprehensionFeedback
			for _, res := range reasoningResp.QuestionResults {
				ans := answersMap[res.QuestionID]
				ans.ReasoningScore = res.ReasoningScore
				ans.ComprehensionLevel = res.ComprehensionLevel
				ans.IsRandomGuess = res.IsRandomGuess
				ans.AIReasoningRemark = res.ReasoningRemark
				answersMap[res.QuestionID] = ans
			}
		} else {
			fmt.Printf("Batch reasoning evaluation failed: %v\n", err)
		}
	}

	updatedJSONBytes, _ := json.Marshal(answersMap)
	submission.AnswersJSON = updatedJSONBytes
	submission.TotalScore = totalScore
	submission.Status = models.StatusGraded

	config.DB.Save(&submission)

	if submission.UserID != nil {
		var user models.User
		config.DB.First(&user, "id = ?", submission.UserID)

		resultURL := fmt.Sprintf("%s/exam/%s/result", config.Env.FrontendURL, submission.ID.String())
		config.DB.Create(&models.Notification{
			UserID:  *submission.UserID,
			Title:   "Chấm điểm hoàn tất",
			Message: fmt.Sprintf("Bài thi của bạn đã được AI chấm xong. Xem lời giải tại: %s", resultURL),
			Link:    "/exam/" + submission.ID.String() + "/result",
		})

		if user.TelegramID != nil {
			notifier := services.NewTelegramNotifier()
			resultURL := fmt.Sprintf("%s/exam/%s/result", config.Env.FrontendURL, submission.ID.String())
			msg := fmt.Sprintf("✅ <b>Chấm điểm hoàn tất</b>\nBài thi của bạn đã được AI chấm xong.\nTổng điểm: %.2f\n\n🔗 Xem lời giải chi tiết: %s", submission.TotalScore, resultURL)
			go notifier.SendMessage(*user.TelegramID, msg)
		}
	}
}

func GetMyExamResults(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var userID string
	if id, ok := userIDVal.(uuid.UUID); ok {
		userID = id.String()
	} else if idStr, ok := userIDVal.(string); ok {
		userID = idStr
	} else {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user ID type"})
		return
	}

	var submissions []models.Submission
	if err := config.DB.Where("user_id = ?", userID).Order("created_at desc").Find(&submissions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch results"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "data": submissions})
}

func GetExamResultByID(c *gin.Context) {
	id := c.Param("id")
	var submission models.Submission
	if err := config.DB.First(&submission, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Result not found"})
		return
	}

	// We also need to attach the exam and questions information for the frontend to render it properly.
	// Instead of rewriting everything, we can just return the submission, and the frontend will fetch the exam details separately.
	// Actually, the previous implementation returned ExamResult with Preloaded Details and Questions.
	// Since JSON doesn't preload, we need to manually fetch questions if the frontend expects them in this same API call.
	// For simplicity, let's fetch questions and embed them in the response.

	var answersMap map[string]models.QuestionAnswer
	json.Unmarshal(submission.AnswersJSON, &answersMap)

	var qIDs []string
	for k := range answersMap {
		qIDs = append(qIDs, k)
	}

	var exam models.Exam
	config.DB.First(&exam, "id = ?", submission.ExamID)

	var questions []models.Question
	if len(exam.QuestionIDs) > 0 {
		config.DB.Where("id IN ? OR parent_id IN ?", []string(exam.QuestionIDs), []string(exam.QuestionIDs)).Find(&questions)
		// Sort parent questions to match exam.QuestionIDs order
		qMap := make(map[string]models.Question)
		var childQuestions []models.Question
		for _, q := range questions {
			if q.ParentID != nil && *q.ParentID != uuid.Nil {
				childQuestions = append(childQuestions, q)
			} else {
				qMap[q.ID.String()] = q
			}
		}
		var sortedQuestions []models.Question
		for _, qid := range exam.QuestionIDs {
			if q, exists := qMap[qid]; exists {
				sortedQuestions = append(sortedQuestions, q)
			}
		}
		sortedQuestions = append(sortedQuestions, childQuestions...)
		if len(sortedQuestions) > 0 {
			questions = sortedQuestions
		}
	} else if len(qIDs) > 0 {
		config.DB.Where("id IN ?", qIDs).Find(&questions)
	}

	// Send everything back
	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data": gin.H{
			"exam":       exam,
			"submission": submission,
			"questions":  questions,
		},
	})
}

func AppealExamResult(c *gin.Context) {
	id := c.Param("id")
	var req struct {
		QuestionID    string `json:"detailId"` // Repurposing detailId field from frontend for questionId
		AppealMessage string `json:"appealMessage"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	var submission models.Submission
	if err := config.DB.First(&submission, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Submission not found"})
		return
	}

	var answersMap map[string]models.QuestionAnswer
	if err := json.Unmarshal(submission.AnswersJSON, &answersMap); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse answers"})
		return
	}

	ans, exists := answersMap[req.QuestionID]
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Question answer not found in submission"})
		return
	}

	ans.Appeal.IsAppealed = true
	ans.Appeal.Status = models.AppealPending
	ans.Appeal.Message = req.AppealMessage
	answersMap[req.QuestionID] = ans

	updatedJSONBytes, _ := json.Marshal(answersMap)
	submission.AnswersJSON = updatedJSONBytes
	config.DB.Save(&submission)

	c.JSON(http.StatusOK, gin.H{"status": "success", "message": "Kháng cáo đã được gửi và đang chờ duyệt."})
}

func GetAppeals(c *gin.Context) {
	type AppealResponse struct {
		SubmissionID  string  `json:"resultId"` // Kept resultId for frontend compatibility
		QuestionID    string  `json:"detailId"` // Kept detailId for frontend compatibility
		ExamName      string  `json:"examName"`
		Question      string  `json:"question"`
		StudentAnswer string  `json:"studentAnswer"`
		AIExplanation string  `json:"aiExplanation"`
		Score         float64 `json:"score"`
		MaxScore      float64 `json:"maxScore"`
		AppealMessage string  `json:"appealMessage"`
	}

	var submissions []models.Submission
	// Simple text search for pending appeals. In production, use JSONB @> operator
	if err := config.DB.Where("answers_json::text LIKE ?", "%\"status\":\"PENDING\"%").Find(&submissions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch appeals"})
		return
	}

	var response []AppealResponse
	for _, sub := range submissions {
		var answersMap map[string]models.QuestionAnswer
		json.Unmarshal(sub.AnswersJSON, &answersMap)

		var exam models.Exam
		config.DB.First(&exam, "id = ?", sub.ExamID)

		for qID, ans := range answersMap {
			if ans.Appeal.IsAppealed && ans.Appeal.Status == models.AppealPending {
				var q models.Question
				config.DB.First(&q, "id = ?", qID)

				response = append(response, AppealResponse{
					SubmissionID:  sub.ID.String(),
					QuestionID:    qID,
					ExamName:      exam.Title,
					Question:      q.Content,
					StudentAnswer: ans.StudentAnswer,
					AIExplanation: ans.AIExplanation,
					Score:         ans.Score,
					MaxScore:      float64(q.DifficultyPoint),
					AppealMessage: ans.Appeal.Message,
				})
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "data": response})
}

func ResolveAppeal(c *gin.Context) {
	// The frontend passes the submissionID via path param
	id := c.Param("id") 
	var req struct {
		QuestionID      string  `json:"detailId"` // Reused detailId field 
		Status          string  `json:"status"` // APPROVED, REJECTED
		NewScore        float64 `json:"newScore"`
		TeacherFeedback string  `json:"teacherFeedback"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload"})
		return
	}

	var submission models.Submission
	if err := config.DB.First(&submission, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Submission not found"})
		return
	}

	var answersMap map[string]models.QuestionAnswer
	json.Unmarshal(submission.AnswersJSON, &answersMap)

	ans, exists := answersMap[req.QuestionID]
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Question answer not found"})
		return
	}

	oldScore := ans.Score

	ans.Appeal.Status = models.AppealStatus(req.Status)
	ans.Appeal.TeacherFeedback = req.TeacherFeedback
	if req.Status == "APPROVED" {
		ans.Score = req.NewScore
		if req.NewScore > 0 {
			ans.IsCorrect = true
		} else {
			ans.IsCorrect = false
		}
	}
	
	answersMap[req.QuestionID] = ans
	updatedJSONBytes, _ := json.Marshal(answersMap)
	submission.AnswersJSON = updatedJSONBytes

	if req.Status == "APPROVED" {
		scoreDiff := req.NewScore - oldScore
		submission.TotalScore += scoreDiff
	}

	config.DB.Save(&submission)

	if submission.UserID != nil {
		config.DB.Create(&models.Notification{
			UserID:  *submission.UserID,
			Title:   "Kết quả kháng cáo",
			Message: fmt.Sprintf("Kháng cáo của bạn đã được giáo viên phản hồi: %s", req.TeacherFeedback),
			Link:    "/exam/" + submission.ID.String() + "/result",
		})
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "message": "Đã duyệt kháng cáo"})
}
