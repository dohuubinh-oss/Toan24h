package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/lib/pq"
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

// getOtherExamsQuestionSet returns a set of question IDs that exist in other exams (excluding currentExamID)
func getOtherExamsQuestionSet(db *gorm.DB, currentExamID string, candidateIDs []string) (map[string]bool, error) {
	used := make(map[string]bool)
	if len(candidateIDs) == 0 {
		return used, nil
	}

	var otherQuestionIDs []string
	if err := db.Model(&models.Exam{}).
		Select("DISTINCT unnest(question_ids)").
		Where("id != ? AND question_ids && ?", currentExamID, pq.StringArray(candidateIDs)).
		Pluck("unnest", &otherQuestionIDs).Error; err != nil {
		return nil, err
	}

	for _, id := range otherQuestionIDs {
		used[id] = true
	}
	return used, nil
}

func CheckOrphanQuestions(c *gin.Context) {
	examID := c.Param("id")
	var payload CheckOrphansPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	usedSet, err := getOtherExamsQuestionSet(config.DB, examID, payload.QuestionIDs)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check exams: " + err.Error()})
		return
	}

	var orphanIDs []string
	for _, qID := range payload.QuestionIDs {
		if qID != "" && !usedSet[qID] {
			orphanIDs = append(orphanIDs, qID)
		}
	}

	orphans := make([]OrphanQuestionInfo, 0)
	if len(orphanIDs) > 0 {
		var questions []models.Question
		if err := config.DB.Select("id, gg_drive, content").Where("id IN (?)", orphanIDs).Find(&questions).Error; err == nil {
			for _, q := range questions {
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
			usedSet, err := getOtherExamsQuestionSet(tx, id, payload.DeleteOrphanQuestionIDs)
			if err != nil {
				return err
			}

			var toDeleteIDs []string
			for _, qID := range payload.DeleteOrphanQuestionIDs {
				if qID != "" && !usedSet[qID] {
					toDeleteIDs = append(toDeleteIDs, qID)
				}
			}

			if len(toDeleteIDs) > 0 {
				if err := tx.Delete(&models.Question{}, "id IN (?)", toDeleteIDs).Error; err != nil {
					return err
				}
				if err := tx.Delete(&models.Question{}, "parent_id IN (?)", toDeleteIDs).Error; err != nil {
					return err
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
	usedSet, err := getOtherExamsQuestionSet(config.DB, id, exam.QuestionIDs)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check other exams: " + err.Error()})
		return
	}

	var orphanQuestionIDs []string
	for _, qID := range exam.QuestionIDs {
		if qID != "" && !usedSet[qID] {
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
	err = config.DB.Transaction(func(tx *gorm.DB) error {
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

