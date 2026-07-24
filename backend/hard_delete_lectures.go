package main

import (
	"fmt"
	"log"

	"github.com/modeptrai/exam-model-backend/internal/config"
	"github.com/modeptrai/exam-model-backend/internal/models"
)

func main() {
	config.LoadConfig()
	if err := config.ConnectDB(config.Env.DBDSN); err != nil {
		log.Fatalf("Database connection failed: %v", err)
	}

	fmt.Println("Starting to hard delete all lectures...")
	result := config.DB.Unscoped().Where("1 = 1").Delete(&models.Lecture{})
	if result.Error != nil {
		log.Fatalf("Failed to delete lectures: %v", result.Error)
	}

	fmt.Printf("Successfully deleted %d lectures.\n", result.RowsAffected)
}
