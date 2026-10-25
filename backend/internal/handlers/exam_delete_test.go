package handlers_test

import (
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/lib/pq"
	"github.com/stretchr/testify/assert"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	"github.com/modeptrai/exam-model-backend/internal/config"
	"github.com/modeptrai/exam-model-backend/internal/handlers"
	"github.com/modeptrai/exam-model-backend/internal/models"
)

func setupDeleteExamTestEnv(t *testing.T) (*gin.Engine, *gorm.DB) {
	gin.SetMode(gin.TestMode)
	dsn := "host=localhost user=admin password=secretpassword dbname=toan24h_test port=5432 sslmode=disable TimeZone=Asia/Ho_Chi_Minh"
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		t.Skipf("Skipping integration test: test Postgres DB not reachable (%v)", err)
		return nil, nil
	}

	config.DB = db

	db.Exec("DROP TABLE IF EXISTS submissions CASCADE")
	db.Exec("DROP TABLE IF EXISTS exams CASCADE")
	db.Exec("DROP TABLE IF EXISTS questions CASCADE")

	if err := db.AutoMigrate(&models.Exam{}, &models.Question{}, &models.Submission{}); err != nil {
		t.Fatalf("Failed to migrate test db: %v", err)
	}

	r := gin.Default()
	r.DELETE("/api/v1/exams/:id", handlers.DeleteExam)

	return r, db
}

