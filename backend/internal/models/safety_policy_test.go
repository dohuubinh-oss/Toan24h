package models_test

import (
	"reflect"
	"strings"
	"testing"

	"github.com/modeptrai/exam-model-backend/internal/models"
)

// TestDatabaseSafetyRules ensures the database schema strictly adheres to educational compliance:
// 1. NO tables or models for cash withdrawal, payouts, or points-to-cash conversions.
// 2. NO user wallet balance or monetary payout account fields.
func TestDatabaseSafetyRules(t *testing.T) {
	// Forbidden terms in any model fields
	forbiddenFieldSubstrings := []string{
		"withdraw",
		"payout",
		"cashout",
		"cash_out",
		"wallet_balance",
		"cash_balance",
		"bank_account_payout",
		"redeem_cash",
	}

	registeredModels := []interface{}{
		models.User{},
		models.Transaction{},
		models.XPTransaction{},
		models.Voucher{},
		models.VoucherUsage{},
		models.Exam{},
		models.Question{},
		models.Lecture{},
		models.Submission{},
		models.Notification{},
		models.LectureBookmark{},
	}

	for _, m := range registeredModels {
		tModel := reflect.TypeOf(m)
		modelName := tModel.Name()

		// Verify model name itself
		for _, forbidden := range forbiddenFieldSubstrings {
			if strings.Contains(strings.ToLower(modelName), forbidden) {
				t.Fatalf("VIOLATION: Model %s contains forbidden concept '%s'", modelName, forbidden)
			}
		}

		// Verify all struct fields
		for i := 0; i < tModel.NumField(); i++ {
			field := tModel.Field(i)
			fieldName := strings.ToLower(field.Name)
			tag := strings.ToLower(field.Tag.Get("gorm")) + " " + strings.ToLower(field.Tag.Get("json"))

			for _, forbidden := range forbiddenFieldSubstrings {
				if strings.Contains(fieldName, forbidden) || strings.Contains(tag, forbidden) {
					t.Fatalf("VIOLATION: Field %s.%s contains forbidden cash-out/withdrawal concept '%s'", modelName, field.Name, forbidden)
				}
			}
		}
	}
}
