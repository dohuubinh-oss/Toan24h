package services

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"github.com/google/uuid"
	"github.com/modeptrai/exam-model-backend/internal/models"
	"github.com/modeptrai/exam-model-backend/internal/repository"
)

// DTOs for the request
type StepRequest struct {
	StepOrder int    `json:"step"` // from frontend `step`
	Title     string `json:"title"`
	Content   string `json:"content"`
	Formula   string `json:"formula"`
}

type ExerciseRequest struct {
	Content string `json:"content"`
}

type MediaItemRequest struct {
	ID   string `json:"id"`
	Type string `json:"type"`
	Url  string `json:"url"`
}

type MethodRequest struct {
	ID            string           `json:"id"`
	MethodName    string           `json:"methodName"`
	MethodContent string           `json:"methodContent"`
	Exercise      *ExerciseRequest `json:"exercise"`
	ProblemImage  string           `json:"problemImage"`
	SolutionImage string           `json:"solutionImage"`
}

type DangToanRequest struct {
	ID           string          `json:"id"`
	DangToanName string          `json:"dangToanName"`
	Methods      []MethodRequest `json:"methods"`
}

type CreateLectureRequest struct {
	Title        string             `json:"title"`
	Grade        string             `json:"grade"`
	Category     string             `json:"category"`
	BasicConcept string             `json:"basicConcept"`
	MediaItems   []MediaItemRequest `json:"mediaItems"`
	PracticeIds  []string           `json:"practiceIds"`
	Examples     []DangToanRequest  `json:"examples"`
}

type PaginatedLectures struct {
	Data        []models.Lecture `json:"data"`
	CurrentPage int              `json:"currentPage"`
	TotalPages  int              `json:"totalPages"`
	TotalItems  int64            `json:"totalItems"`
	StartIndex  int              `json:"startIndex"`
	EndIndex    int              `json:"endIndex"`
}

type LectureService interface {
	CreateLecture(ctx context.Context, req CreateLectureRequest) error
	GetLecturesByGrade(ctx context.Context, grade string, page, limit int) (*PaginatedLectures, error)
	GetLectureByID(ctx context.Context, id string) (*models.Lecture, error)
}

type lectureService struct {
	repo repository.LectureRepository
}

func NewLectureService(repo repository.LectureRepository) LectureService {
	return &lectureService{repo: repo}
}

