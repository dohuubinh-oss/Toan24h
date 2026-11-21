package services

import (
	"context"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/modeptrai/exam-model-backend/internal/config"
	"github.com/modeptrai/exam-model-backend/internal/models"
	"gorm.io/gorm"
)

const SessionTTL = 7 * 24 * time.Hour

var (
	localSessionMu    sync.RWMutex
	localSessionStore = make(map[string]string) // userID.String() -> sessionID
)

func sessionRedisKey(userID uuid.UUID) string {
	return "user_session:" + userID.String()
}

// ResetLocalSessionStoreForTest clears the local session map (used in tests)
func ResetLocalSessionStoreForTest() {
	localSessionMu.Lock()
	defer localSessionMu.Unlock()
	localSessionStore = make(map[string]string)
}

// SetActiveSession registers a new active session for a user, superseding any prior sessions
func SetActiveSession(ctx context.Context, db *gorm.DB, userID uuid.UUID, sessionID string) error {
	userKey := userID.String()

	// 1. Update local cache
	localSessionMu.Lock()
	localSessionStore[userKey] = sessionID
	localSessionMu.Unlock()

	// 2. Update PostgreSQL
	if db != nil {
		if err := db.WithContext(ctx).Model(&models.User{}).Where("id = ?", userID).Update("active_session_id", sessionID).Error; err != nil {
			return err
		}
	}

	// 3. Update Redis
	if config.RedisClient != nil {
		_ = config.RedisClient.Set(ctx, sessionRedisKey(userID), sessionID, SessionTTL).Err()
	}

	return nil
}

// InvalidateSession clears the active session for a user upon logout
func InvalidateSession(ctx context.Context, db *gorm.DB, userID uuid.UUID) error {
	userKey := userID.String()

	// 1. Clear local cache
	localSessionMu.Lock()
	delete(localSessionStore, userKey)
	localSessionMu.Unlock()

	// 2. Clear PostgreSQL
	if db != nil {
		if err := db.WithContext(ctx).Model(&models.User{}).Where("id = ?", userID).Update("active_session_id", nil).Error; err != nil {
			return err
		}
	}

	// 3. Clear Redis
	if config.RedisClient != nil {
		_ = config.RedisClient.Del(ctx, sessionRedisKey(userID)).Err()
	}

	return nil
}

// ValidateActiveSession verifies that the presented sessionID matches the user's single active session
func ValidateActiveSession(ctx context.Context, db *gorm.DB, userID uuid.UUID, sessionID string) (bool, error) {
	if sessionID == "" {
		return true, nil
	}

	userKey := userID.String()

	// 1. Check Redis first (fast path)
	if config.RedisClient != nil {
		val, err := config.RedisClient.Get(ctx, sessionRedisKey(userID)).Result()
		if err == nil {
			return val == sessionID, nil
		}
	}

	// 2. Fallback to PostgreSQL
	if db != nil {
		var activeSessionID *string
		err := db.WithContext(ctx).Table("users").Select("active_session_id").Where("id = ? AND deleted_at IS NULL", userID).Scan(&activeSessionID).Error
		if err != nil {
			return false, err
		}

		if activeSessionID != nil && *activeSessionID != "" {
			isValid := *activeSessionID == sessionID
			if isValid && config.RedisClient != nil {
				_ = config.RedisClient.Set(ctx, sessionRedisKey(userID), sessionID, SessionTTL).Err()
			}
			return isValid, nil
		}
	}

	// 3. Check local in-memory session store
	localSessionMu.RLock()
	stored, exists := localSessionStore[userKey]
	localSessionMu.RUnlock()

	if exists {
		return stored == sessionID, nil
	}

	// If no record anywhere and DB is nil, allow (graceful fallback)
	if db == nil {
		return true, nil
	}

	return true, nil
}
