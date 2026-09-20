# PayOS Integration & User Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tích hợp cổng thanh toán PayOS (VietQR chuẩn Open Banking) thay thế SePay, hỗ trợ tạo mã QR động, webhook gia hạn tự động, kiểm tra xác thực người dùng trên `/upgrade` & Home, đồng thời làm sạch giao diện quản lý người dùng `/dashboard/users` (xóa nút nạp tiền và đổi cột sang Ngày hết hạn).

**Architecture:** 
- Backend (Go Gin + GORM): Mở rộng `models.Transaction` thêm `OrderCode int64`, `PaymentLinkID`, `CheckoutURL`, `QRCode`. Viết `PayOSService` để ký HMAC-SHA256 và tạo link thanh toán, xử lý Webhook xác thực bảo mật.
- Frontend (Next.js 14 App Router + Tailwind): Tạo `PayOSPaymentModal.tsx` dùng chung, kiểm tra auth trước khi thanh toán, và cập nhật `UserTable.tsx` / `page.tsx` cho `/dashboard/users`.

**Tech Stack:** Go (Gin, GORM, crypto/hmac, crypto/sha256), Next.js (React 18, TailwindCSS, Lucide-react, Vitest).

## Global Constraints
- Tuân thủ thiết luật Superpowers & ECC: Viết test trước (TDD), không mock bừa bãi, không code đoán mò.
- Môi trường Localhost: Phải có cơ chế hoạt động mượt mà (Mock/Fallback VietQR) khi chưa nạp API key của PayOS.
- An toàn Webhook: Dùng Database Transaction (`FOR UPDATE`) để ngăn ngừa cộng dồn thời hạn trùng lặp.

---

### Task 1: Update `Transaction` Model & Database Migration

**Files:**
- Modify: `backend/internal/models/transaction.go`
- Modify: `backend/internal/models/transaction_test.go`

**Interfaces:**
- Produces: `models.Transaction` với các trường `OrderCode int64`, `PaymentLinkID string`, `CheckoutURL string`, `QRCode string`.

- [ ] **Step 1: Write the failing test for Transaction model with OrderCode**

