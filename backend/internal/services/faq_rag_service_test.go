package services

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestFAQRagService_EmptyQuestion(t *testing.T) {
	service := NewFAQRagService(nil)
	resp, err := service.AskFAQ(context.Background(), "   ")
	assert.NoError(t, err)
	assert.NotNil(t, resp)
	assert.Contains(t, resp.Answer, "toan6789.vn")
}

func TestFAQRagService_Init(t *testing.T) {
	service := NewFAQRagService(nil)
	assert.NotNil(t, service)
	assert.NotNil(t, service.client)
}
