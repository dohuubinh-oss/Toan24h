package config

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/redis/go-redis/v9"
)

var RedisClient *redis.Client

// ConnectRedis initializes the Redis client.
func ConnectRedis(rawURL string) error {
	opts, err := redis.ParseURL(rawURL)
	if err != nil {
		// Fallback nếu rawURL không phải dạng URL redis:// mà chỉ là host:port
		opts = &redis.Options{
			Addr:     rawURL,
			Password: Env.RedisPassword,
			DB:       0,
		}
	}

	RedisClient = redis.NewClient(opts)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err = RedisClient.Ping(ctx).Result()
	if err != nil {
		return fmt.Errorf("failed to connect to Redis: %w", err)
	}

	log.Println("Successfully connected to Redis")
	return nil
}
