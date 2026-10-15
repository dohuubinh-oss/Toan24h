package utils

import (
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

const (
	AccessTokenMaxAge  = 24 * 60 * 60     // 24 hours
	RefreshTokenMaxAge = 7 * 24 * 60 * 60 // 7 days
)

// FormatExpiresAt formats a time pointer or returns empty string
func FormatExpiresAt(t *time.Time) string {
	if t == nil {
		return ""
	}
	return t.Format(time.RFC3339)
}

// SetAuthCookies sets access and refresh tokens, user role, grade and expiration cookies
func SetAuthCookies(c *gin.Context, accessToken, refreshToken, role, grade, expiresAt string) {
	domain := ""
	secure := false
	host := c.Request.Host
	origin := c.GetHeader("Origin")

	if strings.Contains(host, "toan6789.vn") || strings.Contains(origin, "toan6789.vn") {
		domain = ".toan6789.vn"
		secure = true
	} else if os.Getenv("GIN_MODE") == "release" && !strings.Contains(host, "localhost") && !strings.Contains(host, "127.0.0.1") {
		secure = true
	}

	c.SetCookie("accessToken", accessToken, AccessTokenMaxAge, "/", domain, secure, true)
	if refreshToken != "" {
		c.SetCookie("refreshToken", refreshToken, RefreshTokenMaxAge, "/", domain, secure, true)
	}
	c.SetCookie("userRole", role, AccessTokenMaxAge, "/", domain, secure, false)
	c.SetCookie("userGrade", grade, AccessTokenMaxAge, "/", domain, secure, false)
	c.SetCookie("userExpiresAt", expiresAt, AccessTokenMaxAge, "/", domain, secure, false)
}

// ClearAuthCookies clears all authentication cookies
func ClearAuthCookies(c *gin.Context) {
	domain := ""
	secure := false
	host := c.Request.Host
	origin := c.GetHeader("Origin")

	if strings.Contains(host, "toan6789.vn") || strings.Contains(origin, "toan6789.vn") {
		domain = ".toan6789.vn"
		secure = true
	} else if os.Getenv("GIN_MODE") == "release" && !strings.Contains(host, "localhost") && !strings.Contains(host, "127.0.0.1") {
		secure = true
	}

	c.SetCookie("accessToken", "", -1, "/", domain, secure, true)
	c.SetCookie("refreshToken", "", -1, "/", domain, secure, true)
	c.SetCookie("userRole", "", -1, "/", domain, secure, false)
	c.SetCookie("userGrade", "", -1, "/", domain, secure, false)
	c.SetCookie("userExpiresAt", "", -1, "/", domain, secure, false)

	if domain != "" {
		c.SetCookie("accessToken", "", -1, "/", "", false, true)
		c.SetCookie("refreshToken", "", -1, "/", "", false, true)
		c.SetCookie("userRole", "", -1, "/", "", false, false)
		c.SetCookie("userGrade", "", -1, "/", "", false, false)
		c.SetCookie("userExpiresAt", "", -1, "/", "", false, false)
	}
}
