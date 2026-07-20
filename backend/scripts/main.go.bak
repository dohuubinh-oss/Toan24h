package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var (
	DB    *gorm.DB
	RDB   *redis.Client
	ctx   = context.Background()
)

func main() {
	// 1. Initialize Database (PostgreSQL)
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "host=db user=exam_user password=exam_password dbname=exam_db port=5432 sslmode=disable"
	}
	
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	DB = db
	fmt.Println("Successfully connected to PostgreSQL")

	// 2. Initialize Cache (Redis)
	redisURL := os.Getenv("REDIS_URL")
	if redisURL == "" {
		redisURL = "cache:6379"
	}
	RDB = redis.NewClient(&redis.Options{
		Addr: redisURL,
	})
	if err := RDB.Ping(ctx).Err(); err != nil {
		log.Printf("Warning: Failed to connect to Redis: %v", err)
	} else {
		fmt.Println("Successfully connected to Redis")
	}

	// 3. Initialize Router (Gin)
	r := gin.Default()

	// CORS Middleware
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	// Routes
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "healthy",
			"concurrency_ready": true,
		})
	})

	// API v1 Group
	v1 := r.Group("/api/v1")
	{
		v1.GET("/ping", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"message": "pong"})
		})
	}

	// 4. Start Server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	fmt.Printf("Server starting on port %s...\n", port)
	r.Run(":" + port)
}
