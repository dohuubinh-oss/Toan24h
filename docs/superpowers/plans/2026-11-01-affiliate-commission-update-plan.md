# Multi-tier Affiliate & Commission System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Triển khai cơ chế phân bổ hoa hồng đa tầng (Multi-tier Commission): Giảm hoa hồng trực tiếp của Teacher xuống 50% và Admin xuống 60% (Affiliate giữ nguyên 30%), đồng thời bổ sung chính sách hoa hồng gián tiếp 3% cho Giáo viên quản lý khối lớp và 1% cho Quản trị viên sàn trên mọi giao dịch thanh toán PayOS của học sinh mà không do họ trực tiếp giới thiệu.

**Architecture:** 
1. Mở rộng model `CommissionTransaction` với `CommissionType`, `Note`, và composite unique index `(order_code, referrer_id, commission_type)`.
2. Bổ sung helper nghiệp vụ trong `referral_service.go` (`NormalizeGrade`, `GetTeacherForGrade`, `GetSystemAdmin`) với chuẩn hoá chuỗi khối lớp và tra cứu an toàn (`status = 'active'`).
3. Tái cấu trúc hàm xử lý webhook PayOS (`webhook_handler.go`) từ đơn tầng sang đa tầng atomic (`processMultiTierCommissions`), sửa điểm nghẽn webhook cũ để học sinh tự do vẫn kích hoạt chia hoa hồng khối (3%) và sàn (1%).
4. Cập nhật giao diện `profile/page.tsx` hiển thị tỷ lệ trực tiếp + gián tiếp rõ ràng theo từng vai trò (Teacher, Admin, Affiliate) và đồng bộ test suite frontend/backend.

**Tech Stack:** Go 1.27, GORM, PostgreSQL, Next.js 16 (App Router), TypeScript, Tailwind CSS, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-01-affiliate-commission-update-design.md`

## Global Constraints

- Không tự ý deploy lên VPS (tuân thủ tuyệt đối quy định của repo).
- Ranh giới repo: Toàn bộ code chỉ nằm trong `/Users/modeptrai/Desktop/toan6789.vn`.
- Kích hoạt VIP của học sinh luôn là ưu tiên số 1: Trục trặc tính hoa hồng không bao giờ làm gián đoạn kích hoạt VIP (fail-safe defer/recover).
- Không cộng dồn chồng chéo: Giáo viên nhận 50% trực tiếp thì không nhận 3% khối; Admin nhận 60% trực tiếp thì không nhận 1% sàn.
- Idempotency: Webhook PayOS gọi lại không tạo duplicate giao dịch hoa hồng và không cộng lặp số dư.

## Review Focus

1. **Học sinh tự do nạp tiền (không có mã giới thiệu)**: Vẫn phải trích 3% cho Teacher khối và 1% cho Admin, không bị chặn bởi `student.ReferrerID != nil`.
2. **Khối lớp không có Teacher hoặc Teacher bị khóa**: Hệ thống ghi log nhẹ, bỏ qua trích 3%, vẫn tiếp tục trích 1% cho Admin mà không bị panic hay rollback.
3. **Chuỗi khối lớp không đồng nhất**: Nhận diện chính xác `"7"`, `"Lớp 7"`, `"lop 7"`, `"Khối 7"`.
4. **Trùng lặp Webhook PayOS (Concurrent/Retry)**: Chống duplicate qua cả lớp DB Transaction và composite unique index `(order_code, referrer_id, commission_type)`.
5. **Hiển thị thông tin minh bạch trên giao diện**: Người dùng vai trò Teacher, Admin, Affiliate thấy đúng tỷ lệ hoa hồng trực tiếp và gián tiếp của mình.

---

### Task 1: Cập nhật Model `CommissionTransaction`

**Files:**
- Modify: `backend/internal/models/commission_transaction.go:10-27`

**Interfaces:**
- Produces:
  - `models.CommissionTransaction.CommissionType string` (`"direct"`, `"grade_management"`, `"platform_override"`)
  - `models.CommissionTransaction.Note string`
  - Tag: `gorm:"not null;uniqueIndex:idx_comm_order_referrer_type"`

- [x] **Step 1: Cập nhật struct `CommissionTransaction` trong `backend/internal/models/commission_transaction.go`**

```go
package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type CommissionTransaction struct {
	ID               uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	OrderCode        int64     `gorm:"not null;uniqueIndex:idx_comm_order_referrer_type" json:"orderCode"`
	ReferrerID       uuid.UUID `gorm:"type:uuid;not null;uniqueIndex:idx_comm_order_referrer_type" json:"referrerId"`
	StudentID        uuid.UUID `gorm:"type:uuid;index;not null" json:"studentId"`
	StudentAmount    int       `gorm:"not null" json:"studentAmount"`
	CommissionRate   float32   `gorm:"not null" json:"commissionRate"`
	CommissionAmount int       `gorm:"not null" json:"commissionAmount"`
	CommissionType   string    `gorm:"type:varchar(50);not null;default:'direct';uniqueIndex:idx_comm_order_referrer_type" json:"commissionType"`
	Note             string    `gorm:"type:varchar(255)" json:"note"`
	Status           string    `gorm:"type:varchar(20);not null;default:'pending'" json:"status"`
	CreatedAt        time.Time `json:"createdAt"`
}

