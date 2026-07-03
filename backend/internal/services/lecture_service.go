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
	"time"

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
	Problem    string        `json:"problem"`
	Conclusion string        `json:"conclusion"`
	Tips       string        `json:"tips"`
	Steps      []StepRequest `json:"steps"`
}

type ExampleRequest struct {
	ID            string          `json:"id"`
	Exercise      ExerciseRequest `json:"exercise"`
	ProblemImage  string          `json:"problemImage"`
	SolutionImage string          `json:"solutionImage"`
}

type CreateLectureRequest struct {
	Title        string           `json:"title"`
	Grade        string           `json:"grade"`
	Category     string           `json:"category"`
	BasicConcept string           `json:"basicConcept"`
	CoverImage   string           `json:"coverImage"`
	VideoUrl     string           `json:"videoUrl"`
	PracticeIds  []string         `json:"practiceIds"`
	Examples     []ExampleRequest `json:"examples"`
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
	hasMedia := req.CoverImage != "" || req.VideoUrl != ""

	if !hasBasicConcept && !hasMedia {
		return errors.New("must provide at least basic concept or multimedia")
	}

	lectureID := uuid.New()

	processLectureImageUrl := func(originalUrl string) string {
		if !strings.HasPrefix(originalUrl, "/uploads/temp/") {
			return originalUrl
		}

		fileName := strings.TrimPrefix(originalUrl, "/uploads/temp/")
		sourcePath := filepath.Join(".", "uploads", "temp", fileName)

		ext := filepath.Ext(fileName)
		baseName := strings.TrimSuffix(fileName, ext)
		newFileName := fmt.Sprintf("%s_%s%s", baseName, uuid.New().String()[:8], ext)

		currentTime := time.Now()
		folderName := fmt.Sprintf("%02d-%d", currentTime.Month(), currentTime.Year())
		finalDir := filepath.Join(".", "uploads", "lectures", folderName)

		if err := os.MkdirAll(finalDir, os.ModePerm); err != nil {
			return originalUrl
		}

		finalPath := filepath.Join(finalDir, newFileName)
		if err := os.Rename(sourcePath, finalPath); err != nil {
			return originalUrl
		}

		return fmt.Sprintf("/uploads/lectures/%s/%s", folderName, newFileName)
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

	// Mapping DTO to Model
	lecture := &models.Lecture{
		ID:           lectureID,
		Title:        req.Title,
		Grade:        req.Grade,
		Category:     req.Category,
		BasicConcept: processHtmlImages(req.BasicConcept),
		CoverImage:   processLectureImageUrl(req.CoverImage),
		VideoUrl:     req.VideoUrl,
		PracticeIDs:  string(practiceIdsJson),
	}

	for _, exReq := range req.Examples {
		example := models.LectureExample{
			Problem:       processHtmlImages(exReq.Exercise.Problem),
			Conclusion:    processHtmlImages(exReq.Exercise.Conclusion),
			Tips:          processHtmlImages(exReq.Exercise.Tips),
			ProblemImage:  processLectureImageUrl(exReq.ProblemImage),
			SolutionImage: processLectureImageUrl(exReq.SolutionImage),
		}

		var stepsToSave []StepRequest
		for _, stepReq := range exReq.Exercise.Steps {
			stepsToSave = append(stepsToSave, StepRequest{
				StepOrder: stepReq.StepOrder,
				Title:     stepReq.Title,
				Content:   processHtmlImages(stepReq.Content),
				Formula:   stepReq.Formula,
			})
		}

		stepsJson, _ := json.Marshal(stepsToSave)
		example.Steps = string(stepsJson)

		lecture.Examples = append(lecture.Examples, example)
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
