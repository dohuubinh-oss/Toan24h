package services

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"sort"
	"strconv"
	"strings"
	"time"
)

type PayOSService struct {
	ClientID    string
	APIKey      string
	ChecksumKey string
	BaseURL     string
	HTTPClient  *http.Client
}

func NewPayOSService(clientID, apiKey, checksumKey string) *PayOSService {
	return &PayOSService{
		ClientID:    clientID,
		APIKey:      apiKey,
		ChecksumKey: checksumKey,
		BaseURL:     "https://api-merchant.payos.vn",
		HTTPClient:  &http.Client{Timeout: 10 * time.Second},
	}
}

type PayOSPaymentData struct {
	Bin           string `json:"bin"`
	AccountNumber string `json:"accountNumber"`
	AccountName   string `json:"accountName"`
	Amount        int    `json:"amount"`
	Description   string `json:"description"`
	OrderCode     int64  `json:"orderCode"`
	Currency      string `json:"currency"`
	PaymentLinkID string `json:"paymentLinkId"`
	Status        string `json:"status"`
	CheckoutURL   string `json:"checkoutUrl"`
	QRCode        string `json:"qrCode"`
}

type PayOSResponse struct {
	Code      string            `json:"code"`
	Desc      string            `json:"desc"`
	Data      *PayOSPaymentData `json:"data"`
	Signature string            `json:"signature"`
}

type PayOSWebhookData struct {
	OrderCode           int64  `json:"orderCode"`
	Amount              int    `json:"amount"`
	Description         string `json:"description"`
	AccountNumber       string `json:"accountNumber"`
	Reference           string `json:"reference"`
	TransactionDateTime string `json:"transactionDateTime"`
	Currency            string `json:"currency"`
	PaymentLinkID       string `json:"paymentLinkId"`
	Code                string `json:"code"`
	Desc                string `json:"desc"`
}

type PayOSWebhookBody struct {
	Code      string           `json:"code"`
	Desc      string           `json:"desc"`
	Data      PayOSWebhookData `json:"data"`
	Signature string           `json:"signature"`
}

// GenerateCreatePaymentSignature creates HMAC-SHA256 signature for create payment request
func (s *PayOSService) GenerateCreatePaymentSignature(orderCode int64, amount int, description, returnUrl, cancelUrl string) string {
	dataStr := fmt.Sprintf("amount=%d&cancelUrl=%s&description=%s&orderCode=%d&returnUrl=%s",
		amount, cancelUrl, description, orderCode, returnUrl)
	h := hmac.New(sha256.New, []byte(s.ChecksumKey))
	h.Write([]byte(dataStr))
	return hex.EncodeToString(h.Sum(nil))
}

// GenerateWebhookDataSignature creates HMAC-SHA256 signature for webhook verification
func (s *PayOSService) GenerateWebhookDataSignature(data PayOSWebhookData) string {
	params := map[string]string{
		"orderCode":           strconv.FormatInt(data.OrderCode, 10),
		"amount":              strconv.Itoa(data.Amount),
		"description":         data.Description,
		"accountNumber":       data.AccountNumber,
		"reference":           data.Reference,
		"transactionDateTime": data.TransactionDateTime,
		"currency":            data.Currency,
		"paymentLinkId":       data.PaymentLinkID,
		"code":                data.Code,
		"desc":                data.Desc,
	}

	keys := make([]string, 0, len(params))
	for k := range params {
		keys = append(keys, k)
	}
	sort.Strings(keys)

	var pairs []string
	for _, k := range keys {
		pairs = append(pairs, fmt.Sprintf("%s=%s", k, params[k]))
	}
	sortedDataStr := strings.Join(pairs, "&")

	h := hmac.New(sha256.New, []byte(s.ChecksumKey))
	h.Write([]byte(sortedDataStr))
	return hex.EncodeToString(h.Sum(nil))
}

func (s *PayOSService) VerifyWebhookSignature(data PayOSWebhookData, signature string) bool {
	if s.ChecksumKey == "" {
		// Mock mode or empty checksum key
		return true
	}
	expectedSignature := s.GenerateWebhookDataSignature(data)
	return hmac.Equal([]byte(expectedSignature), []byte(signature))
}

// CreatePaymentLink calls PayOS API or returns mock data in local dev
func (s *PayOSService) CreatePaymentLink(orderCode int64, amount int, description, returnUrl, cancelUrl string) (*PayOSPaymentData, error) {
	// Fallback/Mock mode for local dev without credentials
	if s.ClientID == "" || s.APIKey == "" || s.ChecksumKey == "" {
		accountNo := "1234567890"
		accountName := "TOAN24H EDUCATION"
		vietQr := fmt.Sprintf("https://img.vietqr.io/image/MB-%s-compact2.png?amount=%d&addInfo=%s&accountName=%s",
			accountNo, amount, description, accountName)

		return &PayOSPaymentData{
			Bin:           "970422",
			AccountNumber: accountNo,
			AccountName:   accountName,
			Amount:        amount,
			Description:   description,
			OrderCode:     orderCode,
			Currency:      "VND",
			PaymentLinkID: fmt.Sprintf("mock_link_%d", orderCode),
			Status:        "PENDING",
			CheckoutURL:   fmt.Sprintf("https://pay.payos.vn/web/mock_%d", orderCode),
			QRCode:        vietQr,
		}, nil
	}

	sig := s.GenerateCreatePaymentSignature(orderCode, amount, description, returnUrl, cancelUrl)

	payload := map[string]interface{}{
		"orderCode":   orderCode,
		"amount":      amount,
		"description": description,
		"cancelUrl":   cancelUrl,
		"returnUrl":   returnUrl,
		"signature":   sig,
	}

	bodyBytes, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal payload: %w", err)
	}

	req, err := http.NewRequest("POST", s.BaseURL+"/v2/payment-requests", bytes.NewBuffer(bodyBytes))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-client-id", s.ClientID)
	req.Header.Set("x-api-key", s.APIKey)

	resp, err := s.HTTPClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to call PayOS API: %w", err)
	}
	defer resp.Body.Close()

	var payosResp PayOSResponse
	if err := json.NewDecoder(resp.Body).Decode(&payosResp); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	if payosResp.Code != "00" {
		return nil, fmt.Errorf("PayOS error: %s (%s)", payosResp.Desc, payosResp.Code)
	}

	return payosResp.Data, nil
}
