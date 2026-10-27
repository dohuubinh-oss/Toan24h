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

var tempImgRegex = regexp.MustCompile(`src="/uploads/temp/([^"]+)"`)

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



type MethodRequest struct {
	ID            string           `json:"id"`
	MethodName    string           `json:"methodName,omitempty"`
	MethodContent string           `json:"methodContent,omitempty"`
	Solution      string           `json:"solution,omitempty"`
	Exercise      *ExerciseRequest `json:"exercise"`
	ProblemImage  string           `json:"problemImage"`
	SolutionImage string           `json:"solutionImage"`
}

type DangToanRequest struct {
	ID           string          `json:"id"`
	DangToanName string          `json:"dangToanName,omitempty"`
	MathType     string          `json:"mathType,omitempty"`
	Methods      []MethodRequest `json:"methods"`
}

type CreateLectureRequest struct {
	Title        string            `json:"title"`
	Grade        string            `json:"grade"`
	Category     string            `json:"category"`
	BasicConcept string            `json:"basicConcept"`
	Examples     []DangToanRequest `json:"examples"`
	GgLink       string            `json:"gg_link"`
	AuthorID     *string           `json:"authorId,omitempty"`
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
	UpdateLecture(ctx context.Context, id string, req CreateLectureRequest) error
	GetLecturesByGrade(ctx context.Context, grade string, page, limit int) (*PaginatedLectures, error)
	GetAllLectures(ctx context.Context) ([]models.Lecture, error)
	GetLectureByID(ctx context.Context, id string) (*models.Lecture, error)
	DeleteLecture(ctx context.Context, id string) error
}

type lectureService struct {
	repo repository.LectureRepository
}

func NewLectureService(repo repository.LectureRepository) LectureService {
	return &lectureService{repo: repo}
}

