# Kế hoạch Triển khai Hệ thống Mã giới thiệu (GT Voucher) & Hoa hồng Đối tác

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây dựng hệ thống mã giới thiệu trọn đời tiền tố `GT...` cho các vai trò Admin, Teacher, Affiliate với ưu đãi 1 tháng VIP cho học sinh đăng ký mới (cả form và Google), chia hoa hồng tự động 30%/60%/70% mỗi khi học sinh nạp tiền, tự động chốt sổ vào ngày 01 hàng tháng và hiển thị trên trang cá nhân.

**Architecture:** Sử dụng PostgreSQL lưu trữ liên kết người giới thiệu (`referrer_id`) và số dư hoa hồng (`commission_balance`, `total_commission_received`). PayOS Webhook xử lý trích hoa hồng an toàn theo vai trò. Goroutine Cronjob chạy tự động chốt sổ lúc 00:00:00 ngày 01 hàng tháng. Frontend Next.js 16 hiển thị thẻ thông tin giới thiệu và sao chép link trên `/profile`.

**Tech Stack:** Go (Gin, GORM, PostgreSQL), Next.js 16 (Turbopack, Tailwind CSS, Lucide icons), Vitest, Go Test.

**Spec:** [docs/superpowers/specs/2026-10-29-affiliate-gt-voucher-design.md](file:///Users/modeptrai/Desktop/toan6789.vn/docs/superpowers/specs/2026-10-29-affiliate-gt-voucher-design.md)

## Global Constraints

- Phạm vi hoạt động giới hạn nghiêm ngặt trong `/Users/modeptrai/Desktop/toan6789.vn`.
- Tuyệt đối KHÔNG tự ý deploy lên VPS.
- Mã giới thiệu luôn có tiền tố `GT` kết hợp 6 chữ số ngẫu nhiên (ví dụ `GT123456`), không có hạn sử dụng (`expires_at = NULL`).
- Tỷ lệ hoa hồng: Affiliate 30%, Teacher 60%, Admin 70% giá trị gói nạp của học sinh.
- Học sinh nhập mã được tặng 1 tháng VIP miễn phí (`free_months = 1`).
- Đảm bảo 100% kiểm thử (TDD): Viết test trước, code sau, verify PASS trước khi commit.

## Review Focus

1. **Học sinh đăng ký bằng Google Sign-In qua link `?ref=GT...`**: Phải bắt được mã `ref`, cấp 1 tháng VIP và gắn `referrer_id` chính xác như form đăng ký thường.
2. **Lỗi chia hoa hồng không được làm gián đoạn kích hoạt VIP**: Quá trình trích hoa hồng trong Webhook PayOS phải được bọc an toàn để nếu có lỗi logic hoa hồng thì học sinh vẫn nhận được gói học đã thanh toán.
3. **Chống tự giới thiệu (Self-referral)**: Tài khoản không được nhập mã giới thiệu của chính mình.
4. **Idempotency của Cronjob đầu tháng**: Cronjob chốt sổ ngày 01 chỉ chuyển đổi số dư một lần duy nhất, không bị cộng dồn trùng lặp khi server restart vào ngày mùng 1.
5. **Phân quyền hiển thị UI**: Khối hoa hồng trên `/profile` chỉ hiển thị cho `admin`, `teacher`, `affiliate`; học sinh (`student`) tuyệt đối không nhìn thấy.

---

### Task 1: Cấu trúc Dữ liệu CSDL (Database Schema & Models)

**Files:**
- Modify: `backend/internal/models/user.go`
- Create: `backend/internal/models/commission_transaction.go`
- Modify: `backend/internal/config/database.go`
- Modify: `backend/cmd/api/main.go`
- Test: `backend/internal/models/commission_transaction_test.go`

**Interfaces:**
- Consumes: GORM, PostgreSQL
- Produces: `models.CommissionTransaction`, `User.ReferralCode`, `User.ReferrerID`, `User.CommissionBalance`, `User.TotalCommissionReceived`

- [ ] **Step 1: Viết test kiểm tra cấu trúc model `CommissionTransaction` và các trường mới của `User`**
  Tạo `backend/internal/models/commission_transaction_test.go` kiểm tra khởi tạo `CommissionTransaction`, kiểm tra các trường `ReferralCode`, `ReferrerID`, `CommissionBalance`, `TotalCommissionReceived` trên `User`.
- [ ] **Step 2: Chạy test để xác nhận FAIL**
  Chạy: `cd backend && go test -v ./internal/models -run TestCommissionTransaction`
  Kết quả: FAIL (undefined `CommissionTransaction` / thiếu fields).
- [ ] **Step 3: Cập nhật model `User` và tạo model `CommissionTransaction`**
  - Trong `backend/internal/models/user.go`: Thêm `ReferralCode *string` (uniqueIndex), `ReferrerID *uuid.UUID` (index), `CommissionBalance int64` (default 0), `TotalCommissionReceived int64` (default 0).
  - Tạo `backend/internal/models/commission_transaction.go`:
    ```go
    type CommissionTransaction struct {
        ID               uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
        OrderCode        int64     `gorm:"index" json:"orderCode"`
        ReferrerID       uuid.UUID `gorm:"type:uuid;index;not null" json:"referrerId"`
        StudentID        uuid.UUID `gorm:"type:uuid;index;not null" json:"studentId"`
        StudentAmount    int       `gorm:"not null" json:"studentAmount"`
        CommissionRate   float32   `gorm:"not null" json:"commissionRate"`
        CommissionAmount int       `gorm:"not null" json:"commissionAmount"`
        Status           string    `gorm:"type:varchar(20);not null;default:'pending'" json:"status"`
        CreatedAt        time.Time `json:"createdAt"`
    }
    ```
  - Cập nhật AutoMigrate trong `backend/internal/config/database.go` và `backend/cmd/api/main.go`.
- [ ] **Step 4: Chạy lại test để xác nhận PASS**
  Chạy: `cd backend && go test -v ./internal/models -run TestCommissionTransaction`
  Kết quả: PASS.
- [ ] **Step 5: Commit**
  `git add backend/internal/models/ backend/internal/config/database.go backend/cmd/api/main.go`
  `git commit -m "feat(models): add commission transaction model and affiliate fields to user"`

---

### Task 2: Service Tự động Cấp Mã `GT...` cho Admin, Teacher, Affiliate

**Files:**
- Create: `backend/internal/services/referral_service.go`
- Create: `backend/internal/services/referral_service_test.go`
- Modify: `backend/cmd/api/main.go`

**Interfaces:**
- Consumes: `models.User`, `models.Voucher`, `*gorm.DB`
- Produces: `services.GenerateUniqueReferralCode(db *gorm.DB) (string, error)`, `services.EnsureUserReferralCode(db *gorm.DB, user *models.User) (*models.Voucher, error)`

- [ ] **Step 1: Viết test cho logic sinh mã và cấp mã giới thiệu**
  Tạo `backend/internal/services/referral_service_test.go`:
  - `TestGenerateUniqueReferralCode`: Mã phải bắt đầu bằng `GT`, có độ dài 8 ký tự (`GT` + 6 số).
  - `TestEnsureUserReferralCode`: Tạo voucher tương ứng với `CommissionPercent` chuẩn: 30% cho affiliate, 60% cho teacher, 70% cho admin. Idempotent: gọi 2 lần không tạo duplicate voucher.
- [ ] **Step 2: Chạy test để xác nhận FAIL**
  Chạy: `cd backend && go test -v ./internal/services -run TestReferralService`
  Kết quả: FAIL.
- [ ] **Step 3: Triển khai `backend/internal/services/referral_service.go`**
  - Hàm sinh số ngẫu nhiên cryptographically-secure hoặc math/rand với prefix `GT` + 6 digits.
  - Kiểm tra tính duy nhất trong bảng `vouchers` và `users`. Thử lại tối đa 5 lần.
  - Tạo `models.Voucher` gắn với `user.ID`, `FreeMonths = 1`, `MaxUses = 0`, `ExpiresAt = nil`.
  - Cập nhật `user.ReferralCode = &code`.
  - Thêm hàm khởi tạo `MigrateExistingAffiliateCodes(db *gorm.DB)` chạy lúc khởi động backend trong `main.go`.
- [ ] **Step 4: Chạy test để xác nhận PASS**
  Chạy: `cd backend && go test -v ./internal/services -run TestReferral`
  Kết quả: PASS.
- [ ] **Step 5: Commit**
  `git add backend/internal/services/referral_service* backend/cmd/api/main.go`
  `git commit -m "feat(services): implement automated GT referral code generation"`

---

### Task 3: Ghi nhận Mã Giới thiệu khi Đăng ký (Form thường & Google Login)

**Files:**
- Modify: `backend/internal/handlers/auth_handler.go`
- Modify: `backend/internal/handlers/auth_google.go`
- Modify: `backend/internal/handlers/auth_handler_test.go`
- Modify: `frontend/src/components/auth/RegisterForm.tsx`
- Modify: `frontend/src/components/auth/GoogleSignInButton.tsx`
- Modify: `frontend/src/components/auth/RegisterForm.test.tsx`

**Interfaces:**
- Consumes: `services.EnsureUserReferralCode`, `models.Voucher`
- Produces: Gắn `user.ReferrerID` khi đăng ký kèm voucher đối tác; hỗ trợ `refCode` qua Google Sign-In.

- [ ] **Step 1: Viết test backend kiểm tra đăng ký gắn `referrer_id`**
  Thêm case vào `backend/internal/handlers/auth_handler_test.go`:
  - Đăng ký tài khoản học sinh kèm mã `GT...` hợp lệ: `user.ReferrerID` bằng ID của người giới thiệu, học sinh được cộng 1 tháng VIP.
  - Tự giới thiệu (self-referral): Nếu email trùng với người sở hữu mã thì từ chối hoặc không gắn referrer.
- [ ] **Step 2: Chạy test để xác nhận FAIL**
  Chạy: `cd backend && go test -v ./internal/handlers -run TestRegisterWithReferral`
  Kết quả: FAIL.
- [ ] **Step 3: Cập nhật `auth_handler.go` và `auth_google.go`**
  - Trong `Register`: Khi voucher có `voucher.AffiliateID != nil`, gán `user.ReferrerID = voucher.AffiliateID`.
  - Trong `GoogleLogin`: Thêm trường `RefCode string` trong `GoogleLoginRequest`. Nếu tài khoản mới tạo và có `RefCode`: tìm voucher hợp lệ, cộng 1 tháng VIP và gán `user.ReferrerID = voucher.AffiliateID`.
- [ ] **Step 4: Cập nhật frontend `RegisterForm.tsx` & `GoogleSignInButton.tsx`**
  - Tự động đọc param `?ref=GT...` từ URL search params, điền vào ô voucherCode và lưu vào cookie/state.
  - Nút Google Sign-In truyền kèm `refCode` lên backend khi đăng nhập.
- [ ] **Step 5: Chạy test xác nhận PASS cả frontend và backend**
  Chạy:
  - `cd backend && go test -v ./internal/handlers -run TestRegister`
  - `cd frontend && npx vitest run src/components/auth/RegisterForm.test.tsx`
  Kết quả: PASS 100%.
- [ ] **Step 6: Commit**
  `git add backend/internal/handlers/ frontend/src/components/auth/`
  `git commit -m "feat(auth): support referral code binding for standard and google registration"`

---

### Task 4: Webhook PayOS Tự động Trích Hoa hồng Trọn đời

**Files:**
- Modify: `backend/internal/handlers/webhook_handler.go`
- Modify: `backend/internal/handlers/webhook_handler_test.go`

**Interfaces:**
- Consumes: `models.Transaction`, `models.CommissionTransaction`, `models.User`
- Produces: Cộng `commission_balance` cho referrer và ghi nhận `CommissionTransaction` khi học sinh thanh toán PayOS thành công.

- [ ] **Step 1: Viết test cho luồng chia hoa hồng trong Webhook**
  Thêm test vào `backend/internal/handlers/webhook_handler_test.go`:
  - Tạo học sinh có `ReferrerID` trỏ đến giáo viên (`Role = 'teacher'`).
  - Giả lập PayOS webhook thành công số tiền 300,000 VNĐ.
  - Xác nhận: Học sinh nhận hạn VIP, giáo viên nhận 60% (180,000 VNĐ) vào `CommissionBalance`, tạo 1 bản ghi `CommissionTransaction` trạng thái `pending`.
  - Thử nghiệm với đối tác Affiliate nhận 30% (90,000 VNĐ), Admin nhận 70% (210,000 VNĐ).
  - Thử nghiệm trường hợp học sinh không có người giới thiệu: thanh toán VIP bình thường, không sinh hoa hồng.
- [ ] **Step 2: Chạy test để xác nhận FAIL**
  Chạy: `cd backend && go test -v ./internal/handlers -run TestPayOSWebhookCommission`
  Kết quả: FAIL.
- [ ] **Step 3: Triển khai logic trích hoa hồng trong `webhook_handler.go`**
  - Đọc `updatedUser.ReferrerID`. Nếu khác `nil`:
    - Tìm `referrer` trong CSDL.
    - Kiểm tra `referrer.Status == "active"` và role hợp lệ.
    - Tính hoa hồng: 30% cho affiliate, 60% cho teacher, 70% cho admin.
    - Cập nhật `db.Model(&referrer).Update("commission_balance", gorm.Expr("commission_balance + ?", commAmount))`.
    - Tạo `models.CommissionTransaction`.
    - Bọc logic xử lý hoa hồng để nếu có lỗi cũng không làm fail giao dịch gia hạn VIP của học sinh (an toàn tuyệt đối).
- [ ] **Step 4: Chạy test để xác nhận PASS**
  Chạy: `cd backend && go test -v ./internal/handlers -run TestWebhook`
  Kết quả: PASS.
- [ ] **Step 5: Commit**
  `git add backend/internal/handlers/webhook_handler*`
  `git commit -m "feat(payment): implement lifetime commission calculation on PayOS webhook"`

---

### Task 5: Cronjob Chốt Sổ Hàng Tháng (Monthly Settlement)

**Files:**
- Create: `backend/internal/services/commission_settlement.go`
- Create: `backend/internal/services/commission_settlement_test.go`
- Modify: `backend/internal/services/cronjob.go`
- Modify: `backend/cmd/api/main.go`

**Interfaces:**
- Consumes: `models.User`, `models.CommissionTransaction`, `*gorm.DB`
- Produces: `services.SettleMonthlyCommissions(db *gorm.DB) (int64, error)`, Cronjob chạy vào 00:00:00 ngày 01 hàng tháng (GMT+7).

- [ ] **Step 1: Viết test cho hàm `SettleMonthlyCommissions`**
  Tạo `backend/internal/services/commission_settlement_test.go`:
  - Tạo 2 user có `CommissionBalance = 500,000` và `TotalCommissionReceived = 1,000,000`.
  - Chạy `SettleMonthlyCommissions(db)`.
  - Xác nhận: `CommissionBalance = 0`, `TotalCommissionReceived = 1,500,000`.
  - Các giao dịch `CommissionTransaction` chuyển sang trạng thái `settled`.
- [ ] **Step 2: Chạy test để xác nhận FAIL**
  Chạy: `cd backend && go test -v ./internal/services -run TestSettleMonthlyCommissions`
  Kết quả: FAIL.
- [ ] **Step 3: Triển khai `commission_settlement.go` và tích hợp Cronjob**
  - Hàm `SettleMonthlyCommissions(db *gorm.DB) (int64, error)`:
    - Chạy trong DB transaction.
    - Cập nhật toàn bộ `users` có `commission_balance > 0`: `total_commission_received = total_commission_received + commission_balance, commission_balance = 0`.
    - Đánh dấu `commission_transactions` `status = 'settled'`.
  - Hàm `StartMonthlySettlementCronJob(db *gorm.DB)`:
    - Tính thời gian đến `00:00:00` ngày 01 của tháng tiếp theo (Múi giờ Asia/Ho_Chi_Minh).
    - Hẹn giờ chạy goroutine định kỳ hàng tháng.
  - Gọi trong `backend/cmd/api/main.go`.
- [ ] **Step 4: Chạy test để xác nhận PASS**
  Chạy: `cd backend && go test -v ./internal/services -run TestSettleMonthlyCommissions`
  Kết quả: PASS.
- [ ] **Step 5: Commit**
  `git add backend/internal/services/commission_settlement* backend/cmd/api/main.go`
  `git commit -m "feat(cron): add monthly commission settlement worker"`

---

### Task 6: Giao diện Trang Cá Nhân (`/profile`) - Thẻ Đối tác & Giới thiệu

**Files:**
- Modify: `backend/internal/handlers/user_handler.go`
- Modify: `frontend/src/app/(main)/profile/page.tsx`
- Modify: `frontend/src/app/(main)/profile/page.test.tsx`

**Interfaces:**
- Consumes: API `GET /api/v1/users/me` trả về `referralCode`, `commissionBalance`, `totalCommissionReceived`
- Produces: UI Card "Chương trình Đối tác & Giới thiệu" cho Admin, Teacher, Affiliate.

- [ ] **Step 1: Viết test frontend cho khối Giới thiệu & Hoa hồng**
  Cập nhật `frontend/src/app/(main)/profile/page.test.tsx`:
  - Khi user là `teacher`: Hiển thị mã giới thiệu (ví dụ `GT123456`), tỷ lệ 60%, số dư tháng này và tổng đã nhận. Có nút sao chép link.
  - Khi user là `student`: KHÔNG hiển thị khối này.
- [ ] **Step 2: Chạy test để xác nhận FAIL**
  Chạy: `cd frontend && npx vitest run src/app/(main)/profile/page.test.tsx`
  Kết quả: FAIL.
- [ ] **Step 3: Cập nhật API `GetProfile` và giao diện `profile/page.tsx`**
  - Trong `backend/internal/handlers/user_handler.go` (`GetProfile`): Trả về thêm `referralCode`, `commissionBalance`, `totalCommissionReceived`.
  - Trong `frontend/src/app/(main)/profile/page.tsx`:
    - Mở rộng interface `UserProfile`.
    - Thêm Component `ReferralAffiliateCard`:
      - Thiết kế chuẩn `DESIGN.md`: Bo góc `rounded-2xl`, màu sắc `emerald/primary`, icon `Gift`, `Copy`, `Percent`, `Coins`.
      - Hiển thị badge mã giới thiệu, nút bấm Copy mã kèm thông báo toast.
      - Nút "Sao chép link đăng ký" (`https://toan6789.vn/register?ref=GTxxxxxx`).
      - 2 thẻ thống kê: "Hoa hồng tháng này (chờ chốt)" và "Tổng hoa hồng đã nhận".
- [ ] **Step 4: Chạy test để xác nhận PASS**
  Chạy: `cd frontend && npx vitest run src/app/(main)/profile/page.test.tsx`
  Kết quả: PASS.
- [ ] **Step 5: Commit**
  `git add backend/internal/handlers/user_handler.go frontend/src/app/(main)/profile/`
  `git commit -m "feat(ui): display referral code and commission stats on profile page"`

---

### Task 7: Kiểm thử Toàn diện & Xác thực Hệ thống (Integration Verification)

**Files:**
- Verify: Toàn bộ backend test suites và frontend vitest suites.

- [ ] **Step 1: Chạy kiểm thử Backend Go**
  Chạy: `cd backend && go test -v ./...`
  Đảm bảo: Tất cả tests trong handlers, services, models đều PASS 100%.
- [ ] **Step 2: Chạy kiểm tra TypeScript frontend**
  Chạy: `cd frontend && npx tsc --noEmit`
  Đảm bảo: 0 lỗi type.
- [ ] **Step 3: Chạy toàn bộ Vitest suite frontend**
  Chạy: `cd frontend && npx vitest run src/components/auth/RegisterForm.test.tsx src/app/(main)/profile/page.test.tsx`
  Đảm bảo: PASS 100%.
- [ ] **Step 4: Biên dịch lại Backend binary & Khởi động server daemon**
  Chạy: `cd backend && go build -o bin/api ./cmd/api` và restart background process.
  Xác nhận cổng 8080 phản hồi `GET /health` -> `UP`.
- [ ] **Step 5: Commit hoàn tất**
  `git commit --allow-empty -m "chore(release): complete automated GT voucher and affiliate commission system"`
