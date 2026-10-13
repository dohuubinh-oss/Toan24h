package handlers_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
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

func setupOrphanTestEnv(t *testing.T) (*gin.Engine, *gorm.DB) {
	gin.SetMode(gin.TestMode)
	dsn := "host=localhost user=admin password=secretpassword dbname=toan24h_test port=5432 sslmode=disable TimeZone=Asia/Ho_Chi_Minh"
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		t.Fatalf("Failed to connect to test db: %v", err)
	}

	config.DB = db

	db.Exec("DROP TABLE IF EXISTS exams CASCADE")
	db.Exec("DROP TABLE IF EXISTS questions CASCADE")

	if err := db.AutoMigrate(&models.Exam{}, &models.Question{}); err != nil {
		t.Fatalf("Failed to migrate test db: %v", err)
	}

	r := gin.Default()
	r.POST("/api/v1/exams/:id/check-orphans", handlers.CheckOrphanQuestions)
	r.PUT("/api/v1/exams/:id", handlers.UpdateExam)

	return r, db
}

func TestCheckOrphanQuestions(t *testing.T) {
	r, db := setupOrphanTestEnv(t)

	// Create 3 questions
	q1 := models.Question{ID: uuid.New(), BookName: "Câu 1", Content: "Nội dung câu 1", TypeQuestion: "single", Type: "Trắc nghiệm", SolutionGuide: "HD1", Tags: "[]", Options: "[]"}
	q2 := models.Question{ID: uuid.New(), BookName: "Câu 2", Content: "Nội dung câu 2", TypeQuestion: "single", Type: "Trắc nghiệm", SolutionGuide: "HD2", Tags: "[]", Options: "[]"}
	q3 := models.Question{ID: uuid.New(), BookName: "Câu 3", Content: "Nội dung câu 3", TypeQuestion: "single", Type: "Trắc nghiệm", SolutionGuide: "HD3", Tags: "[]", Options: "[]"}
	db.Create(&q1)
	db.Create(&q2)
	db.Create(&q3)

	// Exam 1 contains q1 and q2
	exam1 := models.Exam{
		ID:          uuid.New(),
		Title:       "Đề thi 1",
		ExamCode:    "DT1",
		Type:        "midterm",
		Grade:       "9",
		QuestionIDs: pq.StringArray{q1.ID.String(), q2.ID.String()},
	}
	db.Create(&exam1)

	// Exam 2 contains q2 and q3
	exam2 := models.Exam{
		ID:          uuid.New(),
		Title:       "Đề thi 2",
		ExamCode:    "DT2",
		Type:        "midterm",
		Grade:       "9",
		QuestionIDs: pq.StringArray{q2.ID.String(), q3.ID.String()},
	}
	db.Create(&exam2)

	// Suppose teacher is editing Exam 1 and removes q1 and q2.
	// Check orphans for Exam 1 with removed questions [q1, q2]
	// Expected:
	// q1 is ONLY in Exam 1 -> it is an orphan!
	// q2 is also in Exam 2 -> it is NOT an orphan!
	payload := map[string]interface{}{
		"questionIds": []string{q1.ID.String(), q2.ID.String()},
	}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", "/api/v1/exams/"+exam1.ID.String()+"/check-orphans", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var res struct {
		OrphanQuestions []struct {
			ID       string `json:"id"`
			BookName string `json:"bookName"`
			Content  string `json:"content"`
		} `json:"orphanQuestions"`
	}
	err := json.Unmarshal(w.Body.Bytes(), &res)
	assert.NoError(t, err)

	assert.Len(t, res.OrphanQuestions, 1)
	assert.Equal(t, q1.ID.String(), res.OrphanQuestions[0].ID)
	assert.Equal(t, "Câu 1", res.OrphanQuestions[0].BookName)
}

func TestUpdateExam_WithDeleteOrphans(t *testing.T) {
	r, db := setupOrphanTestEnv(t)

	// Create 2 questions
	q1 := models.Question{ID: uuid.New(), BookName: "Câu 1", Content: "Nội dung câu 1", TypeQuestion: "single", Type: "Trắc nghiệm", SolutionGuide: "HD1", Tags: "[]", Options: "[]"}
	q2 := models.Question{ID: uuid.New(), BookName: "Câu 2", Content: "Nội dung câu 2", TypeQuestion: "single", Type: "Trắc nghiệm", SolutionGuide: "HD2", Tags: "[]", Options: "[]"}
	db.Create(&q1)
	db.Create(&q2)

	// Exam initially has [q1, q2]
	exam := models.Exam{
		ID:          uuid.New(),
		Title:       "Đề thi gốc",
		ExamCode:    "DT0",
		Type:        "final",
		Grade:       "10",
		QuestionIDs: pq.StringArray{q1.ID.String(), q2.ID.String()},
	}
	db.Create(&exam)

	// Update exam to keep only q2, removing q1, and requesting deletion of orphan q1
	updatePayload := map[string]interface{}{
		"title":                   "Đề thi đã cập nhật",
		"examCode":                "DT0",
		"type":                    "final",
		"grade":                   "10",
		"questionIds":             []string{q2.ID.String()},
		"deleteOrphanQuestionIds": []string{q1.ID.String()},
	}
	body, _ := json.Marshal(updatePayload)

	req, _ := http.NewRequest("PUT", "/api/v1/exams/"+exam.ID.String(), bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	// Verify exam questionIds updated
	var updatedExam models.Exam
	db.First(&updatedExam, "id = ?", exam.ID)
	assert.Equal(t, pq.StringArray{q2.ID.String()}, updatedExam.QuestionIDs)

	// Verify q1 was soft-deleted
	var countQ1 int64
	db.Model(&models.Question{}).Where("id = ?", q1.ID).Count(&countQ1)
	assert.Equal(t, int64(0), countQ1, "q1 should be soft-deleted")

	// Verify q2 is still alive
	var countQ2 int64
	db.Model(&models.Question{}).Where("id = ?", q2.ID).Count(&countQ2)
	assert.Equal(t, int64(1), countQ2, "q2 should still exist")
}
