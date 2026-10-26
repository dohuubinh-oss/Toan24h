package handlers_test

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/lib/pq"
	"github.com/modeptrai/exam-model-backend/internal/config"
	"github.com/modeptrai/exam-model-backend/internal/handlers"
	"github.com/modeptrai/exam-model-backend/internal/models"
	"github.com/stretchr/testify/assert"
	"github.com/testcontainers/testcontainers-go"
	"github.com/testcontainers/testcontainers-go/modules/postgres"
	"github.com/testcontainers/testcontainers-go/wait"
	gormpg "gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func setupExamTestEnv(t *testing.T) (*gin.Engine, *gorm.DB, func()) {
	ctx := context.Background()

	pgContainer, err := postgres.RunContainer(ctx,
		testcontainers.WithImage("postgres:15-alpine"),
		postgres.WithDatabase("testdb"),
		postgres.WithUsername("testuser"),
		postgres.WithPassword("testpassword"),
		testcontainers.WithWaitStrategy(
			wait.ForLog("database system is ready to accept connections").
				WithOccurrence(2).WithStartupTimeout(15*time.Second),
		),
	)
	if err != nil {
		t.Fatalf("Failed to start postgres container: %v", err)
	}

	connStr, err := pgContainer.ConnectionString(ctx, "sslmode=disable")
	if err != nil {
		t.Fatalf("Failed to get connection string: %v", err)
	}

	db, err := gorm.Open(gormpg.Open(connStr), &gorm.Config{})
	if err != nil {
		t.Fatalf("Failed to connect to test db: %v", err)
	}

	// Set to global config so the handler can use it
	config.DB = db

	err = db.AutoMigrate(&models.Exam{}, &models.Submission{}, &models.Question{}, &models.User{}, &models.Notification{})
	if err != nil {
		t.Fatalf("Failed to migrate: %v", err)
	}

	cleanup := func() {
		if err := pgContainer.Terminate(ctx); err != nil {
			t.Fatalf("Failed to terminate container: %v", err)
		}
	}

	gin.SetMode(gin.TestMode)
	r := gin.Default()
	testUserID := uuid.New()
	r.Use(func(c *gin.Context) {
		c.Set("userID", testUserID)
		c.Next()
	})
	r.POST("/api/v1/exams/:id/submit", handlers.SubmitExam)

	return r, db, cleanup
}

func TestSubmitExam(t *testing.T) {
	r, db, cleanup := setupExamTestEnv(t)
	defer cleanup()

	examID := uuid.New()
	exam := models.Exam{
		ID:        examID,
		Title:     "Test Exam",
		ExamCode:  "TE123",
		Type:        "practice",
		Grade:       "8",
		QuestionIDs: pq.StringArray{uuid.New().String()},
	}
	db.Create(&exam)

	payload := map[string]interface{}{
		"answers": []map[string]interface{}{
			{
				"questionId":    uuid.New().String(),
				"studentAnswer": "A",
				"isEssay":       false,
			},
		},
	}

	body, _ := json.Marshal(payload)
	req, _ := http.NewRequest("POST", "/api/v1/exams/"+examID.String()+"/submit", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var res map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &res)
	assert.Contains(t, []string{"graded", "pending"}, res["status"])
}