func (c *CommissionTransaction) BeforeCreate(tx *gorm.DB) (err error) {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	if c.CommissionType == "" {
		c.CommissionType = "direct"
	}
	return
}
```

- [x] **Step 2: Kiểm tra biên dịch backend**

Run: `cd backend && go vet ./internal/models/...`
Expected: PASS (không có lỗi cú pháp).

- [x] **Step 3: Commit Task 1**

```bash
git add backend/internal/models/commission_transaction.go
git commit -m "feat(models): add commission type, note and composite unique index to CommissionTransaction"
```

---

### Task 2: Cập nhật Tỷ lệ Hoa hồng & Viết Helper Nghiệp vụ trong `referral_service.go`

**Files:**
- Modify: `backend/internal/services/referral_service.go:20-60`
- Modify: `backend/internal/services/referral_service_test.go:46-80`

**Interfaces:**
- Produces:
  - `CommissionRateTeacher = 50.0`
  - `CommissionRateAdmin = 60.0`
  - `CommissionRateAffiliate = 30.0`
  - `CommissionRateGrade = 3.0`
  - `CommissionRatePlatform = 1.0`
  - `NormalizeGrade(grade string) string`
  - `GetTeacherForGrade(db *gorm.DB, grade string) (*models.User, error)`
  - `GetSystemAdmin(db *gorm.DB) (*models.User, error)`

- [x] **Step 1: Viết test case mới trong `backend/internal/services/referral_service_test.go`**

Cập nhật test tỷ lệ và thêm test cho `NormalizeGrade`:
```go
func TestReferralCommissionRatesByRole(t *testing.T) {
	testCases := []struct {
		role         string
		expectedRate float32
	}{
		{"teacher", 50.0},
		{"Teacher", 50.0},
		{"TEACHER", 50.0},
		{"admin", 60.0},
		{"Admin", 60.0},
		{"affiliate", 30.0},
		{"Affiliate", 30.0},
		{"student", 30.0},
		{"", 30.0},
		{"unknown_role", 30.0},
	}

	for _, tc := range testCases {
		t.Run(fmt.Sprintf("Role_%s", tc.role), func(t *testing.T) {
			rate := services.GetCommissionRateByRole(tc.role)
			assert.Equal(t, tc.expectedRate, rate)
		})
	}
}

