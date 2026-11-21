package middleware_test

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/modeptrai/exam-model-backend/internal/middleware"
	"github.com/modeptrai/exam-model-backend/internal/services"
	"github.com/modeptrai/exam-model-backend/internal/utils"
	"github.com/stretchr/testify/assert"
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
		{
			name: "Refresh Token Disallowed in AuthMiddleware",
			setupRequest: func(req *http.Request) {
				refreshToken, _ := utils.GenerateRefreshToken(userID)
				req.Header.Set("Authorization", "Bearer "+refreshToken)
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

func TestRoleMiddleware(t *testing.T) {
	gin.SetMode(gin.TestMode)

	tests := []struct {
		name          string
		userRole      string
		requiredRoles []string
		expectedCode  int
	}{
		{
			name:          "Admin matches single admin requirement",
			userRole:      "admin",
			requiredRoles: []string{"admin"},
			expectedCode:  http.StatusOK,
		},
		{
			name:          "Teacher denied when only admin required",
			userRole:      "teacher",
			requiredRoles: []string{"admin"},
			expectedCode:  http.StatusForbidden,
		},
		{
			name:          "Teacher allowed when admin or teacher required",
			userRole:      "teacher",
			requiredRoles: []string{"admin", "teacher"},
			expectedCode:  http.StatusOK,
		},
		{
			name:          "Student denied when admin or teacher required",
			userRole:      "student",
			requiredRoles: []string{"admin", "teacher"},
			expectedCode:  http.StatusForbidden,
		},
		{
			name:          "Missing role denied",
			userRole:      "",
			requiredRoles: []string{"admin"},
			expectedCode:  http.StatusForbidden,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			r := gin.New()
			r.Use(func(c *gin.Context) {
				if tt.userRole != "" {
					c.Set("userRole", tt.userRole)
				}
				c.Next()
			})
			r.Use(middleware.RoleMiddleware(tt.requiredRoles...))
			r.GET("/role-check", func(c *gin.Context) {
				c.Status(http.StatusOK)
			})

			req, _ := http.NewRequest("GET", "/role-check", nil)
			w := httptest.NewRecorder()
			r.ServeHTTP(w, req)

			if w.Code != tt.expectedCode {
				t.Errorf("Expected status %d, got %d", tt.expectedCode, w.Code)
			}
		})
	}
}

func TestAuthMiddleware_ConcurrentSessionKicked(t *testing.T) {
	gin.SetMode(gin.TestMode)
	services.ResetLocalSessionStoreForTest()
	ctx := context.Background()

	userID := uuid.New()
	sessionDevice1 := "sess-device-1-" + uuid.New().String()
	sessionDevice2 := "sess-device-2-" + uuid.New().String()

	// Device 1 registers active session & generates token 1
	_ = services.SetActiveSession(ctx, nil, userID, sessionDevice1)
	tokenDevice1, err := utils.GenerateAccessToken(userID, "student", "9", sessionDevice1)
	assert.NoError(t, err)

	// Set up router
	r := gin.New()
	r.Use(middleware.AuthMiddleware())
	r.GET("/protected", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	// 1. Device 1 request should succeed initially
	req1, _ := http.NewRequest("GET", "/protected", nil)
	req1.Header.Set("Authorization", "Bearer "+tokenDevice1)
	w1 := httptest.NewRecorder()
	r.ServeHTTP(w1, req1)
	assert.Equal(t, http.StatusOK, w1.Code)

	// 2. Device 2 logs in on the same account -> supersedes Device 1
	_ = services.SetActiveSession(ctx, nil, userID, sessionDevice2)
	tokenDevice2, err := utils.GenerateAccessToken(userID, "student", "9", sessionDevice2)
	assert.NoError(t, err)

	// 3. Device 1 makes another request with token 1 -> MUST be kicked with 401 CONCURRENT_SESSION_TERMINATED
	req1After, _ := http.NewRequest("GET", "/protected", nil)
	req1After.Header.Set("Authorization", "Bearer "+tokenDevice1)
	w1After := httptest.NewRecorder()
	r.ServeHTTP(w1After, req1After)
	assert.Equal(t, http.StatusUnauthorized, w1After.Code)
	assert.Contains(t, w1After.Body.String(), "CONCURRENT_SESSION_TERMINATED")

	// 4. Device 2 makes request with token 2 -> MUST SUCCEED
	req2, _ := http.NewRequest("GET", "/protected", nil)
	req2.Header.Set("Authorization", "Bearer "+tokenDevice2)
	w2 := httptest.NewRecorder()
	r.ServeHTTP(w2, req2)
	assert.Equal(t, http.StatusOK, w2.Code)
}
