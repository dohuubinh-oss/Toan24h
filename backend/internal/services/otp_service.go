package services

import (
	"context"
	crand "crypto/rand"
	"fmt"
	"math/big"
	"math/rand"
	"sync"
	"time"

	"github.com/modeptrai/exam-model-backend/internal/config"
)

type otpItem struct {
	code      string
	attempts  int
	expiresAt time.Time
}

var (
	memoryOTPStore sync.Map
)

type OTPService struct{}

func NewOTPService() *OTPService {
	return &OTPService{}
}

// GenerateOTP generates a cryptographically secure 6-digit numeric string
func (s *OTPService) GenerateOTP() string {
	n, err := crand.Int(crand.Reader, big.NewInt(1000000))
	if err != nil {
		r := rand.New(rand.NewSource(time.Now().UnixNano()))
		return fmt.Sprintf("%06d", r.Intn(1000000))
	}
	return fmt.Sprintf("%06d", n.Int64())
}

// SaveOTP stores the OTP for 10 minutes
func (s *OTPService) SaveOTP(email, otp string) error {
	key := fmt.Sprintf("otp:forgot:%s", email)

	// Try Redis if available
	if config.RedisClient != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
		defer cancel()
		_ = config.RedisClient.Del(ctx, key+":attempts").Err()
		err := config.RedisClient.Set(ctx, key, otp, 10*time.Minute).Err()
		if err == nil {
			return nil
		}
	}

	// In-memory fallback
	memoryOTPStore.Store(key, otpItem{
		code:      otp,
		attempts:  0,
		expiresAt: time.Now().Add(10 * time.Minute),
	})
	return nil
}

// VerifyOTP checks if the provided OTP is valid for the given email with max 5 attempts limit
func (s *OTPService) VerifyOTP(email, otp string) bool {
	key := fmt.Sprintf("otp:forgot:%s", email)

	// Check Redis first if available
	if config.RedisClient != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
		defer cancel()
		attempts, _ := config.RedisClient.Incr(ctx, key+":attempts").Result()
		if attempts > 5 {
			_ = config.RedisClient.Del(ctx, key).Err()
			_ = config.RedisClient.Del(ctx, key+":attempts").Err()
			return false
		}
		savedOTP, err := config.RedisClient.Get(ctx, key).Result()
		if err == nil && savedOTP == otp {
			return true
		}
		return false
	}

	// Check in-memory fallback
	val, ok := memoryOTPStore.Load(key)
	if !ok {
		return false
	}

	item, ok := val.(otpItem)
	if !ok {
		return false
	}

	if time.Now().After(item.expiresAt) || item.attempts >= 5 {
		memoryOTPStore.Delete(key)
		return false
	}

	if item.code == otp {
		return true
	}

	// Increment attempts and lockout after 5 tries
	item.attempts++
	if item.attempts >= 5 {
		memoryOTPStore.Delete(key)
	} else {
		memoryOTPStore.Store(key, item)
	}

	return false
}

// DeleteOTP removes the OTP key after successful reset
func (s *OTPService) DeleteOTP(email string) {
	key := fmt.Sprintf("otp:forgot:%s", email)

	if config.RedisClient != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
		defer cancel()
		_ = config.RedisClient.Del(ctx, key).Err()
	}

	memoryOTPStore.Delete(key)
}