Cập nhật `backend/internal/models/transaction_test.go` để kiểm tra lưu trữ và truy vấn `OrderCode`, `PaymentLinkID`, `CheckoutURL`, `QRCode`.

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && go test ./internal/models -v -run TestTransactionModel`
Expected: FAIL (các trường mới chưa có trong struct).

- [ ] **Step 3: Update `Transaction` struct**

Trong `backend/internal/models/transaction.go`:
```go
type Transaction struct {
	ID            uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	UserID        uuid.UUID `gorm:"type:uuid;not null" json:"userId"`
	OrderCode     int64     `gorm:"uniqueIndex" json:"orderCode"`
	Amount        int       `gorm:"not null" json:"amount"`
	Plan          string    `gorm:"type:varchar(50);not null" json:"plan"`
	Status        string    `gorm:"type:varchar(50);not null;default:'pending'" json:"status"`
	PaymentLinkID string    `gorm:"type:varchar(255)" json:"paymentLinkId,omitempty"`
	CheckoutURL   string    `gorm:"type:text" json:"checkoutUrl,omitempty"`
	QRCode        string    `gorm:"type:text" json:"qrCode,omitempty"`
	CreatedAt     time.Time `json:"createdAt"`
	UpdatedAt     time.Time `json:"updatedAt"`
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && go test ./internal/models -v -run TestTransactionModel`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/internal/models/
git commit -m "feat(backend): add OrderCode and PayOS fields to Transaction model"
```

---

### Task 2: Implement `PayOSService` for Payment Link & Webhook Verification

**Files:**
- Create: `backend/internal/services/payos_service.go`
- Create: `backend/internal/services/payos_service_test.go`

**Interfaces:**
- Produces: 
  - `NewPayOSService(clientID, apiKey, checksumKey string) *PayOSService`
  - `CreatePaymentLink(orderCode int64, amount int, description string, returnUrl, cancelUrl string) (*PayOSPaymentData, error)`
  - `VerifyWebhookSignature(webhookData PayOSWebhookBody) (bool, *PayOSWebhookData)`

- [ ] **Step 1: Write the failing tests for PayOSService**

Tạo `backend/internal/services/payos_service_test.go` kiểm tra:
1. Tạo signature HMAC-SHA256 đúng chuẩn PayOS alphabet key order.
2. Kiểm tra xác thực chữ ký Webhook PayOS (hợp lệ và không hợp lệ).
3. Fallback khi không có API key.

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && go test ./internal/services -v -run TestPayOSService`
Expected: FAIL (package/service chưa tồn tại).

- [ ] **Step 3: Implement `PayOSService`**

Tạo `backend/internal/services/payos_service.go` với logic HMAC-SHA256, gửi request `POST https://api-merchant.payos.vn/v2/payment-requests`, và logic xác thực chữ ký webhook.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && go test ./internal/services -v -run TestPayOSService`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/internal/services/
git commit -m "feat(backend): implement PayOS service with HMAC-SHA256 verification"
```

---

### Task 3: Update Backend Handlers & Routes (`PaymentHandler`, `WebhookHandler`)

**Files:**
- Modify: `backend/internal/handlers/payment_handler.go`
- Modify: `backend/internal/handlers/webhook_handler.go`
- Modify: `backend/internal/routes/routes.go`
- Test: `backend/internal/handlers/webhook_handler_test.go`

**Interfaces:**
- Consumes: `PayOSService`, `models.Transaction`, `models.User`
- Produces:
  - `POST /api/payments/create`: Trả về `orderCode`, `amount`, `qrCode`, `checkoutUrl`, `accountNumber`, `accountName`, `content`
  - `POST /api/webhook/payos`: Nhận và xác thực Webhook từ PayOS, tự động gia hạn `User.ExpiresAt` và cập nhật `Transaction`

- [ ] **Step 1: Write the failing tests for Webhook & Payment handlers**

Cập nhật `backend/internal/handlers/webhook_handler_test.go` với test case giả lập Webhook của PayOS gửi payload hợp lệ $\rightarrow$ kiểm tra `User.ExpiresAt` được cộng 1/3/9/12 tháng tương ứng.

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && go test ./internal/handlers -v -run TestPayOSWebhook`
Expected: FAIL.

- [ ] **Step 3: Implement PayOS Handlers & Register Routes**

1. Cập nhật `PaymentHandler.CreatePayment` để sinh `OrderCode` số nguyên và gọi `PayOSService.CreatePaymentLink`.
2. Cập nhật `WebhookHandler.HandlePayOSWebhook` để verify chữ ký và cập nhật `ExpiresAt` trong database transaction.
3. Đăng ký route `r.POST("/api/webhook/payos", webhookHandler.HandlePayOSWebhook)` và route cũ `/webhook/sepay` (nếu cần tương thích ngược).

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && go test ./internal/handlers -v`
Expected: All handler tests PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/internal/handlers/ backend/internal/routes/
git commit -m "feat(backend): integrate PayOS payment creation and webhook handling"
```

---

### Task 4: Refactor User Management Table (`/dashboard/users`)

**Files:**
- Modify: `frontend/src/components/users/UserTable.tsx`
- Modify: `frontend/src/app/(main)/dashboard/users/page.tsx`
- Modify: `frontend/src/app/(main)/dashboard/users/page.test.tsx`

**Interfaces:**
- Consumes: `User` type with `expiresAt`
- Produces: `UserTable` không có nút nạp tiền, cột header là "Ngày hết hạn" hiển thị ngày hết hạn của user rõ ràng.

- [ ] **Step 1: Write/Update unit test for UserTable and UsersPage**

Cập nhật test kiểm tra:
1. Có cột "Ngày hết hạn", không còn cột "Ngày tham gia".
2. Không còn nút "Nạp tiền/Gia hạn" hoặc input số tháng.

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npm test src/app/\(main\)/dashboard/users/page.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Update `UserTable.tsx` and `page.tsx`**

1. Xóa `onRecharge`, `rechargeUserId`, `rechargeMonths`, `handleRechargeSubmit`, `DollarSign`.
2. Đổi `<th ...>Ngày tham gia</th>` $\rightarrow$ `<th ...>Ngày hết hạn</th>`.
3. Trong dòng dữ liệu, hiển thị `user.expiresAt ? new Date(user.expiresAt).toLocaleDateString('vi-VN') : '—'`.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npm test src/app/\(main\)/dashboard/users/page.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/users/ frontend/src/app/\(main\)/dashboard/users/
git commit -m "refactor(frontend): remove manual recharge and change column to expiration date"
```

---

### Task 5: Implement `PayOSPaymentModal`, Upgrade Page & Home Pricing Flow

**Files:**
- Create: `frontend/src/components/payment/PayOSPaymentModal.tsx`
- Modify: `frontend/src/app/(main)/upgrade/page.tsx`
- Modify: `frontend/src/components/home/HomePricing.tsx`
- Create/Modify tests: `frontend/src/components/home/HomePricing.test.tsx`

**Interfaces:**
- Produces: `PayOSPaymentModal` component with QR display, copyable bank details, checkout URL button, polling logic, and auth check before opening.

- [ ] **Step 1: Write unit tests for HomePricing & PayOS payment flow**

Viết test kiểm tra:
1. Khi click "Nâng cấp Pro ngay" ở HomePricing: nếu chưa đăng nhập $\rightarrow$ chuyển hướng `/login?redirect=/upgrade`.
2. `PayOSPaymentModal` render đúng thông tin chuyển khoản và QR.

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npm test src/components/home/HomePricing.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement `PayOSPaymentModal.tsx`, `upgrade/page.tsx`, and `HomePricing.tsx`**

1. Viết `PayOSPaymentModal.tsx` hỗ trợ render mã VietQR từ PayOS, thông tin tài khoản, nội dung đơn hàng, nút mở link thanh toán trực tiếp, đồng hồ đếm ngược, polling giao dịch.
2. Cập nhật `upgrade/page.tsx`: kiểm tra đăng nhập trước khi tạo đơn, mở `PayOSPaymentModal`.
3. Cập nhật `HomePricing.tsx`: kiểm tra auth khi bấm nút đăng ký/nâng cấp gói.

- [ ] **Step 4: Run frontend tests to verify they pass**

Run: `cd frontend && npm test`
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/
git commit -m "feat(frontend): add PayOS payment modal and auth check on home/upgrade pricing"
```

---

### Task 6: End-to-End Verification on Localhost

- [ ] **Step 1: Run full Backend test suite**
Run: `cd backend && go test ./...`
Expected: PASS.

- [ ] **Step 2: Run full Frontend test suite & build check**
Run: `cd frontend && npm test && npm run build`
Expected: PASS with 0 build/lint errors.

- [ ] **Step 3: Manual localhost visual check**
- Truy cập `http://localhost:3000/dashboard/users`: Xác nhận không còn nút nạp tiền và có cột "Ngày hết hạn".
- Truy cập `http://localhost:3000/upgrade` & `http://localhost:3000`: Thử luồng chọn gói khi chưa đăng nhập và khi đã đăng nhập.
