//go:build ignore
// +build ignore

package main

import (
	"fmt"
	"log"

	"github.com/modeptrai/exam-model-backend/internal/config"
	"github.com/modeptrai/exam-model-backend/internal/models"
)

func main() {
	if err := config.LoadConfig(); err != nil {
		log.Fatal(err)
	}
	config.ConnectDB(config.Env.DBDSN)

	var exam models.Exam
	if err := config.DB.First(&exam).Error; err != nil {
		log.Fatal(err)
	}
	fmt.Printf("Exam IDs type: %T, len: %d\n", exam.QuestionIDs, len(exam.QuestionIDs))
	
	// What if we convert to []string
	var allQuestions2 []models.Question
	err := config.DB.Where("id IN ? OR parent_id IN ?", []string(exam.QuestionIDs), []string(exam.QuestionIDs)).Find(&allQuestions2).Error
	if err != nil {
		log.Fatal(err)
	}
	fmt.Printf("Questions found with []string: %d\n", len(allQuestions2))
}