func TestNormalizeGrade(t *testing.T) {
	testCases := []struct {
		input    string
		expected string
	}{
		{"6", "6"},
		{"7", "7"},
		{"8", "8"},
		{"9", "9"},
		{"Lớp 6", "6"},
		{"Lớp 7", "7"},
		{"lop 8", "8"},
		{"Khối 9", "9"},
		{"  7  ", "7"},
		{"chuyen", ""},
		{"tot_nghiep", ""},
		{"", ""},
	}

	for _, tc := range testCases {
		t.Run(fmt.Sprintf("Grade_%s", tc.input), func(t *testing.T) {
			assert.Equal(t, tc.expected, services.NormalizeGrade(tc.input))
		})
	}
}
```

- [x] **Step 2: Chạy test để xác nhận FAIL (do hằng số cũ 60%/70% và hàm NormalizeGrade chưa có)**

Run: `cd backend && go test -v ./internal/services -run "TestReferralCommissionRatesByRole|TestNormalizeGrade"`
Expected: FAIL.

- [x] **Step 3: Triển khai code trong `backend/internal/services/referral_service.go`**

1. Cập nhật các hằng số:
```go
const (
	CommissionRateTeacher   float32 = 50.0 // Điều chỉnh từ 60%
	CommissionRateAdmin     float32 = 60.0 // Điều chỉnh từ 70%
	CommissionRateAffiliate float32 = 30.0 // Giữ nguyên
	CommissionRateGrade     float32 = 3.0  // Hoa hồng quản lý khối lớp
	CommissionRatePlatform  float32 = 1.0  // Hoa hồng quản trị nền tảng sàn
)
```
2. Thêm hàm `NormalizeGrade`:
```go
// NormalizeGrade cleans and extracts standard grade numbers ("6", "7", "8", "9").
// Returns empty string if not a recognized secondary school grade.
func NormalizeGrade(grade string) string {
	cleaned := strings.ToLower(strings.TrimSpace(grade))
	cleaned = strings.TrimPrefix(cleaned, "lớp")
	cleaned = strings.TrimPrefix(cleaned, "lop")
	cleaned = strings.TrimPrefix(cleaned, "khối")
	cleaned = strings.TrimPrefix(cleaned, "khoi")
	cleaned = strings.TrimSpace(cleaned)

	switch cleaned {
	case "6", "7", "8", "9":
		return cleaned
	default:
		return ""
	}
}
```
3. Thêm hàm tra cứu `GetTeacherForGrade` và `GetSystemAdmin`:
```go
// GetTeacherForGrade finds the single active teacher in charge of a given grade.
// Returns (nil, nil) if no active teacher is found.
func GetTeacherForGrade(db *gorm.DB, grade string) (*models.User, error) {
	if db == nil {
		return nil, nil
	}
	normGrade := NormalizeGrade(grade)
	if normGrade == "" {
		return nil, nil
	}

	var teacher models.User
	err := db.Where("role = ? AND status = ? AND (grade = ? OR grade = ?)",
		"teacher", "active", normGrade, "Lớp "+normGrade).
		Order("created_at asc").
		First(&teacher).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &teacher, nil
}

