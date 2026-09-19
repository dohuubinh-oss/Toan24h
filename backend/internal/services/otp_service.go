package services

import (
	"context"
	"fmt"
	"math/rand"
	"sync"
	"time"

	"github.com/modeptrai/exam-model-backend/internal/config"
)

type otpItem struct {
	code      string
	expiresAt time.Time
}

var (
	memoryOTPStore sync.Map
)

type OTPService struct{}

func NewOTPService() *OTPService {
	return &OTPService{}
}

// GenerateOTP generates a 6-digit numeric string
func (s *OTPService) GenerateOTP() string {
	r := rand.New(rand.NewSource(time.Now().UnixNano()))
	return fmt.Sprintf("%06d", r.Intn(1000000))
}

// SaveOTP stores the OTP for 10 minutes
func (s *OTPService) SaveOTP(email, otp string) error {
	key := fmt.Sprintf("otp:forgot:%s", email)

	// Try Redis if available
	if config.RedisClient != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
		defer cancel()
		err := config.RedisClient.Set(ctx, key, otp, 10*time.Minute).Err()
		if err == nil {
			return nil
		}
	}

	// In-memory fallback
	memoryOTPStore.Store(key, otpItem{
		code:      otp,
		expiresAt: time.Now().Add(10 * time.Minute),
	})
	return nil
}

// VerifyOTP checks if the provided OTP is valid for the given email
func (s *OTPService) VerifyOTP(email, otp string) bool {
	key := fmt.Sprintf("otp:forgot:%s", email)

	// Check Redis first if available
	if config.RedisClient != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
		defer cancel()
		savedOTP, err := config.RedisClient.Get(ctx, key).Result()
		if err == nil && savedOTP == otp {
			return true
		}
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

	if time.Now().After(item.expiresAt) {
		memoryOTPStore.Delete(key)
		return false
	}

	return item.code == otp
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
