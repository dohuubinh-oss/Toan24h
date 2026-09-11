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
	config.DB.Where("id IN ? OR parent_id IN ?", exam.QuestionIDs, exam.QuestionIDs).Find(&allQuestions)
	
	hasEssay := false
	for _, q := range allQuestions {
		if q.Type == "Tự luận" {
			hasEssay = true
			break
		}
	}

	if hasEssay {
		go processExamGrading(submission.ID)
		c.JSON(http.StatusOK, gin.H{
			"status":  "pending",
			"message": "Nộp bài thành công. AI đang chấm điểm.",
			"data": gin.H{
				"resultId": submission.ID,
			},
		})
	} else {
		processExamGrading(submission.ID)
		c.JSON(http.StatusOK, gin.H{
			"status":  "graded",
			"message": "Chấm điểm hoàn tất.",
			"data": gin.H{
				"resultId": submission.ID,
			},
		})
	}
}

func processExamGrading(submissionID uuid.UUID) {
	var submission models.Submission
	if err := config.DB.First(&submission, "id = ?", submissionID).Error; err != nil {
		return
	}

	var answersMap map[string]models.QuestionAnswer
	if err := json.Unmarshal(submission.AnswersJSON, &answersMap); err != nil {
		return
	}

	var user models.User
	isVip := false
	if submission.UserID != nil {
		if err := config.DB.First(&user, "id = ?", submission.UserID).Error; err == nil {
			isVip = user.Role == "vip" || user.Role == "admin"
		}
	}

	var exam models.Exam
	if err := config.DB.First(&exam, "id = ?", submission.ExamID).Error; err != nil {
		return
	}

	var allQuestions []models.Question
	config.DB.Where("id IN ? OR parent_id IN ?", []string(exam.QuestionIDs), []string(exam.QuestionIDs)).Find(&allQuestions)

	var totalScore float64

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
				Score: 0,
				IsCorrect: false,
				StudentAnswer: "",
			}
		}

		if question.Type == "Tự luận" {
			if ans.StudentAnswer == "" {
				ans.Score = 0
				ans.IsCorrect = false
				ans.AIExplanation = "Không có câu trả lời."
			} else {
				aiResult, err := services.GradeEssayWithGemini(
					question.Content,
					question.CorrectAnswer,
					ans.StudentAnswer,
					float64(question.DifficultyPoint),
				)
				if err == nil && aiResult != nil {
					ans.Score = aiResult.Score
					ans.AIExplanation = aiResult.Explanation
					ans.ErrorLocation = aiResult.ErrorLocation
					if aiResult.Score > 0 {
						ans.IsCorrect = true
					}
				}
			}
			totalScore += ans.Score
		} else {
			re := regexp.MustCompile(`<[^>]*>`)
			cleanStudentAns := strings.TrimSpace(re.ReplaceAllString(ans.StudentAnswer, ""))
			cleanCorrectAns := strings.TrimSpace(re.ReplaceAllString(question.CorrectAnswer, ""))

			if cleanStudentAns == cleanCorrectAns && cleanCorrectAns != "" {
				ans.IsCorrect = true
				ans.Score = float64(question.DifficultyPoint)

				if isVip && ans.StudentExplanation != "" {
					aiReasoning, err := services.EvaluateReasoningWithGemini(
						question.Content,
						question.CorrectAnswer,
						ans.StudentExplanation,
					)
					if err == nil && aiReasoning != nil {
						ans.ReasoningScore = aiReasoning.Score
						ans.AIReasoningRemark = aiReasoning.Explanation
					}
				}
			} else {
				ans.IsCorrect = false
				ans.Score = 0
			}
			totalScore += ans.Score
		}
		
		// Update map reference
		answersMap[qID] = ans
	}

	updatedJSONBytes, _ := json.Marshal(answersMap)
	submission.AnswersJSON = updatedJSONBytes
	submission.TotalScore = totalScore
	submission.Status = models.StatusGraded

	config.DB.Save(&submission)

	if submission.UserID != nil {
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

	var questions []models.Question
	if len(qIDs) > 0 {
		config.DB.Where("id IN ?", qIDs).Find(&questions)
	}

	// Send everything back
	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data": gin.H{
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
