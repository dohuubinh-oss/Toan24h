package handlers

import (
	"fmt"
	"net/http"

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

	// For authenticated users, extract StudentID from Context
	var studentID *uuid.UUID
	if val, exists := c.Get("userID"); exists {
		if id, ok := val.(uuid.UUID); ok {
			studentID = &id
		}
	}

	// Create ExamResult with PENDING status
	examResult := models.ExamResult{
		ExamID:    examID,
		StudentID: studentID,
		Status:    models.StatusPending,
	}

	if err := config.DB.Create(&examResult).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Failed to create exam result"})
		return
	}

	// Create ResultDetails
	for _, ans := range req.Answers {
		qID, err := uuid.Parse(ans.QuestionID)
		if err != nil {
			continue // Skip invalid question IDs
		}

		detail := models.ResultDetail{
			ExamResultID:       examResult.ID,
			QuestionID:         qID,
			StudentAnswer:      ans.StudentAnswer,
			StudentExplanation: ans.StudentExplanation,
			ImagePath:          ans.ImagePath,
		}
		config.DB.Create(&detail)
	}

	// TODO: Dispatch Background Job to Grade Exam
	go processExamGrading(examResult.ID)

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Nộp bài thành công. AI đang chấm điểm.",
		"data": gin.H{
			"resultId": examResult.ID,
		},
	})
}

func processExamGrading(resultID uuid.UUID) {
	// 1. Fetch ExamResult and details
	var result models.ExamResult
	if err := config.DB.Preload("Details").First(&result, "id = ?", resultID).Error; err != nil {
		return // Not found or error
	}

	var mcqScore, essayScore float64
	var totalReasoningScore float64

	// Fetch User to check VIP status
	var user models.User
	isVip := false
	if result.StudentID != nil {
		if err := config.DB.First(&user, "id = ?", result.StudentID).Error; err == nil {
			isVip = user.Role == "vip"
		}
	}

	// 2. Process each detail
	for i := range result.Details {
		detail := &result.Details[i]
		
		var question models.Question
		if err := config.DB.First(&question, "id = ?", detail.QuestionID).Error; err != nil {
			continue
		}

		if question.Type == "Tự luận" {
			// Send to Gemini
			aiResult, err := services.GradeEssayWithGemini(
				question.Content, 
				question.CorrectAnswer, 
				detail.StudentAnswer, 
				float64(question.DifficultyPoint),
			)
			if err == nil && aiResult != nil {
				detail.Score = aiResult.Score
				detail.AIExplanation = aiResult.Explanation
				detail.ErrorLocation = aiResult.ErrorLocation
				if aiResult.Score > 0 {
					detail.IsCorrect = true // Partially or fully correct
				}
			}
			essayScore += detail.Score
		} else {
			// MCQ logic
			if detail.StudentAnswer == question.CorrectAnswer {
				detail.IsCorrect = true
				detail.Score = float64(question.DifficultyPoint)

				// VIP Reasoning Grading
				if isVip && detail.StudentExplanation != "" {
					aiReasoning, err := services.EvaluateReasoningWithGemini(
						question.Content,
						question.CorrectAnswer,
						detail.StudentExplanation,
					)
					if err == nil && aiReasoning != nil {
						detail.ReasoningScore = aiReasoning.Score
						detail.AIReasoningRemark = aiReasoning.Explanation
						totalReasoningScore += aiReasoning.Score
					}
				}
			}
			mcqScore += detail.Score
		}
		
		config.DB.Save(detail)
	}

	// 3. Update result
	result.MCQScore = mcqScore
	result.EssayScore = essayScore
	result.TotalScore = mcqScore + essayScore
	result.TotalReasoningScore = totalReasoningScore
	if isVip {
		result.OverallReasoningRemark = fmt.Sprintf("Điểm tư duy: %.2f. Hãy xem nhận xét chi tiết ở từng câu trắc nghiệm.", totalReasoningScore)
	}
	result.Status = models.StatusCompleted
	config.DB.Save(&result)

	// Create a notification for the user
	if result.StudentID != nil {
		config.DB.Create(&models.Notification{
			UserID:  *result.StudentID,
			Title:   "Chấm điểm hoàn tất",
			Message: "Bài thi của bạn đã được AI chấm xong. Nhấn để xem kết quả chi tiết.",
			Link:    "/exam/" + result.ID.String() + "/result",
		})

		if user.TelegramID != nil {
			notifier := services.NewTelegramNotifier()
			msg := fmt.Sprintf("✅ <b>Chấm điểm hoàn tất</b>\nBài thi của bạn đã được AI chấm xong.\nTổng điểm: %.2f\nHãy truy cập website để xem chi tiết.", result.TotalScore)
			// Send message in a goroutine so it doesn't block
			go notifier.SendMessage(*user.TelegramID, msg)
		}
	}
}

