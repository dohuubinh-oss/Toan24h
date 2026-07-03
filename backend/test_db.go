//go:build ignore
// +build ignore

package main

import (
	"fmt"
	"log"

	"github.com/modeptrai/exam-model-backend/internal/config"
)

func main() {
    config.LoadConfig()
	config.ConnectDB(config.Env.DBDSN)
	
	if err := config.DB.Exec("TRUNCATE TABLE lectures CASCADE").Error; err != nil {
		log.Fatalf("Failed to truncate lectures: %v", err)
	}

	fmt.Println("Lectures truncated successfully.")
}