// GetSystemAdmin finds the single active system administrator.
// Returns (nil, nil) if no active admin is found.
func GetSystemAdmin(db *gorm.DB) (*models.User, error) {
	if db == nil {
		return nil, nil
	}
	var admin models.User
	err := db.Where("role = ? AND status = ?", "admin", "active").
		Order("created_at asc").
		First(&admin).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &admin, nil
}
```

- [x] **Step 4: Chạy test xác nhận PASS**

Run: `cd backend && go test -v ./internal/services -run "TestReferralCommissionRatesByRole|TestNormalizeGrade"`
Expected: PASS.

- [x] **Step 5: Commit Task 2**

```bash
git add backend/internal/services/referral_service.go backend/internal/services/referral_service_test.go
git commit -m "feat(services): update commission rates and add NormalizeGrade, GetTeacherForGrade and GetSystemAdmin helpers"
```

---

### Task 3: Đồng bộ Tỷ lệ Voucher & Test Suite Liên quan

**Files:**
- Modify: `backend/internal/handlers/voucher_handler.go:85-95`
- Modify: `backend/internal/handlers/user_handler_test.go:260-265`

**Interfaces:**
- Consumes: `services.GetCommissionRateByRole`

- [x] **Step 1: Cập nhật `voucher_handler.go` để lấy tỷ lệ động từ `services.GetCommissionRateByRole`**

Thay thế hardcode tại dòng 89:
```go
commissionPercent := services.GetCommissionRateByRole(targetRole)
```

- [x] **Step 2: Cập nhật assertion trong `user_handler_test.go`**

Đổi giá trị mong đợi từ 60% sang 50% tại dòng 262 (khi tạo voucher cho teacher).

- [x] **Step 3: Chạy go vet và unit tests kiểm tra**

Run: `cd backend && go vet ./internal/handlers/...`
Expected: PASS.

- [x] **Step 4: Commit Task 3**

```bash
git add backend/internal/handlers/voucher_handler.go backend/internal/handlers/user_handler_test.go
git commit -m "refactor(handlers): use dynamic commission rates for vouchers and update user handler tests"
```

---

### Task 4: Triển khai Động cơ Phân bổ Hoa hồng Đa tầng (`processMultiTierCommissions`)

**Files:**
- Modify: `backend/internal/handlers/webhook_handler.go:155-285`
- Create / Modify: `backend/internal/handlers/webhook_handler_test.go`

**Interfaces:**
- Consumes:
  - `models.Transaction`
  - `models.User`
  - `services.GetCommissionRateByRole`
  - `services.CommissionRateGrade` (3.0%)
  - `services.CommissionRatePlatform` (1.0%)
  - `services.GetTeacherForGrade`
  - `services.GetSystemAdmin`
- Produces:
  - `processMultiTierCommissions(tx models.Transaction, student models.User)`

- [x] **Step 1: Viết test case đa tầng trong `backend/internal/handlers/webhook_handler_test.go`**

Tạo bộ test độc lập (sử dụng in-memory sqlite hoặc mock DB) bao phủ 5 kịch bản phân bổ dòng tiền:
1. Học sinh tự đăng ký (không mã GT): Nhận 0% direct, Teacher nhận 3%, Admin nhận 1%.
2. Giáo viên Lớp 7 trực tiếp giới thiệu: Teacher nhận 50% direct, 0% khối (bỏ qua vì trùng), Admin nhận 1%.
3. Giáo viên Lớp 8 trực tiếp giới thiệu cho học sinh Lớp 7: Teacher Lớp 8 nhận 50% direct, Teacher Lớp 7 nhận 3% khối, Admin nhận 1%.
4. Admin trực tiếp giới thiệu: Admin nhận 60% direct, Teacher Lớp 7 nhận 3% khối, 0% sàn (bỏ qua vì trùng).
5. Affiliate giới thiệu: Affiliate nhận 30% direct, Teacher Lớp 7 nhận 3% khối, Admin nhận 1%.
6. Kiểm tra Idempotency: Gọi lần thứ 2 với cùng `orderCode` không sinh thêm giao dịch và không cộng dồn thêm số dư.

- [x] **Step 2: Sửa guard check tại `backend/internal/handlers/webhook_handler.go:159`**

Thay vì kiểm tra `student.ReferrerID != nil`, sửa thành:
```go
if !alreadyCompleted {
	h.processMultiTierCommissions(processedTx, updatedUser)
}
```

- [x] **Step 3: Thay thế `processCommission` bằng `processMultiTierCommissions` trong `webhook_handler.go`**

```go
// processMultiTierCommissions safely calculates and allocates multi-tier commissions
// (Direct referral, Grade management 3%, and Platform override 1%) inside an atomic DB transaction.
func (h *WebhookHandler) processMultiTierCommissions(tx models.Transaction, student models.User) {
	defer func() {
		if r := recover(); r != nil {
			log.Printf("[Webhook PayOS] Panic recovered during multi-tier commission processing for orderCode %d: %v", tx.OrderCode, r)
		}
	}()

	if h.DB == nil {
		return
	}

	// 1. Pre-check idempotency outside transaction
	var existingCount int64
	if err := h.DB.Model(&models.CommissionTransaction{}).Where("order_code = ?", tx.OrderCode).Count(&existingCount).Error; err != nil {
		log.Printf("[Webhook PayOS] Error checking existing commission for orderCode %d: %v", tx.OrderCode, err)
		return
	}
	if existingCount > 0 {
		return
	}

	// 2. Perform all allocations within a single database transaction
	err := h.DB.Transaction(func(commDB *gorm.DB) error {
		// Double check idempotency inside transaction
		var countInside int64
		if err := commDB.Model(&models.CommissionTransaction{}).Where("order_code = ?", tx.OrderCode).Count(&countInside).Error; err != nil {
			return err
		}
		if countInside > 0 {
			return nil
		}

		var directReferrerID *uuid.UUID

		// --- TIER 1: Direct Referral Commission (Teacher 50%, Admin 60%, Affiliate 30%) ---
		if student.ReferrerID != nil && *student.ReferrerID != uuid.Nil {
			var referrer models.User
			if err := commDB.First(&referrer, "id = ?", *student.ReferrerID).Error; err == nil {
				if referrer.Status == "active" {
					role := strings.ToLower(strings.TrimSpace(referrer.Role))
					if role == "admin" || role == "teacher" || role == "affiliate" {
						rate := services.GetCommissionRateByRole(role)
						amount := int(float64(tx.Amount) * float64(rate) / 100.0)

						if amount > 0 {
							if err := commDB.Model(&models.User{}).Where("id = ?", referrer.ID).
								Update("commission_balance", gorm.Expr("commission_balance + ?", amount)).Error; err != nil {
								return err
							}

							commTx := models.CommissionTransaction{
								OrderCode:        tx.OrderCode,
								ReferrerID:       referrer.ID,
								StudentID:        student.ID,
								StudentAmount:    tx.Amount,
								CommissionRate:   rate,
								CommissionAmount: amount,
								CommissionType:   "direct",
								Note:             "Hoa hồng giới thiệu trực tiếp",
								Status:           "pending",
							}
							if err := commDB.Create(&commTx).Error; err != nil {
								return err
							}
							directReferrerID = &referrer.ID
						}
					}
				}
			}
		}

		// --- TIER 2: Grade Management Commission (Teacher 3%) ---
		normGrade := services.NormalizeGrade(student.Grade)
		if normGrade != "" {
			teacher, err := services.GetTeacherForGrade(commDB, normGrade)
			if err == nil && teacher != nil {
				// Anti-goal: Skip if teacher was already the direct referrer
				if directReferrerID == nil || *directReferrerID != teacher.ID {
					rate := services.CommissionRateGrade // 3.0%
					amount := int(float64(tx.Amount) * float64(rate) / 100.0)

					if amount > 0 {
						if err := commDB.Model(&models.User{}).Where("id = ?", teacher.ID).
							Update("commission_balance", gorm.Expr("commission_balance + ?", amount)).Error; err != nil {
							return err
						}

						commTx := models.CommissionTransaction{
							OrderCode:        tx.OrderCode,
							ReferrerID:       teacher.ID,
							StudentID:        student.ID,
							StudentAmount:    tx.Amount,
							CommissionRate:   rate,
							CommissionAmount: amount,
							CommissionType:   "grade_management",
							Note:             fmt.Sprintf("Hoa hồng quản lý Khối %s", normGrade),
							Status:           "pending",
						}
						if err := commDB.Create(&commTx).Error; err != nil {
							return err
						}
					}
				}
			}
		}

		// --- TIER 3: Platform Management Commission (Admin 1%) ---
		admin, err := services.GetSystemAdmin(commDB)
		if err == nil && admin != nil {
			// Anti-goal: Skip if admin was already the direct referrer
			if directReferrerID == nil || *directReferrerID != admin.ID {
				rate := services.CommissionRatePlatform // 1.0%
				amount := int(float64(tx.Amount) * float64(rate) / 100.0)

				if amount > 0 {
					if err := commDB.Model(&models.User{}).Where("id = ?", admin.ID).
						Update("commission_balance", gorm.Expr("commission_balance + ?", amount)).Error; err != nil {
						return err
					}

					commTx := models.CommissionTransaction{
						OrderCode:        tx.OrderCode,
						ReferrerID:       admin.ID,
						StudentID:        student.ID,
						StudentAmount:    tx.Amount,
						CommissionRate:   rate,
						CommissionAmount: amount,
						CommissionType:   "platform_override",
						Note:             "Hoa hồng quản trị sàn",
						Status:           "pending",
					}
					if err := commDB.Create(&commTx).Error; err != nil {
						return err
					}
				}
			}
		}

		return nil
	})

	if err != nil {
		log.Printf("[Webhook PayOS] Failed to complete multi-tier commission processing for orderCode %d: %v", tx.OrderCode, err)
	}
}
```

- [x] **Step 4: Chạy test webhook xác nhận PASS toàn bộ**

Run: `cd backend && go test -v ./internal/handlers -run TestProcessMultiTierCommissions`
Expected: PASS.

- [x] **Step 5: Commit Task 4**

```bash
git add backend/internal/handlers/webhook_handler.go backend/internal/handlers/webhook_handler_test.go
git commit -m "feat(webhook): implement atomic multi-tier commission processing (direct, grade 3%, platform 1%)"
```

---

### Task 5: Cập nhật Hiển thị Giao diện `profile/page.tsx` & Test Frontend

**Files:**
- Modify: `frontend/src/app/(main)/profile/page.tsx:520-565`
- Modify: `frontend/src/app/(main)/profile/page.test.tsx:170-215`

**Interfaces:**
- Produces:
  - Hiển thị cấu trúc tỷ lệ hoa hồng mới trên Partner Card:
    - Teacher: 50% trực tiếp, 3% quản lý khối
    - Admin: 60% trực tiếp, 1% quản trị sàn
    - Affiliate: 30% trực tiếp
  - Badges và ghi chú trực quan, thân thiện.

- [x] **Step 1: Cập nhật `profile/page.tsx` để hiển thị tỷ lệ hoa hồng theo role**

Trong Card "Mã Giới Thiệu & Hoa Hồng Đối Tác":
```tsx
{/* Commission Policy Badges */}
<div className="flex flex-wrap items-center gap-2 mt-2">
  {user.role === 'admin' && (
    <>
      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
        Hoa hồng trực tiếp: 60%
      </span>
      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
        Quản trị toàn sàn: 1%
      </span>
    </>
  )}
  {user.role === 'teacher' && (
    <>
      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
        Hoa hồng trực tiếp: 50%
      </span>
      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
        Quản lý {user.grade ? `Khối ${user.grade}` : 'khối lớp'}: 3%
      </span>
    </>
  )}
  {user.role === 'affiliate' && (
    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
      Hoa hồng trực tiếp: 30%
    </span>
  )}
