package services

import (
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"gorm.io/gorm"

	"github.com/modeptrai/exam-model-backend/internal/models"
)

var questionImgRegex = regexp.MustCompile(`src=["'](/uploads/questions/[^"']+)["']`)

// ExtractQuestionImageURLs extracts all unique image URLs matching `/uploads/questions/...` from HTML / text strings.
func ExtractQuestionImageURLs(texts ...string) []string {
	seen := make(map[string]bool)
	var result []string

	for _, text := range texts {
		if text == "" {
			continue
		}
		matches := questionImgRegex.FindAllStringSubmatch(text, -1)
		for _, match := range matches {
			if len(match) > 1 {
				url := match[1]
				if !seen[url] {
					seen[url] = true
					result = append(result, url)
				}
			}
		}
	}

	return result
}

// DeletePhysicalImages removes physical files corresponding to the given question image URLs from the default `./uploads` folder.
func DeletePhysicalImages(imageURLs []string) {
	DeletePhysicalImagesWithBaseDir(filepath.Join(".", "uploads"), imageURLs)
}

// DeletePhysicalImagesWithBaseDir removes physical files for testing or custom base upload directory.
func DeletePhysicalImagesWithBaseDir(baseUploadsDir string, imageURLs []string) {
	for _, rawURL := range imageURLs {
		// URLs are like "/uploads/questions/9/abc.png"
		if !strings.HasPrefix(rawURL, "/uploads/questions/") {
			continue
		}

		relPath := strings.TrimPrefix(rawURL, "/uploads/")
		// Sanitize path to prevent directory traversal
		cleanRelPath := filepath.Clean(relPath)
		if strings.HasPrefix(cleanRelPath, "..") {
			continue
		}

		fullPath := filepath.Join(baseUploadsDir, strings.TrimPrefix(cleanRelPath, "uploads/"))
		if _, err := os.Stat(fullPath); err == nil {
			_ = os.Remove(fullPath)
		}
	}
}

// FilterUnusedQuestionImages returns only image URLs that are not referenced by any other questions in the database
func FilterUnusedQuestionImages(db *gorm.DB, imageURLs []string, deletingQuestionIDs []string) []string {
	if len(imageURLs) == 0 {
		return nil
	}

	var unused []string
	for _, imgURL := range imageURLs {
		if imgURL == "" {
			continue
		}
		var count int64
		query := db.Model(&models.Question{}).
			Where("content LIKE ? OR CAST(options AS TEXT) LIKE ? OR solution_guide LIKE ? OR hint LIKE ? OR short_answer LIKE ? OR general_method LIKE ? OR mistakes LIKE ?",
				"%"+imgURL+"%", "%"+imgURL+"%", "%"+imgURL+"%", "%"+imgURL+"%", "%"+imgURL+"%", "%"+imgURL+"%", "%"+imgURL+"%")
		if len(deletingQuestionIDs) > 0 {
			query = query.Where("id NOT IN (?)", deletingQuestionIDs)
		}
		if err := query.Count(&count).Error; err == nil && count == 0 {
			unused = append(unused, imgURL)
		}
	}
	return unused
}

