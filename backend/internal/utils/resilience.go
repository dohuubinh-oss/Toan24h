package utils

import (
	"log"
	"time"

	"github.com/sony/gobreaker"
)

var AIBreaker *gobreaker.CircuitBreaker
var TelegramBreaker *gobreaker.CircuitBreaker

func init() {
	var aiSt gobreaker.Settings
	aiSt.Name = "Gemini-AI"
	aiSt.MaxRequests = 3
	aiSt.Interval = 10 * time.Second
	aiSt.Timeout = 30 * time.Second
	aiSt.ReadyToTrip = func(counts gobreaker.Counts) bool {
		return counts.ConsecutiveFailures >= 5
	}
	aiSt.OnStateChange = func(name string, from gobreaker.State, to gobreaker.State) {
		log.Printf("Circuit Breaker '%s' state changed from %s to %s\n", name, from, to)
	}
	AIBreaker = gobreaker.NewCircuitBreaker(aiSt)

	var teleSt gobreaker.Settings
	teleSt.Name = "Telegram-API"
	teleSt.MaxRequests = 3
	teleSt.Interval = 10 * time.Second
	teleSt.Timeout = 30 * time.Second
	teleSt.ReadyToTrip = func(counts gobreaker.Counts) bool {
		return counts.ConsecutiveFailures >= 3
	}
	teleSt.OnStateChange = func(name string, from gobreaker.State, to gobreaker.State) {
		log.Printf("Circuit Breaker '%s' state changed from %s to %s\n", name, from, to)
	}
	TelegramBreaker = gobreaker.NewCircuitBreaker(teleSt)
}

// ExecuteWithRetry is a simple wrapper for retry logic, can be used inside or outside circuit breaker
func ExecuteWithRetry(attempts int, sleep time.Duration, fn func() (interface{}, error)) (interface{}, error) {
	var res interface{}
	var err error
	for i := 0; i < attempts; i++ {
		res, err = fn()
		if err == nil {
			return res, nil
		}
		time.Sleep(sleep)
	}
	return res, err
}
