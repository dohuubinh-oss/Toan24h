package handlers_test

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/modeptrai/exam-model-backend/internal/handlers"
	"github.com/modeptrai/exam-model-backend/internal/models"
	"github.com/modeptrai/exam-model-backend/internal/utils"
	"github.com/testcontainers/testcontainers-go"
	"github.com/testcontainers/testcontainers-go/modules/postgres"
	"github.com/testcontainers/testcontainers-go/wait"
	gormpg "gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func setupBookmarkHandlerTestEnv(t *testing.T) (*gin.Engine, *gorm.DB, func()) {
	os.Setenv("JWT_SECRET", "supersecret")
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

	err = db.AutoMigrate(&models.User{}, &models.Lecture{}, &models.LectureBookmark{})
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
	
	// Create mock Auth Middleware that extracts token manually to bypass real middleware for simple testing
	// OR use the real middleware and pass valid tokens. We will pass valid tokens.
	r.Use(func(c *gin.Context) {
		// Mock auth context for test
		token := c.GetHeader("Authorization")
		if token != "" {
			claims, _ := utils.ValidateToken(token[7:])
			if claims != nil {
				c.Set("userID", claims.UserID)
			}
		}
		c.Next()
	})

	bookmarkHandler := handlers.NewBookmarkHandler(db)
	r.POST("/api/v1/lectures/:id/bookmark", bookmarkHandler.ToggleLectureBookmark)
	r.GET("/api/v1/bookmarks/lectures", bookmarkHandler.GetBookmarkedLectures)

	return r, db, cleanup
}

func TestBookmarkHandlers(t *testing.T) {
	r, db, cleanup := setupBookmarkHandlerTestEnv(t)
	defer cleanup()

	// 1. Setup Test Data
	u := models.User{
		Email:        "bookmark_tester@example.com",
		PasswordHash: "hashed",
		FullName:     "Test",
		Role:         "student",
		Grade:        "9",
	}
	db.Create(&u)
	token, _ := utils.GenerateAccessToken(u.ID, u.Role, u.Grade)

	l1 := models.Lecture{
		Title: "Lecture 1",
		Grade: "9",
	}
	db.Create(&l1)
	
	l2 := models.Lecture{
		Title: "Lecture 2",
		Grade: "9",
	}
	db.Create(&l2)

	// 2. Test Toggle Bookmark (Add)
	req1, _ := http.NewRequest("POST", "/api/v1/lectures/"+l1.ID.String()+"/bookmark", nil)
	req1.Header.Set("Authorization", "Bearer "+token)
	w1 := httptest.NewRecorder()
	r.ServeHTTP(w1, req1)

	if w1.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK for adding bookmark, got %d. Body: %s", w1.Code, w1.Body.String())
	}
	
	var res1 map[string]interface{}
	json.Unmarshal(w1.Body.Bytes(), &res1)
	if res1["action"] != "added" {
		t.Fatalf("Expected action added, got %v", res1["action"])
	}

	// 3. Test Toggle Bookmark (Remove)
	req2, _ := http.NewRequest("POST", "/api/v1/lectures/"+l1.ID.String()+"/bookmark", nil)
	req2.Header.Set("Authorization", "Bearer "+token)
	w2 := httptest.NewRecorder()
	r.ServeHTTP(w2, req2)

	if w2.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK for removing bookmark, got %d. Body: %s", w2.Code, w2.Body.String())
	}
	
	var res2 map[string]interface{}
	json.Unmarshal(w2.Body.Bytes(), &res2)
	if res2["action"] != "removed" {
		t.Fatalf("Expected action removed, got %v", res2["action"])
	}

	// Add it back and add l2 for list testing
	req3, _ := http.NewRequest("POST", "/api/v1/lectures/"+l1.ID.String()+"/bookmark", nil)
	req3.Header.Set("Authorization", "Bearer "+token)
	w3 := httptest.NewRecorder()
	r.ServeHTTP(w3, req3)

	req4, _ := http.NewRequest("POST", "/api/v1/lectures/"+l2.ID.String()+"/bookmark", nil)
	req4.Header.Set("Authorization", "Bearer "+token)
	w4 := httptest.NewRecorder()
	r.ServeHTTP(w4, req4)

	// 4. Test Get List
	reqList, _ := http.NewRequest("GET", "/api/v1/bookmarks/lectures", nil)
	reqList.Header.Set("Authorization", "Bearer "+token)
	wList := httptest.NewRecorder()
	r.ServeHTTP(wList, reqList)

	if wList.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK for getting list, got %d. Body: %s", wList.Code, wList.Body.String())
	}

	var resList map[string]interface{}
	json.Unmarshal(wList.Body.Bytes(), &resList)
	bookmarks, ok := resList["data"].([]interface{})
	if !ok || len(bookmarks) != 2 {
		t.Fatalf("Expected 2 bookmarks, got %v", len(bookmarks))
	}
}
