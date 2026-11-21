package middleware

import (
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
)

// ServeUploads phục vụ các file tĩnh an toàn kèm HTTP security & caching headers
func ServeUploads(baseDir string) gin.HandlerFunc {
	absBase, err := filepath.Abs(baseDir)
	if err != nil {
		absBase = baseDir
	}

	return func(c *gin.Context) {
		relPath := c.Param("filepath")
		// Loại bỏ dấu gạch chéo đầu
		relPath = strings.TrimPrefix(relPath, "/")

		// Làm sạch đường dẫn để chống Path Traversal
		cleanRel := filepath.Clean(relPath)
		if strings.HasPrefix(cleanRel, "..") || strings.Contains(cleanRel, "/../") || cleanRel == ".." {
			c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "Invalid file path"})
			return
		}

		fullPath := filepath.Join(absBase, cleanRel)

		// Đảm bảo đường dẫn tuyệt đối vẫn nằm trong absBase
		absTarget, err := filepath.Abs(fullPath)
		if err != nil || !strings.HasPrefix(absTarget, absBase) {
			c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "Invalid file path"})
			return
		}

		// Kiểm tra file có tồn tại và không phải là thư mục
		info, err := os.Stat(absTarget)
		if err != nil || info.IsDir() {
			c.AbortWithStatusJSON(http.StatusNotFound, gin.H{"error": "File not found"})
			return
		}

		// Chỉ cho phép phục vụ các định dạng tài nguyên ảnh an toàn
		ext := strings.ToLower(filepath.Ext(absTarget))
		if ext != ".jpg" && ext != ".jpeg" && ext != ".png" && ext != ".webp" && ext != ".svg" {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "Forbidden file type"})
			return
		}

		// Security headers: ngăn chặn MIME sniffing và vô hiệu hóa mã script trong sandbox
		c.Header("X-Content-Type-Options", "nosniff")
		c.Header("Content-Security-Policy", "default-src 'none'; sandbox")

		// Cache-Control headers tối ưu theo vòng đời tài nguyên
		if strings.HasPrefix(cleanRel, "temp/") || cleanRel == "temp" {
			c.Header("Cache-Control", "no-cache, no-store, must-revalidate")
		} else {
			// Ảnh câu hỏi, bài giảng, avatar: immutable cache 1 năm
			c.Header("Cache-Control", "public, max-age=31536000, immutable")
		}

		http.ServeFile(c.Writer, c.Request, absTarget)
	}
}