func processLectureImagesAndSerialize(grade string, basicConcept string, examples []DangToanRequest) (string, string) {
	processLectureImageUrl := func(originalUrl string) string {
		if originalUrl == "" || !strings.HasPrefix(originalUrl, "/uploads/temp/") {
			return originalUrl
		}

		rawFileName := strings.TrimPrefix(originalUrl, "/uploads/temp/")
		fileName := filepath.Base(rawFileName)
		if fileName == "." || fileName == "/" || fileName == ".." {
			return originalUrl
		}

		sourcePath := filepath.Join(".", "uploads", "temp", fileName)

		ext := filepath.Ext(fileName)
		baseName := strings.TrimSuffix(fileName, ext)
		newFileName := fmt.Sprintf("%s_%s%s", baseName, uuid.New().String()[:8], ext)

		cleanGrade := filepath.Base(filepath.Clean(grade))
		if cleanGrade == "." || cleanGrade == "/" || cleanGrade == ".." {
			cleanGrade = "other"
		}
		finalDir := filepath.Join(".", "uploads", "lectures", cleanGrade)

		if err := os.MkdirAll(finalDir, os.ModePerm); err != nil {
			return originalUrl
		}

		finalPath := filepath.Join(finalDir, newFileName)
		if err := os.Rename(sourcePath, finalPath); err != nil {
			return originalUrl
		}

		return fmt.Sprintf("/uploads/lectures/%s/%s", grade, newFileName)
	}

	processHtmlImages := func(htmlContent string) string {
		return tempImgRegex.ReplaceAllStringFunc(htmlContent, func(match string) string {
			parts := tempImgRegex.FindStringSubmatch(match)
			if len(parts) > 1 {
				originalUrl := "/uploads/temp/" + parts[1]
				newUrl := processLectureImageUrl(originalUrl)
				return fmt.Sprintf(`src="%s"`, newUrl)
			}
			return match
		})
	}

	// Process Examples (DangToanList)
	for i := range examples {
		if examples[i].DangToanName == "" && examples[i].MathType != "" {
			examples[i].DangToanName = examples[i].MathType
		} else if examples[i].MathType == "" && examples[i].DangToanName != "" {
			examples[i].MathType = examples[i].DangToanName
		}

		for j := range examples[i].Methods {
			if examples[i].Methods[j].ProblemImage != "" {
				examples[i].Methods[j].ProblemImage = processLectureImageUrl(examples[i].Methods[j].ProblemImage)
			}
			if examples[i].Methods[j].SolutionImage != "" {
				examples[i].Methods[j].SolutionImage = processLectureImageUrl(examples[i].Methods[j].SolutionImage)
			}
			// Process images inside method content if any
			if examples[i].Methods[j].MethodContent != "" {
				examples[i].Methods[j].MethodContent = processHtmlImages(examples[i].Methods[j].MethodContent)
			}
			if examples[i].Methods[j].Solution != "" {
				examples[i].Methods[j].Solution = processHtmlImages(examples[i].Methods[j].Solution)
			}

			// Synchronize Solution and MethodContent
			if examples[i].Methods[j].MethodContent == "" && examples[i].Methods[j].Solution != "" {
				examples[i].Methods[j].MethodContent = examples[i].Methods[j].Solution
			} else if examples[i].Methods[j].Solution == "" && examples[i].Methods[j].MethodContent != "" {
				examples[i].Methods[j].Solution = examples[i].Methods[j].MethodContent
			}

			// Process images inside Exercise
			if examples[i].Methods[j].Exercise != nil {
				ex := examples[i].Methods[j].Exercise
				if ex.Content != "" {
					ex.Content = processHtmlImages(ex.Content)
				}
			}
		}
	}
	examplesJson, _ := json.Marshal(examples)
	if len(examples) == 0 {
		examplesJson = []byte("[]")
	}

	return processHtmlImages(basicConcept), string(examplesJson)
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

	basicConcept := req.BasicConcept
	if basicConcept == "<p>Nhập khái niệm cơ bản tại đây...</p>" || basicConcept == "<p></p>" {
		basicConcept = ""
	}

	lectureID := uuid.New()
	processedConcept, examplesStr := processLectureImagesAndSerialize(req.Grade, basicConcept, req.Examples)

	var authorUUID *uuid.UUID
	if req.AuthorID != nil && *req.AuthorID != "" {
		if uid, err := uuid.Parse(*req.AuthorID); err == nil {
			authorUUID = &uid
		}
	}

	// Mapping DTO to Model
	lecture := &models.Lecture{
		ID:           lectureID,
		Title:        req.Title,
		Grade:        req.Grade,
		Category:     req.Category,
		BasicConcept: processedConcept,
		Examples:     examplesStr,
		GgLink:       req.GgLink,
		AuthorID:     authorUUID,
	}

	return s.repo.CreateLecture(ctx, lecture)
}

func (s *lectureService) UpdateLecture(ctx context.Context, id string, req CreateLectureRequest) error {
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

	lecture, err := s.repo.GetLectureByID(ctx, id)
	if err != nil {
		return errors.New("lecture not found")
	}

	basicConcept := req.BasicConcept
	if basicConcept == "<p>Nhập khái niệm cơ bản tại đây...</p>" || basicConcept == "<p></p>" {
		basicConcept = ""
	}

	processedConcept, examplesStr := processLectureImagesAndSerialize(req.Grade, basicConcept, req.Examples)

	lecture.Title = req.Title
	lecture.Grade = req.Grade
	lecture.Category = req.Category
	lecture.BasicConcept = processedConcept
	lecture.Examples = examplesStr
	lecture.GgLink = req.GgLink
	if req.AuthorID != nil && *req.AuthorID != "" {
		if uid, err := uuid.Parse(*req.AuthorID); err == nil {
			lecture.AuthorID = &uid
		}
	}

	return s.repo.UpdateLecture(ctx, lecture)
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

func (s *lectureService) GetAllLectures(ctx context.Context) ([]models.Lecture, error) {
	return s.repo.GetAllLectures(ctx)
}

func (s *lectureService) GetLectureByID(ctx context.Context, id string) (*models.Lecture, error) {
	return s.repo.GetLectureByID(ctx, id)
}

func (s *lectureService) DeleteLecture(ctx context.Context, id string) error {
	return s.repo.DeleteLecture(ctx, id)
}

