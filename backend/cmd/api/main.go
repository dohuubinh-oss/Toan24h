package main

import (
	"log"

	"github.com/modeptrai/exam-model-backend/internal/config"
	"github.com/modeptrai/exam-model-backend/internal/models"
	"github.com/modeptrai/exam-model-backend/internal/routes"
	"github.com/modeptrai/exam-model-backend/internal/services"
)

func main() {
	log.Println("Starting Toan24h API Server...")

	// 0. Khởi chạy Cronjobs (dọn rác hệ thống)
	services.StartCronJobs()

	// 1. Load config
	if err := config.LoadConfig(); err != nil {
		log.Fatalf("Config error: %v", err)
	}

	// 2. Connect Database (Fail Fast if error)
	if err := config.ConnectDB(config.Env.DBDSN); err != nil {
		log.Fatalf("Database connection failed: %v", err)
	}

	// 2.1. Auto Migrate Models
	log.Println("Running Auto Migration...")
	if err := config.DB.AutoMigrate(&models.Question{}); err != nil {
		log.Fatalf("Auto Migrate failed: %v", err)
	}

	// 3. Connect Redis (Fail Fast if error)
	if err := config.ConnectRedis(config.Env.RedisURL); err != nil {
		log.Fatalf("Redis connection failed: %v", err)
	}

	// 4. Khởi động Web Server (Gin)
	r := routes.SetupRouter()
	log.Println("Server running on port 8080...")
	if err := r.Run(":8080"); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
