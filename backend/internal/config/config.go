package config

import (
	"fmt"
	"os"

	"github.com/joho/godotenv"
)

type AppConfig struct {
	Port          string
	DBDSN         string
	RedisURL      string
	RedisPassword string
	FrontendURL   string
	JWTSecret     string
	SMTPHost      string
	SMTPPort      string
	SMTPUser      string
	SMTPPass      string
	SMTPFrom      string
	PayOSClientID    string
	PayOSAPIKey      string
	PayOSChecksumKey string
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

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		return fmt.Errorf("JWT_SECRET is required in environment variables")
	}

	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "http://localhost:3000"
	}

	redisPassword := os.Getenv("REDIS_PASSWORD")

	smtpHost := os.Getenv("SMTP_HOST")
	smtpPort := os.Getenv("SMTP_PORT")
	if smtpPort == "" {
		smtpPort = "587"
	}
	smtpUser := os.Getenv("SMTP_USER")
	smtpPass := os.Getenv("SMTP_PASS")
	smtpFrom := os.Getenv("SMTP_FROM")
	if smtpFrom == "" && smtpUser != "" {
		smtpFrom = smtpUser
	}

	payosClientID := os.Getenv("PAYOS_CLIENT_ID")
	payosAPIKey := os.Getenv("PAYOS_API_KEY")
	payosChecksumKey := os.Getenv("PAYOS_CHECKSUM_KEY")

	Env = &AppConfig{
		Port:             port,
		DBDSN:            dbDSN,
		RedisURL:         redisURL,
		RedisPassword:    redisPassword,
		FrontendURL:      frontendURL,
		JWTSecret:        jwtSecret,
		SMTPHost:         smtpHost,
		SMTPPort:         smtpPort,
		SMTPUser:         smtpUser,
		SMTPPass:         smtpPass,
		SMTPFrom:         smtpFrom,
		PayOSClientID:    payosClientID,
		PayOSAPIKey:      payosAPIKey,
		PayOSChecksumKey: payosChecksumKey,
	}
	return nil
}

