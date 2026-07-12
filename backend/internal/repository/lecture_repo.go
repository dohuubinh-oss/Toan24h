package repository

import (
	"context"

	"github.com/modeptrai/exam-model-backend/internal/models"
	"gorm.io/gorm"
)

type LectureRepository interface {
	CreateLecture(ctx context.Context, lecture *models.Lecture) error
	GetLecturesByGrade(ctx context.Context, grade string, limit, offset int) ([]models.Lecture, int64, error)
	GetLectureByID(ctx context.Context, id string) (*models.Lecture, error)
}

type lectureRepository struct {
	db *gorm.DB
}

func NewLectureRepository(db *gorm.DB) LectureRepository {
	return &lectureRepository{db: db}
}

func (r *lectureRepository) CreateLecture(ctx context.Context, lecture *models.Lecture) error {
	// Use transaction to ensure Lecture, Examples, and Steps are all saved or rolled back together
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(lecture).Error; err != nil {
			return err
		}
		return nil
	})
}

func (r *lectureRepository) GetLecturesByGrade(ctx context.Context, grade string, limit, offset int) ([]models.Lecture, int64, error) {
	var lectures []models.Lecture
	var total int64

	query := r.db.WithContext(ctx).Model(&models.Lecture{}).Where("grade = ?", grade)

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if err := query.Order("created_at desc").Limit(limit).Offset(offset).Find(&lectures).Error; err != nil {
		return nil, 0, err
	}

	return lectures, total, nil
}

func (r *lectureRepository) GetLectureByID(ctx context.Context, id string) (*models.Lecture, error) {
	var lecture models.Lecture
	if err := r.db.WithContext(ctx).First(&lecture, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &lecture, nil
}
