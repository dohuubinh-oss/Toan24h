package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/modeptrai/exam-model-backend/internal/config"
	"github.com/modeptrai/exam-model-backend/internal/models"
	"github.com/modeptrai/exam-model-backend/internal/services"
)

type SubmitExamRequest struct {
	Answers []struct {
		QuestionID    string `json:"questionId"`
		StudentAnswer string `json:"studentAnswer"`
		IsEssay       bool   `json:"isEssay"`
		ImagePath     string `json:"imagePath"`
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
			ExamResultID:  examResult.ID,
			QuestionID:    qID,
			StudentAnswer: ans.StudentAnswer,
			ImagePath:     ans.ImagePath,
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
			}
			mcqScore += detail.Score
		}
		
		config.DB.Save(detail)
	}

	// 3. Update result
	result.MCQScore = mcqScore
	result.EssayScore = essayScore
	result.TotalScore = mcqScore + essayScore
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
	}
}

func GetMyExamResults(c *gin.Context) {
	// Mock user ID for now as we don't have auth middleware applied fully
	// In reality: userID := c.MustGet("userID").(string)
	userID := "00000000-0000-0000-0000-000000000000" // fallback or get from query/token

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
	config.DB.Save(&detail)

	c.JSON(http.StatusOK, gin.H{"status": "success", "message": "Kháng cáo đã được gửi và đang chờ duyệt."})
}