</div>
```

- [x] **Step 2: Cập nhật `profile/page.test.tsx`**

Cập nhật test case:
- Admin mong đợi `/60%/` và `/1%/`.
- Teacher mong đợi `/50%/` và `/3%/`.
- Affiliate mong đợi `/30%/`.

- [x] **Step 3: Chạy test Vitest và kiểm tra TypeScript**

Run: 
1. `cd frontend && /usr/local/bin/node ./node_modules/vitest/vitest.mjs run src/app/\(main\)/profile/page.test.tsx`
2. `cd frontend && /usr/local/bin/node ./node_modules/typescript/bin/tsc --noEmit`
Expected: PASS 100%, 0 TypeScript errors.

- [x] **Step 4: Commit Task 5**

```bash
git add frontend/src/app/\(main\)/profile/page.tsx frontend/src/app/\(main\)/profile/page.test.tsx
git commit -m "feat(profile): display multi-tier commission rates by partner role and update frontend tests"
```

---

### Task 6: Kiểm tra Tổng thể (Verification Loop)

**Files:**
- Toàn bộ files đã chỉnh sửa.

- [x] **Step 1: Chạy toàn bộ backend unit tests**

Run: `cd backend && go test ./internal/services/...`
Expected: PASS.

- [x] **Step 2: Chạy toàn bộ frontend unit tests liên quan**

Run: `cd frontend && /usr/local/bin/node ./node_modules/vitest/vitest.mjs run src/app/\(main\)/profile/page.test.tsx src/components/questions/creator/QuestionSettingsSidebar.test.tsx src/components/lecture/creator/LectureBasicSettings.test.tsx`
Expected: PASS.

- [x] **Step 3: Kiểm tra trạng thái Git**

Run: `git status`
Expected: Working tree clean, mọi commit đều theo Conventional Commits.