func (s *lectureService) CreateLecture(ctx context.Context, req CreateLectureRequest) error {
	// Validation
	if req.Title == "" {
		return errors.New("title is required")
	}
	if req.Grade == "" {
		return errors.New("grade is required")
	}
	if req.Category == "" {
		return errors.New("category is required")
	}

	hasBasicConcept := req.BasicConcept != "" && req.BasicConcept != "<p>Nhập khái niệm cơ bản tại đây...</p>" && req.BasicConcept != "<p></p>"
	hasMedia := len(req.MediaItems) > 0
	hasExamples := len(req.Examples) > 0

	if !hasBasicConcept && !hasMedia && !hasExamples {
		return errors.New("must provide at least basic concept, multimedia or examples")
	}

	lectureID := uuid.New()

	processLectureImageUrl := func(originalUrl string) string {
		if originalUrl == "" || !strings.HasPrefix(originalUrl, "/uploads/temp/") {
			return originalUrl
		}

		fileName := strings.TrimPrefix(originalUrl, "/uploads/temp/")
		sourcePath := filepath.Join(".", "uploads", "temp", fileName)

		ext := filepath.Ext(fileName)
		baseName := strings.TrimSuffix(fileName, ext)
		newFileName := fmt.Sprintf("%s_%s%s", baseName, uuid.New().String()[:8], ext)

		finalDir := filepath.Join(".", "uploads", "lectures", req.Grade)

		if err := os.MkdirAll(finalDir, os.ModePerm); err != nil {
			return originalUrl
		}

		finalPath := filepath.Join(finalDir, newFileName)
		if err := os.Rename(sourcePath, finalPath); err != nil {
			return originalUrl
		}

		return fmt.Sprintf("/uploads/lectures/%s/%s", req.Grade, newFileName)
	}

	processHtmlImages := func(htmlContent string) string {
		re := regexp.MustCompile(`src="/uploads/temp/([^"]+)"`)
		return re.ReplaceAllStringFunc(htmlContent, func(match string) string {
			parts := re.FindStringSubmatch(match)
			if len(parts) > 1 {
				originalUrl := "/uploads/temp/" + parts[1]
				newUrl := processLectureImageUrl(originalUrl)
				return fmt.Sprintf(`src="%s"`, newUrl)
			}
			return match
		})
	}

	practiceIdsJson, _ := json.Marshal(req.PracticeIds)
	if len(req.PracticeIds) == 0 {
		practiceIdsJson = []byte("[]")
	}
	
	// Process MediaItems
	for i := range req.MediaItems {
		if req.MediaItems[i].Type == "image" {
			req.MediaItems[i].Url = processLectureImageUrl(req.MediaItems[i].Url)
		}
	}
	mediaItemsJson, _ := json.Marshal(req.MediaItems)
	if len(req.MediaItems) == 0 {
		mediaItemsJson = []byte("[]")
	}

	// Process Examples (DangToanList)
	for i := range req.Examples {
		for j := range req.Examples[i].Methods {
			if req.Examples[i].Methods[j].ProblemImage != "" {
				req.Examples[i].Methods[j].ProblemImage = processLectureImageUrl(req.Examples[i].Methods[j].ProblemImage)
			}
			if req.Examples[i].Methods[j].SolutionImage != "" {
				req.Examples[i].Methods[j].SolutionImage = processLectureImageUrl(req.Examples[i].Methods[j].SolutionImage)
			}
			// Process images inside method content if any
			if req.Examples[i].Methods[j].MethodContent != "" {
				req.Examples[i].Methods[j].MethodContent = processHtmlImages(req.Examples[i].Methods[j].MethodContent)
			}
			// Process images inside Exercise
			if req.Examples[i].Methods[j].Exercise != nil {
				ex := req.Examples[i].Methods[j].Exercise
				if ex.Content != "" {
					ex.Content = processHtmlImages(ex.Content)
				}
			}
		}
	}
	examplesJson, _ := json.Marshal(req.Examples)
	if len(req.Examples) == 0 {
		examplesJson = []byte("[]")
	}

	// Mapping DTO to Model
	lecture := &models.Lecture{
		ID:           lectureID,
		Title:        req.Title,
		Grade:        req.Grade,
		Category:     req.Category,
		BasicConcept: processHtmlImages(req.BasicConcept),
		MediaItems:   string(mediaItemsJson),
		Examples:     string(examplesJson),
		PracticeIDs:  string(practiceIdsJson),
	}

	return s.repo.CreateLecture(ctx, lecture)
}

func (s *lectureService) GetLecturesByGrade(ctx context.Context, grade string, page, limit int) (*PaginatedLectures, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 9
	}
	offset := (page - 1) * limit

	lectures, total, err := s.repo.GetLecturesByGrade(ctx, grade, limit, offset)
	if err != nil {
		return nil, err
	}

	totalPages := int((total + int64(limit) - 1) / int64(limit))

	startIndex := offset + 1
	if total == 0 {
		startIndex = 0
	}
	endIndex := offset + len(lectures)

	return &PaginatedLectures{
		Data:        lectures,
		CurrentPage: page,
		TotalPages:  totalPages,
		TotalItems:  total,
		StartIndex:  startIndex,
		EndIndex:    endIndex,
	}, nil
}

func (s *lectureService) GetLectureByID(ctx context.Context, id string) (*models.Lecture, error) {
	return s.repo.GetLectureByID(ctx, id)
}
