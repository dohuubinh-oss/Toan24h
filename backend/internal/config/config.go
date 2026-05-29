package config

import (
	"fmt"
	"os"

	"github.com/joho/godotenv"
)

type AppConfig struct {
	Port     string
	DBDSN    string
	RedisURL string
}

var Env *AppConfig

// LoadConfig reads the .env file and populates the AppConfig.
func LoadConfig() error {
	_ = godotenv.Load("../.env") // Try loading from project root or current dir
	_ = godotenv.Load(".env")

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	dbDSN := os.Getenv("DB_DSN")
	if dbDSN == "" {
		return fmt.Errorf("DB_DSN is required in environment variables")
	}

	redisURL := os.Getenv("REDIS_URL")
	if redisURL == "" {
		redisURL = "localhost:6379"
	}

	Env = &AppConfig{
		Port:     port,
		DBDSN:    dbDSN,
		RedisURL: redisURL,
	}
	return nil
}
