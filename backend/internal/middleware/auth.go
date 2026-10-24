package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/modeptrai/exam-model-backend/internal/utils"
)

// AuthMiddleware intercepts requests, validates the JWT, and sets the user context
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		var tokenString string
		authHeader := c.GetHeader("Authorization")

		if authHeader != "" {
			parts := strings.Split(authHeader, " ")
			if len(parts) == 2 && parts[0] == "Bearer" {
				tokenString = parts[1]
			}
		}

		if tokenString == "" {
			cookieToken, err := c.Cookie("accessToken")
			if err == nil && cookieToken != "" {
				tokenString = cookieToken
			}
		}

		if tokenString == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization token is required"})
			c.Abort()
			return
		}
		claims, err := utils.ValidateAccessToken(tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
			c.Abort()
			return
		}

		// Set UserID and Role in context
		c.Set("userID", claims.UserID)
		c.Set("userRole", claims.Role)
		c.Next()
	}
}

// RoleMiddleware checks if the user has one of the required roles
func RoleMiddleware(requiredRoles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		roleVal, exists := c.Get("userRole")
		if !exists {
			c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: insufficient permissions"})
			c.Abort()
			return
		}
		userRole, ok := roleVal.(string)
		if !ok {
			c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: insufficient permissions"})
			c.Abort()
			return
		}
		for _, requiredRole := range requiredRoles {
			if userRole == requiredRole {
				c.Next()
				return
			}
		}
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: insufficient permissions"})
		c.Abort()
	}
}