func GetMyExamResults(c *gin.Context) {
	// Extract userID from context (set by AuthMiddleware)
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	
	// userID could be string or uuid.UUID depending on token claims parsing
	var userID string
	if id, ok := userIDVal.(uuid.UUID); ok {
		userID = id.String()
	} else if idStr, ok := userIDVal.(string); ok {
		userID = idStr
	} else {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user ID type"})
		return
	}

	var results []models.ExamResult
	if err := config.DB.Where("student_id = ?", userID).Order("created_at desc").Find(&results).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch results"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "data": results})
}

func GetExamResultByID(c *gin.Context) {
	id := c.Param("id")
	var result models.ExamResult
	if err := config.DB.Preload("Details").Preload("Exam").First(&result, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Result not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "data": result})
}

func AppealExamResult(c *gin.Context) {
	id := c.Param("id")
	var req struct {
		DetailID      string `json:"detailId"`
		AppealMessage string `json:"appealMessage"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	var detail models.ResultDetail
	if err := config.DB.First(&detail, "id = ? AND exam_result_id = ?", req.DetailID, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Result detail not found"})
		return
	}

	detail.AppealStatus = "PENDING"
	detail.IsAppealed = true
	detail.AppealMessage = req.AppealMessage
	config.DB.Save(&detail)

	c.JSON(http.StatusOK, gin.H{"status": "success", "message": "Kháng cáo đã được gửi và đang chờ duyệt."})
}

func GetAppeals(c *gin.Context) {
	type AppealResponse struct {
		DetailID      string  `json:"detailId"`
		ResultID      string  `json:"resultId"`
		ExamName      string  `json:"examName"`
		Question      string  `json:"question"`
		StudentAnswer string  `json:"studentAnswer"`
		AIExplanation string  `json:"aiExplanation"`
		Score         float64 `json:"score"`
		MaxScore      float64 `json:"maxScore"`
		AppealMessage string  `json:"appealMessage"`
	}

	var details []models.ResultDetail
	if err := config.DB.Where("appeal_status = ?", "PENDING").Find(&details).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch appeals"})
		return
	}

	var response []AppealResponse
	for _, d := range details {
		var q models.Question
		config.DB.First(&q, "id = ?", d.QuestionID)

		var res models.ExamResult
		config.DB.First(&res, "id = ?", d.ExamResultID)

		var exam models.Exam
		config.DB.First(&exam, "id = ?", res.ExamID)

		response = append(response, AppealResponse{
			DetailID:      d.ID.String(),
			ResultID:      res.ID.String(),
			ExamName:      exam.Title,
			Question:      q.Content,
			StudentAnswer: d.StudentAnswer,
			AIExplanation: d.AIExplanation,
			Score:         d.Score,
			MaxScore:      float64(q.DifficultyPoint),
			AppealMessage: d.AppealMessage,
		})
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "data": response})
}

func ResolveAppeal(c *gin.Context) {
	id := c.Param("id")
	var req struct {
		Status          string  `json:"status"` // APPROVED, REJECTED
		NewScore        float64 `json:"newScore"`
		TeacherFeedback string  `json:"teacherFeedback"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload"})
		return
	}

	var detail models.ResultDetail
	if err := config.DB.First(&detail, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Result detail not found"})
		return
	}

	oldScore := detail.Score

	detail.AppealStatus = req.Status
	detail.TeacherFeedback = req.TeacherFeedback
	if req.Status == "APPROVED" {
		detail.Score = req.NewScore
		if req.NewScore > 0 {
			detail.IsCorrect = true
		} else {
			detail.IsCorrect = false
		}
	}
	config.DB.Save(&detail)

	// Recalculate ExamResult Score
	var res models.ExamResult
	if err := config.DB.First(&res, "id = ?", detail.ExamResultID).Error; err == nil {
		if req.Status == "APPROVED" {
			scoreDiff := req.NewScore - oldScore
			res.EssayScore += scoreDiff // Assuming appeals are mostly for essays
			res.TotalScore += scoreDiff
			config.DB.Save(&res)
		}
		
		if res.StudentID != nil {
			config.DB.Create(&models.Notification{
				UserID:  *res.StudentID,
				Title:   "Kết quả kháng cáo",
				Message: "Kháng cáo của bạn đã được giáo viên duyệt. Nhấn để xem phản hồi.",
				Link:    "/exam/" + res.ID.String() + "/result",
			})
		}
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "message": "Đã duyệt kháng cáo"})
}