func TestDeleteExam_CascadeCleanup(t *testing.T) {
	r, db := setupDeleteExamTestEnv(t)
	if db == nil {
		return
	}

	// Setup fake upload image directories
	img1Path := filepath.Join(".", "uploads", "questions", "9", "test_q1.png")
	img2Path := filepath.Join(".", "uploads", "questions", "9", "test_q2.png")
	_ = os.MkdirAll(filepath.Dir(img1Path), 0755)
	_ = os.WriteFile(img1Path, []byte("fake img 1"), 0644)
	_ = os.WriteFile(img2Path, []byte("fake img 2"), 0644)
	defer func() {
		_ = os.Remove(img1Path)
		_ = os.Remove(img2Path)
	}()

	// Create 3 questions:
	// Q1: only in Exam 1, contains img1
	// Q2: in Exam 1 and Exam 2, contains img2
	// Q3: only in Exam 2
	q1 := models.Question{
		ID:            uuid.New(),
		BookName:      "Câu 1",
		Content:       `Câu 1 có ảnh <img src="/uploads/questions/9/test_q1.png" />`,
		TypeQuestion:  "single",
		Type:          "Trắc nghiệm",
		SolutionGuide: "HD1",
		Tags:          "[]",
		Options:       "[]",
	}
	q2 := models.Question{
		ID:            uuid.New(),
		BookName:      "Câu 2",
		Content:       `Câu 2 có ảnh <img src="/uploads/questions/9/test_q2.png" />`,
		TypeQuestion:  "single",
		Type:          "Trắc nghiệm",
		SolutionGuide: "HD2",
		Tags:          "[]",
		Options:       "[]",
	}
	q3 := models.Question{
		ID:            uuid.New(),
		BookName:      "Câu 3",
		Content:       "Câu 3 không ảnh",
		TypeQuestion:  "single",
		Type:          "Trắc nghiệm",
		SolutionGuide: "HD3",
		Tags:          "[]",
		Options:       "[]",
	}
	db.Create(&q1)
	db.Create(&q2)
	db.Create(&q3)

	exam1 := models.Exam{
		ID:          uuid.New(),
		Title:       "Đề thi 1",
		ExamCode:    "DT1",
		Type:        "midterm",
		Grade:       "9",
		QuestionIDs: pq.StringArray{q1.ID.String(), q2.ID.String()},
	}
	exam2 := models.Exam{
		ID:          uuid.New(),
		Title:       "Đề thi 2",
		ExamCode:    "DT2",
		Type:        "final",
		Grade:       "9",
		QuestionIDs: pq.StringArray{q2.ID.String(), q3.ID.String()},
	}
	db.Create(&exam1)
	db.Create(&exam2)

	// Create a submission for Exam 1
	sub := models.Submission{
		ID:     uuid.New(),
		ExamID: exam1.ID,
		Status: models.StatusSubmitted,
	}
	db.Create(&sub)

	// Call DELETE /api/v1/exams/:id for Exam 1
	req, _ := http.NewRequest("DELETE", "/api/v1/exams/"+exam1.ID.String(), nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	// 1. Verify Exam 1 is hard deleted
	var examCount int64
	db.Unscoped().Model(&models.Exam{}).Where("id = ?", exam1.ID).Count(&examCount)
	assert.Equal(t, int64(0), examCount, "Exam 1 should be hard deleted")

	// 2. Verify submission for Exam 1 is hard deleted
	var subCount int64
	db.Unscoped().Model(&models.Submission{}).Where("id = ?", sub.ID).Count(&subCount)
	assert.Equal(t, int64(0), subCount, "Submission should be hard deleted")

	// 3. Verify Q1 (orphan) is hard deleted
	var q1Count int64
	db.Unscoped().Model(&models.Question{}).Where("id = ?", q1.ID).Count(&q1Count)
	assert.Equal(t, int64(0), q1Count, "Q1 should be hard deleted")

	// 4. Verify Q2 (used in Exam 2) is still alive
	var q2Count int64
	db.Model(&models.Question{}).Where("id = ?", q2.ID).Count(&q2Count)
	assert.Equal(t, int64(1), q2Count, "Q2 should not be deleted")

	// 5. Verify image of Q1 is removed from disk
	assert.NoFileExists(t, img1Path, "Image 1 of Q1 should be removed from disk")

	// 6. Verify image of Q2 is still on disk
	assert.FileExists(t, img2Path, "Image 2 of Q2 should still be on disk")
}

func TestDeleteExam_GroupAndSoftDeletedSubQuestions(t *testing.T) {
	r, db := setupDeleteExamTestEnv(t)
	if db == nil {
		return
	}

	// Create parent group question
	parentID := uuid.New()
	parentQ := models.Question{
		ID:            parentID,
		BookName:      "Câu chùm",
		Content:       "Cho đoạn văn sau...",
		TypeQuestion:  "group",
		Type:          "Trắc nghiệm",
		SolutionGuide: "HD chung",
		Tags:          "[]",
		Options:       "[]",
	}
	db.Create(&parentQ)

	// Create active sub-question
	subQ1 := models.Question{
		ID:            uuid.New(),
		ParentID:      &parentID,
		BookName:      "Câu con 1",
		Content:       "Ý 1",
		TypeQuestion:  "single",
		Type:          "Trắc nghiệm",
		SolutionGuide: "HD ý 1",
		Tags:          "[]",
		Options:       "[]",
	}
	db.Create(&subQ1)

	// Create soft-deleted sub-question
	subQ2 := models.Question{
		ID:            uuid.New(),
		ParentID:      &parentID,
		BookName:      "Câu con 2",
		Content:       "Ý 2 bị xoá mềm",
		TypeQuestion:  "single",
		Type:          "Trắc nghiệm",
		SolutionGuide: "HD ý 2",
		Tags:          "[]",
		Options:       "[]",
	}
	db.Create(&subQ2)
	db.Delete(&subQ2) // Soft delete S2

	// Create exam referencing parent question
	exam := models.Exam{
		ID:          uuid.New(),
		Title:       "Đề thi có câu hỏi chùm",
		ExamCode:    "DTC1",
		Type:        "midterm",
		Grade:       "9",
		QuestionIDs: pq.StringArray{parentQ.ID.String()},
	}
	db.Create(&exam)

	// Call DELETE /api/v1/exams/:id
	req, _ := http.NewRequest("DELETE", "/api/v1/exams/"+exam.ID.String(), nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code, "DeleteExam should return 200 without FK constraint violation")

	// Verify parent and both sub-questions are hard deleted
	var parentCount int64
	db.Unscoped().Model(&models.Question{}).Where("id = ?", parentQ.ID).Count(&parentCount)
	assert.Equal(t, int64(0), parentCount, "Parent question should be deleted")

	var sub1Count int64
	db.Unscoped().Model(&models.Question{}).Where("id = ?", subQ1.ID).Count(&sub1Count)
	assert.Equal(t, int64(0), sub1Count, "Active sub-question should be deleted")

	var sub2Count int64
	db.Unscoped().Model(&models.Question{}).Where("id = ?", subQ2.ID).Count(&sub2Count)
	assert.Equal(t, int64(0), sub2Count, "Soft-deleted sub-question should be deleted")
}
