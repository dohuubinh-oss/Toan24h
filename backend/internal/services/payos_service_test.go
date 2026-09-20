package services_test

import (
	"testing"

	"github.com/modeptrai/exam-model-backend/internal/services"
)

func TestPayOSService_SignatureGeneration(t *testing.T) {
	service := services.NewPayOSService("test-client-id", "test-api-key", "test-checksum-key")

	sig := service.GenerateCreatePaymentSignature(123456, 200000, "Thanh toan goi 1 thang", "https://toan6789.vn/success", "https://toan6789.vn/cancel")
	if sig == "" {
		t.Errorf("Expected non-empty signature")
	}

	// Verify deterministic signature with same inputs
	sig2 := service.GenerateCreatePaymentSignature(123456, 200000, "Thanh toan goi 1 thang", "https://toan6789.vn/success", "https://toan6789.vn/cancel")
	if sig != sig2 {
		t.Errorf("Expected identical signature, got %v and %v", sig, sig2)
	}
}

func TestPayOSService_VerifyWebhookSignature(t *testing.T) {
	checksumKey := "0d54020a13ee42a8b9f71c4c8d55a7ee"
	service := services.NewPayOSService("client-id", "api-key", checksumKey)

	webhookData := services.PayOSWebhookData{
		OrderCode:           1710900000000,
		Amount:              450000,
		Description:         "T24H 1710900000000",
		AccountNumber:       "1234567890",
		Reference:           "FT240101",
		TransactionDateTime: "2026-03-20 12:00:00",
		Currency:            "VND",
		PaymentLinkID:       "link_123",
		Code:                "00",
		Desc:                "success",
	}

	validSig := service.GenerateWebhookDataSignature(webhookData)

	// Test Valid signature
	isValid := service.VerifyWebhookSignature(webhookData, validSig)
	if !isValid {
		t.Errorf("Expected webhook signature to be valid")
	}

	// Test Invalid signature
	isInvalid := service.VerifyWebhookSignature(webhookData, "invalid-sig")
	if isInvalid {
		t.Errorf("Expected invalid webhook signature to fail")
	}
}

func TestPayOSService_MockModeFallback(t *testing.T) {
	service := services.NewPayOSService("", "", "")

	data, err := service.CreatePaymentLink(123456, 200000, "Thanh toan goi 1 thang", "https://toan6789.vn/success", "https://toan6789.vn/cancel")
	if err != nil {
		t.Fatalf("Expected mock mode to succeed without error, got %v", err)
	}

	if data == nil {
		t.Fatalf("Expected payment data, got nil")
	}

	if data.OrderCode != 123456 || data.Amount != 200000 {
		t.Errorf("Unexpected data in mock mode: %+v", data)
	}
	if data.QRCode == "" {
		t.Errorf("Expected QRCode string in mock mode")
	}
}
