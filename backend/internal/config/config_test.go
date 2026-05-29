package config

import (
	"os"
	"testing"
)

func TestLoadConfig_MissingDB(t *testing.T) {
	os.Clearenv()
	err := LoadConfig()
	if err == nil {
		t.Errorf("Expected error when DB_DSN is missing, got nil")
	}
}

func TestLoadConfig_Success(t *testing.T) {
	os.Clearenv()
	os.Setenv("DB_DSN", "dummy-dsn")
	os.Setenv("PORT", "9090")
	os.Setenv("REDIS_URL", "dummy-redis")

	err := LoadConfig()
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	if Env.Port != "9090" {
		t.Errorf("Expected Port 9090, got %s", Env.Port)
	}
	if Env.DBDSN != "dummy-dsn" {
		t.Errorf("Expected DBDSN dummy-dsn, got %s", Env.DBDSN)
	}
	if Env.RedisURL != "dummy-redis" {
		t.Errorf("Expected RedisURL dummy-redis, got %s", Env.RedisURL)
	}
}
