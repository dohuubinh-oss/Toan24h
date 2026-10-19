package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/modeptrai/exam-model-backend/internal/config"
	"github.com/modeptrai/exam-model-backend/internal/models"
	"github.com/modeptrai/exam-model-backend/internal/services"
)

func CreateExam(c *gin.Context) {
	var exam models.Exam
	if err := c.ShouldBindJSON(&exam); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := config.DB.Create(&exam).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create exam: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, exam)
}

type UpdateExamPayload struct {
	models.Exam
	DeleteOrphanQuestionIDs []string `json:"deleteOrphanQuestionIds"`
}

type CheckOrphansPayload struct {
	QuestionIDs []string `json:"questionIds" binding:"required"`
}

type OrphanQuestionInfo struct {
	ID       string `json:"id"`
	BookName string `json:"bookName"`
	Content  string `json:"content"`
}

func CheckOrphanQuestions(c *gin.Context) {
	examID := c.Param("id")
	var payload CheckOrphansPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	orphans := make([]OrphanQuestionInfo, 0)
	for _, qID := range payload.QuestionIDs {
		if qID == "" {
			continue
		}
		var otherCount int64
		if err := config.DB.Model(&models.Exam{}).
			Where("id != ? AND ? = ANY(question_ids)", examID, qID).
			Count(&otherCount).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check exams: " + err.Error()})
			return
		}

		if otherCount == 0 {
			var q models.Question
			if err := config.DB.Select("id, gg_drive, content").Where("id = ?", qID).First(&q).Error; err == nil {
				orphans = append(orphans, OrphanQuestionInfo{
					ID:       q.ID.String(),
					BookName: q.GgDrive,
					Content:  q.Content,
				})
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{"orphanQuestions": orphans})
}

func UpdateExam(c *gin.Context) {
	id := c.Param("id")

	var existingExam models.Exam
	if err := config.DB.Where("id = ?", id).First(&existingExam).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Exam not found"})
		return
	}

	var payload UpdateExamPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	existingExam.Title = payload.Title
	existingExam.ExamCode = payload.ExamCode
	existingExam.Grade = payload.Grade
	existingExam.Duration = payload.Duration
	existingExam.Cate = payload.Cate
	existingExam.Type = payload.Type
	existingExam.DiffScore = payload.DiffScore
	existingExam.QuestionIDs = payload.QuestionIDs
	existingExam.LectureID = payload.LectureID

	err := config.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Save(&existingExam).Error; err != nil {
			return err
		}

		if len(payload.DeleteOrphanQuestionIDs) > 0 {
			for _, qID := range payload.DeleteOrphanQuestionIDs {
				if qID == "" {
					continue
				}
				// Verify question is not in other exams
				var otherCount int64
				if err := tx.Model(&models.Exam{}).
					Where("id != ? AND ? = ANY(question_ids)", id, qID).
					Count(&otherCount).Error; err != nil {
					return err
				}

				if otherCount == 0 {
					// Soft delete question and any subquestions
					if err := tx.Delete(&models.Question{}, "id = ?", qID).Error; err != nil {
						return err
					}
					if err := tx.Delete(&models.Question{}, "parent_id = ?", qID).Error; err != nil {
						return err
					}
				}
			}
		}
		return nil
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update exam: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, existingExam)
}

func GetExams(c *gin.Context) {
	var exams []models.Exam
	query := config.DB.Order("created_at desc")
	if lectureID := c.Query("lecture_id"); lectureID != "" {
		query = query.Where("lecture_id = ?", lectureID)
	}
	if err := query.Find(&exams).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch exams: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": exams})
}

func GetExamByID(c *gin.Context) {
	id := c.Param("id")

	var exam models.Exam
	if err := config.DB.Where("id = ?", id).First(&exam).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Exam not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": exam})
}

func DeleteExam(c *gin.Context) {
	id := c.Param("id")

	var exam models.Exam
	if err := config.DB.Where("id = ?", id).First(&exam).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Exam not found"})
		return
	}

	// 1. Identify orphan questions (questions only belonging to this exam)
	var orphanQuestionIDs []string
	for _, qID := range exam.QuestionIDs {
		if qID == "" {
			continue
		}
		var otherCount int64
		if err := config.DB.Model(&models.Exam{}).
			Where("id != ? AND ? = ANY(question_ids)", id, qID).
			Count(&otherCount).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check other exams: " + err.Error()})
			return
		}
		if otherCount == 0 {
			orphanQuestionIDs = append(orphanQuestionIDs, qID)
		}
	}

	// 2. Also find any sub-questions whose parent_id is in orphanQuestionIDs
	var allOrphanIDs []string
	if len(orphanQuestionIDs) > 0 {
		var subQuestions []models.Question
		_ = config.DB.Where("parent_id IN (?)", orphanQuestionIDs).Find(&subQuestions).Error
		allOrphanIDs = append(allOrphanIDs, orphanQuestionIDs...)
		for _, sq := range subQuestions {
			allOrphanIDs = append(allOrphanIDs, sq.ID.String())
		}
	}

	// 3. Extract candidate image URLs from orphan questions before deleting them
	var candidateImageURLs []string
	if len(allOrphanIDs) > 0 {
		var orphanQuestions []models.Question
		if err := config.DB.Where("id IN (?)", allOrphanIDs).Find(&orphanQuestions).Error; err == nil {
			for _, q := range orphanQuestions {
				extracted := services.ExtractQuestionImageURLs(
					q.Content, q.Options, q.SolutionGuide, q.Hint,
					q.QuickSolveTips, q.GeneralMethod, q.Mistakes,
				)
				candidateImageURLs = append(candidateImageURLs, extracted...)
			}
		}
	}

	// 4. Execute cascading DB deletions in a Transaction
	err := config.DB.Transaction(func(tx *gorm.DB) error {
		// Hard delete all submissions of this exam
		if err := tx.Unscoped().Where("exam_id = ?", exam.ID).Delete(&models.Submission{}).Error; err != nil {
			return err
		}

		// Hard delete orphan questions (including sub-questions)
		if len(allOrphanIDs) > 0 {
			if err := tx.Unscoped().Where("id IN (?)", allOrphanIDs).Delete(&models.Question{}).Error; err != nil {
				return err
			}
		}

		// Hard delete the exam itself
		if err := tx.Unscoped().Where("id = ?", exam.ID).Delete(&models.Exam{}).Error; err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete exam: " + err.Error()})
		return
	}

	// 5. Clean up physical images on disk after successful DB transaction
	if len(candidateImageURLs) > 0 {
		unusedImages := services.FilterUnusedQuestionImages(config.DB, candidateImageURLs, allOrphanIDs)
		services.DeletePhysicalImages(unusedImages)
	}

	c.JSON(http.StatusOK, gin.H{
		"message":               "Exam deleted successfully",
		"deletedSubmissions":    true,
		"deletedQuestionsCount": len(allOrphanIDs),
	})
}