func TestSubmitExam_EmptyEssayQuestion(t *testing.T) {
	r, db, cleanup := setupExamTestEnv(t)
	defer cleanup()

	qID := uuid.New()
	question := models.Question{
		ID:              qID,
		Content:         "Giải bài toán",
		Type:            "Tự luận",
		DifficultyPoint: 1.0,
		Tags:            "[]",
		Options:         "[]",
		SolutionGuide:   `{"steps":[{"step":1,"title":"Bước 1","point":1.0}]}`,
	}
	db.Create(&question)

	examID := uuid.New()
	exam := models.Exam{
		ID:          examID,
		Title:       "Test Essay Exam",
		ExamCode:    "TEE123",
		Type:        "practice",
		Grade:       "9",
		QuestionIDs: pq.StringArray{qID.String()},
	}
	db.Create(&exam)

	payload := map[string]interface{}{
		"answers": []map[string]interface{}{
			{
				"questionId":    qID.String(),
				"studentAnswer": "",
				"isEssay":       true,
			},
		},
	}

	body, _ := json.Marshal(payload)
	req, _ := http.NewRequest("POST", "/api/v1/exams/"+examID.String()+"/submit", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var sub models.Submission
	err := db.Where("exam_id = ?", examID).First(&sub).Error
	assert.NoError(t, err)
	assert.Equal(t, float64(0), sub.TotalScore)
}

func TestTwoAttemptsSubmissionLifecycle(t *testing.T) {
	r, db, cleanup := setupExamTestEnv(t)
	defer cleanup()

	qID := uuid.New()
	question := models.Question{
		ID:              qID,
		Content:         "1 + 1 = ?",
		Type:            "Trắc nghiệm",
		DifficultyPoint: 1.0,
		Tags:            "[]",
		Options:         `[{"key":"A","content":"2","is_correct":true}]`,
	}
	db.Create(&question)

	examID := uuid.New()
	exam := models.Exam{
		ID:          examID,
		Title:       "Official Exam Test",
		ExamCode:    "OET101",
		Type:        "exam",
		Cate:        "exam", // Official exam
		Grade:       "8",
		QuestionIDs: pq.StringArray{qID.String()},
	}
	db.Create(&exam)

	makePayload := func(ans string) []byte {
		p := map[string]interface{}{
			"answers": []map[string]interface{}{
				{
					"questionId":    qID.String(),
					"studentAnswer": ans,
					"isEssay":       false,
				},
			},
		}
		b, _ := json.Marshal(p)
		return b
	}

	// 1. Submit Attempt 1
	req1, _ := http.NewRequest("POST", "/api/v1/exams/"+examID.String()+"/submit", bytes.NewBuffer(makePayload("A")))
	req1.Header.Set("Content-Type", "application/json")
	w1 := httptest.NewRecorder()
	r.ServeHTTP(w1, req1)
	assert.Equal(t, http.StatusOK, w1.Code)

	var subsAfter1 []models.Submission
	db.Where("exam_id = ?", examID).Order("attempt_number asc").Find(&subsAfter1)
	assert.Equal(t, 1, len(subsAfter1))
	assert.Equal(t, 1, subsAfter1[0].AttemptNumber)

	// Simulate grading completion for attempt 1
	db.Model(&models.Submission{}).Where("id = ?", subsAfter1[0].ID).Updates(map[string]interface{}{
		"status":      models.StatusGraded,
		"total_score": 10.0,
	})

	// 2. Submit Attempt 2 (Previously this returned 400 "Bài thi chính thức chỉ được làm và nộp 1 lần")
	req2, _ := http.NewRequest("POST", "/api/v1/exams/"+examID.String()+"/submit", bytes.NewBuffer(makePayload("B")))
	req2.Header.Set("Content-Type", "application/json")
	w2 := httptest.NewRecorder()
	r.ServeHTTP(w2, req2)
	assert.Equal(t, http.StatusOK, w2.Code, "Attempt 2 should succeed without 400 error")

	var subsAfter2 []models.Submission
	db.Where("exam_id = ?", examID).Order("attempt_number asc").Find(&subsAfter2)
	assert.Equal(t, 2, len(subsAfter2), "Should have exactly 2 submissions now")
	assert.Equal(t, 1, subsAfter2[0].AttemptNumber)
	assert.Equal(t, 2, subsAfter2[1].AttemptNumber)
	assert.Equal(t, float64(10.0), subsAfter2[0].TotalScore, "Attempt 1 total score must remain 10.0 untouched")

	attempt2ID := subsAfter2[1].ID

	// Simulate grading completion for attempt 2
	db.Model(&models.Submission{}).Where("id = ?", attempt2ID).Updates(map[string]interface{}{
		"status":      models.StatusGraded,
		"total_score": 0.0,
	})

	// 3. Submit Attempt 3 (Should overwrite Attempt 2, still 2 rows in DB)
	req3, _ := http.NewRequest("POST", "/api/v1/exams/"+examID.String()+"/submit", bytes.NewBuffer(makePayload("A")))
	req3.Header.Set("Content-Type", "application/json")
	w3 := httptest.NewRecorder()
	r.ServeHTTP(w3, req3)
	assert.Equal(t, http.StatusOK, w3.Code, "Attempt 3 should succeed")

	var subsAfter3 []models.Submission
	db.Where("exam_id = ?", examID).Order("attempt_number asc").Find(&subsAfter3)
	assert.Equal(t, 2, len(subsAfter3), "Must maintain at most 2 submissions total")
	assert.Equal(t, 1, subsAfter3[0].AttemptNumber)
	assert.Equal(t, 2, subsAfter3[1].AttemptNumber)
	assert.Equal(t, attempt2ID, subsAfter3[1].ID, "Attempt 2 record should be overwritten in-place")
	assert.Equal(t, float64(10.0), subsAfter3[0].TotalScore, "Attempt 1 total score must still remain 10.0 untouched")
}

