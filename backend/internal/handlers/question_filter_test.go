package handlers_test

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	"github.com/modeptrai/exam-model-backend/internal/config"
	"github.com/modeptrai/exam-model-backend/internal/handlers"
	"github.com/modeptrai/exam-model-backend/internal/models"
)

func setupTestDB() *gorm.DB {
	dsn := "host=localhost user=admin password=secretpassword dbname=toan24h_test port=5432 sslmode=disable TimeZone=Asia/Ho_Chi_Minh"
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		panic("failed to connect test database")
	}

	// Clean up previous test data
	db.Exec("DROP TABLE IF EXISTS questions CASCADE")

	err = db.AutoMigrate(&models.Question{})
	if err != nil {
		panic("failed to migrate database: " + err.Error())
	}
	// Helper function to create valid jsonb
	jsonbEmpty := "[]"

	// 1. Single question
	db.Create(&models.Question{
		ID:              uuid.New(),
		BookName:        "S1",
		TypeQuestion:    "single",
		Content:         "Single Q 1",
		Type:            "Trắc nghiệm",
		Grade:           9,
		Topic:           "Đại số",
		DifficultyLevel: "Thông hiểu",
		Tags:            jsonbEmpty,
		Options:         jsonbEmpty,
		CreatedAt:       time.Now(),
	})

	// 2. Group question with matching children
	parent1ID := uuid.New()
	db.Create(&models.Question{
		ID:              parent1ID,
		BookName:        "G1",
		TypeQuestion:    "group",
		Content:         "Group Q 1",
		Tags:            jsonbEmpty,
		Options:         jsonbEmpty,
		CreatedAt:       time.Now(),
	})
	db.Create(&models.Question{
		ID:              uuid.New(),
		ParentID:        &parent1ID,
		BookName:        "G1_S1",
		TypeQuestion:    "single",
		Content:         "Group Q 1 - Sub 1",
		Type:            "Trắc nghiệm",
		Grade:           9,
		Topic:           "Hình học",
		DifficultyLevel: "Vận dụng",
		Tags:            jsonbEmpty,
		Options:         jsonbEmpty,
		CreatedAt:       time.Now(),
	})
	db.Create(&models.Question{
		ID:              uuid.New(),
		ParentID:        &parent1ID,
		BookName:        "G1_S2",
		TypeQuestion:    "single",
		Content:         "Group Q 1 - Sub 2",
		Type:            "Tự luận",
		Grade:           9,
		Topic:           "Đại số",
		DifficultyLevel: "Thông hiểu",
		Tags:            jsonbEmpty,
		Options:         jsonbEmpty,
		CreatedAt:       time.Now(),
	})

	// 3. Group question with NO matching children for the specific combination (Grade 9 + Hình học)
	parent2ID := uuid.New()
	db.Create(&models.Question{
		ID:              parent2ID,
		BookName:        "G2",
		TypeQuestion:    "group",
		Content:         "Group Q 2",
		Tags:            jsonbEmpty,
		Options:         jsonbEmpty,
		CreatedAt:       time.Now(),
	})
	db.Create(&models.Question{
		ID:              uuid.New(),
		ParentID:        &parent2ID,
		BookName:        "G2_S1",
		TypeQuestion:    "single",
		Content:         "Group Q 2 - Sub 1",
		Type:            "Trắc nghiệm",
		Grade:           8,
		Topic:           "Hình học",
		DifficultyLevel: "Thông hiểu",
		Tags:            jsonbEmpty,
		Options:         jsonbEmpty,
		CreatedAt:       time.Now(),
	})
	
	config.DB = db
	return db
}

func TestGetQuestionsFilter(t *testing.T) {
	setupTestDB()

	gin.SetMode(gin.TestMode)

	tests := []struct {
		name          string
		queryString   string
		expectedCount int
		expectedBooks []string
	}{
		{
			name:          "Filter by Grade 9",
			queryString:   "?grade=9",
			expectedCount: 2,
			expectedBooks: []string{"S1", "G1"},
		},
		{
			name:          "Filter by Grade 9 and Topic Hình học",
			queryString:   "?grade=9&topic=Hình%20học",
			expectedCount: 1, // Only G1 has a child that is BOTH Grade 9 and Hình học
			expectedBooks: []string{"G1"},
		},
		{
			name:          "Filter by Topic Đại số",
			queryString:   "?topic=Đại%20số",
			expectedCount: 2, // S1 and G1
			expectedBooks: []string{"S1", "G1"},
		},
		{
			name:          "Filter by Grade 8",
			queryString:   "?grade=8",
			expectedCount: 1, // G2
			expectedBooks: []string{"G2"},
		},
		{
			name:          "Filter by Type Trắc nghiệm",
			queryString:   "?type=Trắc%20nghiệm",
			expectedCount: 1, // S1 only (standalone)
			expectedBooks: []string{"S1"},
		},
		{
			name:          "Filter by Type Câu hỏi chùm",
			queryString:   "?type=Câu%20hỏi%20chùm",
			expectedCount: 2, // G1, G2
			expectedBooks: []string{"G1", "G2"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)
			
			// Mock the request with query string
			c.Request = httptest.NewRequest("GET", "/questions"+tt.queryString, nil)
			
			handlers.GetQuestions(c)
			
			if w.Code != http.StatusOK {
				t.Fatalf("Expected status 200, got %d. Body: %s", w.Code, w.Body.String())
			}
			
			// We can verify response via string since we are just checking counts.
			// Or we can parse it.
			bodyStr := w.Body.String()
			for _, book := range bookList(tt.expectedBooks) {
				if !strings.Contains(bodyStr, book) {
					t.Errorf("Expected to find book %s in response, but didn't. Response: %s", book, bodyStr)
				}
			}
			
			// The response should NOT contain books not in expected
			allBooks := []string{"S1", "G1", "G2"}
			for _, book := range allBooks {
				if !contains(tt.expectedBooks, book) {
					// Need to be careful not to match G1_S1 if checking for G1, but we only have top-level books in the test list
					if strings.Contains(bodyStr, `"bookName":"`+book+`"`) {
						t.Errorf("Did NOT expect to find book %s in response, but did. Response: %s", book, bodyStr)
					}
				}
			}
		})
	}
}

func bookList(books []string) []string {
	var res []string
	for _, b := range books {
		res = append(res, `"bookName":"`+b+`"`)
	}
	return res
}

func contains(slice []string, val string) bool {
	for _, v := range slice {
		if v == val {
			return true
		}
	}
	return false
}
