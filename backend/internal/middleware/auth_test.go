package middleware_test

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/modeptrai/exam-model-backend/internal/middleware"
	"github.com/modeptrai/exam-model-backend/internal/utils"
)

func TestAuthMiddleware(t *testing.T) {
	gin.SetMode(gin.TestMode)
	
	userID := uuid.New()
	// Helper function to create a valid token
	validToken, _ := utils.GenerateAccessToken(userID, "student", "9")
	
	tests := []struct {
		name         string
		setupRequest func(req *http.Request)
		expectedCode int
	}{
		{
			name: "Valid Token",
			setupRequest: func(req *http.Request) {
				req.Header.Set("Authorization", "Bearer "+validToken)
			},
			expectedCode: http.StatusOK,
		},
		{
			name: "Missing Token",
			setupRequest: func(req *http.Request) {
				// Do not set Authorization header
			},
			expectedCode: http.StatusUnauthorized,
		},
		{
			name: "Invalid Token Format",
			setupRequest: func(req *http.Request) {
				req.Header.Set("Authorization", "InvalidFormat "+validToken)
			},
			expectedCode: http.StatusUnauthorized,
		},
		{
			name: "Invalid Token String",
			setupRequest: func(req *http.Request) {
				req.Header.Set("Authorization", "Bearer invalid.token.str")
			},
			expectedCode: http.StatusUnauthorized,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			r := gin.New()
			r.Use(middleware.AuthMiddleware())
			r.GET("/protected", func(c *gin.Context) {
				// Assert that userID is set correctly on success
				uid, exists := c.Get("userID")
				if exists {
					parsedUID, ok := uid.(uuid.UUID)
					if !ok || parsedUID != userID {
						c.String(http.StatusInternalServerError, "UserID mismatch")
						return
					}
				}
				c.Status(http.StatusOK)
			})

			req, _ := http.NewRequest("GET", "/protected", nil)
			tt.setupRequest(req)
			w := httptest.NewRecorder()

			r.ServeHTTP(w, req)

			if w.Code != tt.expectedCode {
				t.Errorf("Expected status %d, got %d", tt.expectedCode, w.Code)
			}
		})
	}
}
