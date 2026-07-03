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
	"github.com/modeptrai/exam-model-backend/internal/config"
	"github.com/modeptrai/exam-model-backend/internal/models"
	"github.com/modeptrai/exam-model-backend/internal/routes"
	"github.com/testcontainers/testcontainers-go"
	"github.com/testcontainers/testcontainers-go/modules/postgres"
	"github.com/testcontainers/testcontainers-go/wait"
	gormpg "gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func setupTestApp(t *testing.T) (*gin.Engine, func()) {
	// Chuyển Gin sang chế độ Test
	gin.SetMode(gin.TestMode)

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

	// Ghi đè config.DB bằng connection của môi trường test
	config.DB, err = gorm.Open(gormpg.Open(connStr), &gorm.Config{})
	if err != nil {
		t.Fatalf("Failed to connect to test db: %v", err)
	}

	err = config.DB.AutoMigrate(&models.Question{})
	if err != nil {
		t.Fatalf("Failed to migrate: %v", err)
	}

	cleanup := func() {
		if err := pgContainer.Terminate(ctx); err != nil {
			t.Fatalf("Failed to terminate container: %v", err)
		}
	}

	// Gắn Router
	r := routes.SetupRouter()
	return r, cleanup
}

func TestQuestionAPI_CRUD(t *testing.T) {
	r, cleanup := setupTestApp(t)
	defer cleanup()

	// 1. POST /api/v1/questions/bulk (Tạo mới)
	bulkReq := []map[string]interface{}{
		{
			"shared_content": "Shared passage context",
			"questions": []map[string]interface{}{
				{
					"content": "Solve x + 2 = 5",
					"type": "Tự luận",
					"grade": 6,
					"topic": "Algebra",
					"difficulty_level": "Thông hiểu",
					"difficulty_point": 2.0,
					"point": 1.0,
					"tags": []string{"math"},
					"options": []string{},
					"correct_answer": "x = 3",
					"solution_guide": "x = 5 - 2",
				},
			},
		},
	}
	body, _ := json.Marshal(bulkReq)
	
	req, _ := http.NewRequest("POST", "/api/v1/questions/bulk", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("Expected status 201 Created, got %d. Body: %s", w.Code, w.Body.String())
	}

	// Lấy 1 câu hỏi con vừa tạo để test GET, PUT, DELETE
	var createdQ models.Question
	if err := config.DB.Where("type_question = ?", "single").First(&createdQ).Error; err != nil {
		t.Fatalf("Failed to find created question in DB: %v", err)
	}
	qID := createdQ.ID.String()

	if qID == "" {
		t.Fatalf("Expected valid ID, got empty string")
	}

	// 2. GET /api/v1/questions/:id (Lấy chi tiết)
	req, _ = http.NewRequest("GET", "/api/v1/questions/"+qID, nil)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Expected status 200 OK, got %d. Body: %s", w.Code, w.Body.String())
	}

	// 3. GET /api/v1/questions (Lấy danh sách, phân trang)
	req, _ = http.NewRequest("GET", "/api/v1/questions?page=1&limit=10", nil)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Expected status 200 OK, got %d. Body: %s", w.Code, w.Body.String())
	}
	var listRes map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &listRes)
	listData := listRes["data"].([]interface{})
	if len(listData) != 2 {
		t.Errorf("Expected 2 questions in list, got %d", len(listData))
	}

	// 4. PUT /api/v1/questions/:id (Cập nhật)
	updateData := map[string]interface{}{
		"difficultyLevel": "Vận dụng",
	}
	updateBody, _ := json.Marshal(updateData)
	req, _ = http.NewRequest("PUT", "/api/v1/questions/"+qID, bytes.NewBuffer(updateBody))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Expected status 200 OK, got %d. Body: %s", w.Code, w.Body.String())
	}

	// 5. DELETE /api/v1/questions/:id (Xóa)
	req, _ = http.NewRequest("DELETE", "/api/v1/questions/"+qID, nil)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Expected status 200 OK for delete, got %d. Body: %s", w.Code, w.Body.String())
	}

	// Xác nhận xoá thành công (Return 404)
	req, _ = http.NewRequest("GET", "/api/v1/questions/"+qID, nil)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Fatalf("Expected status 404 Not Found after delete, got %d", w.Code)
	}
}
