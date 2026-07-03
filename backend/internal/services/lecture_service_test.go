package services

import (
	"context"
	"errors"
	"testing"

	"github.com/modeptrai/exam-model-backend/internal/models"
)

// Mock Repository for testing
type mockLectureRepository struct {
	SaveFunc               func(ctx context.Context, lecture *models.Lecture) error
	GetLecturesByGradeFunc func(ctx context.Context, grade string, limit, offset int) ([]models.Lecture, int64, error)
	GetLectureByIDFunc     func(ctx context.Context, id string) (*models.Lecture, error)
}

func (m *mockLectureRepository) CreateLecture(ctx context.Context, lecture *models.Lecture) error {
	if m.SaveFunc != nil {
		return m.SaveFunc(ctx, lecture)
	}
	return nil
}

func (m *mockLectureRepository) GetLecturesByGrade(ctx context.Context, grade string, limit, offset int) ([]models.Lecture, int64, error) {
	if m.GetLecturesByGradeFunc != nil {
		return m.GetLecturesByGradeFunc(ctx, grade, limit, offset)
	}
	return nil, 0, nil
}

func (m *mockLectureRepository) GetLectureByID(ctx context.Context, id string) (*models.Lecture, error) {
	if m.GetLectureByIDFunc != nil {
		return m.GetLectureByIDFunc(ctx, id)
	}
	return nil, nil
}

func TestCreateLectureService(t *testing.T) {
	mockRepo := &mockLectureRepository{
		SaveFunc: func(ctx context.Context, lecture *models.Lecture) error {
			return nil
		},
	}
	service := NewLectureService(mockRepo)

	t.Run("Valid Payload", func(t *testing.T) {
		payload := CreateLectureRequest{
			Title:             "Test Lecture",
			Grade:             "10",
			Category:          "Math",
			BasicConcept:      "Concept",
			Examples: []ExampleRequest{
				{
					ProblemImage:  "example_problem_image",
					SolutionImage: "example_solution_image",
					Exercise: ExerciseRequest{
						Problem: "Solve x",
						Conclusion: "example_conclusion",
						Tips: "example_tips",
						Steps: []StepRequest{
							{StepOrder: 1, Title: "Step 1", Content: "Do this"},
						},
					},
				},
			},
		}

		err := service.CreateLecture(context.Background(), payload)
		if err != nil {
			t.Errorf("Expected no error, got %v", err)
		}
	})

	t.Run("Missing Title", func(t *testing.T) {
		payload := CreateLectureRequest{
			Grade:        "10",
			Category:     "Math",
			BasicConcept: "Concept",
		}

		err := service.CreateLecture(context.Background(), payload)
		if err == nil || err.Error() != "title is required" {
			t.Errorf("Expected 'title is required' error, got %v", err)
		}
	})

	t.Run("Repository Error", func(t *testing.T) {
		mockRepo.SaveFunc = func(ctx context.Context, lecture *models.Lecture) error {
			return errors.New("db error")
		}
		
		payload := CreateLectureRequest{
			Title:        "Test",
			Grade:        "10",
			Category:     "Math",
			BasicConcept: "Concept",
		}

		err := service.CreateLecture(context.Background(), payload)
		if err == nil || err.Error() != "db error" {
			t.Errorf("Expected 'db error', got %v", err)
		}
	})
}

func TestGetLecturesByGrade(t *testing.T) {
	mockRepo := &mockLectureRepository{
		GetLecturesByGradeFunc: func(ctx context.Context, grade string, limit, offset int) ([]models.Lecture, int64, error) {
			if grade == "9" {
				return []models.Lecture{{Title: "L9", Grade: "9"}}, 1, nil
			}
			return nil, 0, errors.New("db error")
		},
	}
	service := NewLectureService(mockRepo)

	t.Run("Success", func(t *testing.T) {
		res, err := service.GetLecturesByGrade(context.Background(), "9", 1, 6)
		if err != nil {
			t.Errorf("Expected no error, got %v", err)
		}
		if res.TotalItems != 1 || len(res.Data) != 1 {
			t.Errorf("Expected 1 item, got %d", res.TotalItems)
		}
		if res.CurrentPage != 1 || res.TotalPages != 1 {
			t.Errorf("Expected currentPage=1, totalPages=1, got %d, %d", res.CurrentPage, res.TotalPages)
		}
	})

	t.Run("Error", func(t *testing.T) {
		_, err := service.GetLecturesByGrade(context.Background(), "8", 1, 6)
		if err == nil || err.Error() != "db error" {
			t.Errorf("Expected 'db error', got %v", err)
		}
	})
}

func TestGetLectureByID(t *testing.T) {
	mockRepo := &mockLectureRepository{
		GetLectureByIDFunc: func(ctx context.Context, id string) (*models.Lecture, error) {
			if id == "123" {
				return &models.Lecture{Title: "Detail"}, nil
			}
			return nil, errors.New("not found")
		},
	}
	service := NewLectureService(mockRepo)

	t.Run("Success", func(t *testing.T) {
		res, err := service.GetLectureByID(context.Background(), "123")
		if err != nil {
			t.Errorf("Expected no error, got %v", err)
		}
		if res.Title != "Detail" {
			t.Errorf("Expected Title 'Detail', got %v", res.Title)
		}
	})

	t.Run("Error", func(t *testing.T) {
		_, err := service.GetLectureByID(context.Background(), "456")
		if err == nil || err.Error() != "not found" {
			t.Errorf("Expected 'not found', got %v", err)
		}
	})
}
