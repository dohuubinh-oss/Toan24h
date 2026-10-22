# Voucher Affiliate and LaTeX Support Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thêm hệ thống mã khuyến mãi (Voucher) liên kết với người giới thiệu (Affiliate/Teacher/Admin) áp dụng khi học sinh đăng ký tài khoản mới (tặng số tháng VIP miễn phí, ghi nhận lượt dùng), đồng thời nâng cấp trình soạn thảo 4 trường phụ (Gợi ý, Lời giải ngắn, Phương pháp tổng quát, Lỗi thường gặp) hỗ trợ công thức toán LaTeX đẹp với nút $\Sigma$ và ký hiệu góc `\hat`.

**Architecture:**
1. **LaTeX Display Enhancement:** Cập nhật `QuestionEditorSection.tsx`, `BaseEditor.tsx`, `MathText.tsx` để hỗ trợ nút công thức toán học $\Sigma$ cho 4 trường phụ và nhận diện chính xác các macro LaTeX như `\hat`, `\widehat`.
2. **Database Models & Migration:** Tạo 2 bảng mới `vouchers` (lưu mã code, `affiliate_id` trỏ tới `users.id`, `free_months`, `discount_percent`, `commission_percent`, `max_uses`, `used_count`, `expires_at`, `is_active`) và `voucher_usages` (lưu lịch sử áp dụng voucher theo từng học sinh).
3. **Backend API & Registration Logic:**
   - Endpoint tạo voucher `POST /api/v1/vouchers` dành cho Admin/Teacher.
   - Nâng cấp `POST /api/v1/auth/register` nhận `voucherCode` tùy chọn: kiểm tra mã khi học sinh nhấn Đăng ký; nếu hợp lệ thì tự động tính `ExpiresAt = now + (free_months * 30 ngày)`, tăng `used_count` và ghi nhận `voucher_usages`.
4. **Frontend Register Page:** Thêm ô nhập mã voucher tùy chọn tại form đăng ký [register/page.tsx](file:///Users/modeptrai/Desktop/toan6789.vn/frontend/src/app/\(auth\)/register/page.tsx) và truyền lên backend.

**Tech Stack:** Go (Gin, GORM, PostgreSQL), TypeScript, Next.js 16 (React, Tailwind CSS), Vitest.

**Spec:** Thảo luận thống nhất ngày 2026-10-22:
- Bảng `vouchers`: `affiliate_id` có thể liên kết với user có role `affiliate`, `teacher`, hoặc `admin`.
- Học sinh nhập mã tại form đăng ký mới; việc kiểm tra mã chỉ thực hiện khi người dùng bấm nút **Đăng ký**.
- Nếu mã không hợp lệ, hết hạn, hoặc hết lượt: báo lỗi 400 rõ ràng.
- Kích hoạt nút $\Sigma$ và KaTeX cho 4 trường phụ trong QuestionEditorSection.

## Global Constraints
- Không làm gián đoạn luồng đăng ký thông thường (khi học sinh không nhập mã voucher).
- Đảm bảo transaction an toàn trong Go: nếu áp voucher thất bại, toàn bộ thao tác tạo user và ghi nhận usage phải rollback.
- Chạy toàn bộ test suites (`go test ./...` và `npm test`) PASS 100%.

## Review Focus
1. Đăng ký không có voucher: tạo tài khoản học sinh bình thường như cũ.
2. Đăng ký với voucher không tồn tại, hết hạn, hoặc đã đạt `max_uses`: trả về lỗi 400 và không tạo tài khoản.
3. Đăng ký với voucher hợp lệ: tạo tài khoản học sinh với `ExpiresAt` được cộng thêm số ngày tương ứng `free_months`, `used_count` của voucher tăng 1, và có bản ghi trong `voucher_usages`.
4. Trình soạn thảo 4 trường phụ hiển thị nút $\Sigma$, bấm chèn công thức toán thành công và render KaTeX đẹp mắt.

---

### Task 1: Nâng cấp hiển thị và soạn thảo LaTeX cho 4 trường phụ

**Files:**
- Modify: `frontend/src/components/questions/creator/QuestionEditorSection.tsx:230-275`
- Modify: `frontend/src/components/ui/editor/BaseEditor.tsx:90-105`
- Modify: `frontend/src/components/ui/MathText.tsx:45-60`
- Test: `frontend/src/components/questions/creator/QuestionEditorSection.test.tsx`

- [ ] **Step 1: Viết test cho nút chèn công thức $\Sigma$ trong 4 trường phụ**
  - Cập nhật test case trong `QuestionEditorSection.test.tsx` để xác nhận các trường phụ hiển thị nút chèn công thức toán.

- [ ] **Step 2: Cập nhật `BaseEditor.tsx` và `MathText.tsx`**
  - Trong `BaseEditor.tsx` (dòng 93): bổ sung `hat` vào regex `latexRegex` để tự động bọc công thức có dạng `\hat{A} = \hat{C}`.
  - Trong `MathText.tsx` (dòng 50): bổ sung `hat` vào regex nhận diện lệnh LaTeX đơn.

- [ ] **Step 3: Cập nhật `QuestionEditorSection.tsx`**
  - Bật `showMathButton={true}` cho cả 4 component `RichTextEditor` của Gợi ý, Lời giải ngắn, Phương pháp tổng quát, Lỗi thường gặp:
    ```tsx
    <RichTextEditor
      hideToolbar={true}
      showMathButton={true}
      content={...}
      onChange={...}
    />
    ```

- [ ] **Step 4: Chạy test xác nhận PASS**
  - Command: `npx vitest run src/components/questions/creator/QuestionEditorSection.test.tsx`
  - Expected: PASS

---

### Task 2: Models & CSDL cho Voucher và VoucherUsage

**Files:**
- Create: `backend/internal/models/voucher.go`
- Modify: `backend/internal/config/database.go`
- Test: `backend/internal/models/voucher_test.go`

- [ ] **Step 1: Viết unit test cho model Voucher**
  - Tạo `backend/internal/models/voucher_test.go` kiểm tra khởi tạo UUID và tính toán thời gian hết hạn hoặc trạng thái khả dụng.

- [ ] **Step 2: Tạo model `Voucher` và `VoucherUsage` trong `backend/internal/models/voucher.go`**
  - Định nghĩa struct:
    ```go
    type Voucher struct {
        ID                uuid.UUID  `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
        Code              string     `gorm:"type:varchar(50);uniqueIndex;not null" json:"code"`
        AffiliateID       *uuid.UUID `gorm:"type:uuid;index" json:"affiliateId,omitempty"`
        FreeMonths        int        `gorm:"not null;default:0" json:"freeMonths"`
        DiscountPercent   int        `gorm:"not null;default:0" json:"discountPercent"`
        CommissionPercent float32    `gorm:"not null;default:0" json:"commissionPercent"`
        MaxUses           int        `gorm:"not null;default:100" json:"maxUses"`
        UsedCount         int        `gorm:"not null;default:0" json:"usedCount"`
        ExpiresAt         *time.Time `gorm:"index" json:"expiresAt,omitempty"`
        IsActive          bool       `gorm:"not null;default:true" json:"isActive"`
        CreatedAt         time.Time  `json:"createdAt"`
        UpdatedAt         time.Time  `json:"updatedAt"`
    }

    type VoucherUsage struct {
        ID          uuid.UUID  `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
        VoucherID   uuid.UUID  `gorm:"type:uuid;not null;index" json:"voucherId"`
        UserID      uuid.UUID  `gorm:"type:uuid;not null;index" json:"userId"`
        AffiliateID *uuid.UUID `gorm:"type:uuid;index" json:"affiliateId,omitempty"`
        CreatedAt   time.Time  `json:"createdAt"`
    }
    ```

- [ ] **Step 3: Thêm AutoMigrate trong `backend/internal/config/database.go`**
  - Bổ sung `&models.Voucher{}` và `&models.VoucherUsage{}` vào danh sách `DB.AutoMigrate(...)`.

- [ ] **Step 4: Chạy test xác nhận PASS**
  - Command: `go test -v ./internal/models/...`
  - Expected: PASS

---

### Task 3: Backend Voucher Handler & API Tạo Voucher

**Files:**
- Create: `backend/internal/handlers/voucher_handler.go`
- Modify: `backend/internal/routes/routes.go` (hoặc nơi đăng ký routes backend)
- Test: `backend/internal/handlers/voucher_handler_test.go`

- [ ] **Step 1: Viết test cho API tạo và xác thực Voucher**
  - Viết unit test giả lập router Gin:
    + Tạo voucher thành công với role admin/teacher.
    + Từ chối tạo mã trùng lặp.

- [ ] **Step 2: Triển khai `VoucherHandler`**
  - Tạo `backend/internal/handlers/voucher_handler.go`:
    + `CreateVoucher`: nhận code (uppercase, trim space), affiliateId, freeMonths, maxUses, expiresAt...
    + `GetVouchers`: danh sách mã voucher cho admin hoặc cho affiliate tương ứng.
    + `ValidateVoucher`: hàm trợ giúp kiểm tra mã còn khả dụng hay không.

- [ ] **Step 3: Đăng ký routes vào router backend**
  - Gắn endpoint `POST /api/v1/vouchers` (yêu cầu auth admin hoặc teacher) và `GET /api/v1/vouchers`.

- [ ] **Step 4: Chạy test xác nhận PASS**
  - Command: `go test -v ./internal/handlers/...`
  - Expected: PASS

---

### Task 4: Tích hợp Áp dụng Voucher khi Học sinh Đăng ký

**Files:**
- Modify: `backend/internal/handlers/auth_handler.go:40-120`
- Test: `backend/internal/handlers/auth_handler_test.go`

- [ ] **Step 1: Viết test cho luồng Register có voucher**
  - Test case 1: Register với `voucherCode` không hợp lệ -> trả lỗi 400.
  - Test case 2: Register với `voucherCode` hợp lệ (`freeMonths = 3`) -> User có `ExpiresAt` khoảng 90 ngày sau, voucher `used_count` tăng lên 1, tạo bản ghi `VoucherUsage`.
  - Test case 3: Register không có `voucherCode` -> User tạo bình thường, `ExpiresAt` là nil.

- [ ] **Step 2: Cập nhật `RegisterRequest` và hàm `Register` trong `auth_handler.go`**
  - Bổ sung `VoucherCode string `json:"voucherCode"` vào `RegisterRequest`.
  - Trong transaction tạo user:
    + Nếu `req.VoucherCode != ""`:
      - Tìm voucher theo `UPPER(TRIM(code))` và `is_active = true`.
      - Kiểm tra `expires_at == nil || expires_at > now`.
      - Kiểm tra `used_count < max_uses`.
      - Nếu không hợp lệ: return 400 error `"Mã khuyến mãi không hợp lệ, đã hết hạn hoặc hết lượt dùng"`.
      - Nếu hợp lệ: tính `expiresAt := now.AddDate(0, v.FreeMonths, 0)` và gán vào `user.ExpiresAt`.
      - Tăng `v.UsedCount += 1`.
      - Tạo bản ghi `models.VoucherUsage{VoucherID: v.ID, UserID: user.ID, AffiliateID: v.AffiliateID}`.

- [ ] **Step 3: Chạy test auth handler xác nhận PASS**
  - Command: `go test -v ./internal/handlers/...`
  - Expected: PASS

---

### Task 5: Cập nhật Giao diện Đăng ký Frontend

**Files:**
- Modify: `frontend/src/app/(auth)/register/page.tsx`
- Modify: `frontend/src/lib/api.ts`

- [ ] **Step 1: Cập nhật `api.ts` hàm `register`**
  - Hỗ trợ truyền thêm `voucherCode?: string` vào payload gửi lên backend.

- [ ] **Step 2: Thêm ô nhập Voucher tại `register/page.tsx`**
  - Thêm state `voucherCode` và input field:
    + Nhãn: "Mã khuyến mãi / Giới thiệu (không bắt buộc)"
    + Placeholder: "Ví dụ: THAYBINH3M"
    + Giúp người dùng nhập mã dễ dàng (tự động viết hoa code khi nhập).
  - Khi submit form, gửi `voucherCode` cùng với `email`, `password`, `fullName`, `grade`.
  - Hiển thị thông báo lỗi rõ ràng nếu backend trả về lỗi liên quan đến mã khuyến mãi.

- [ ] **Step 3: Chạy build & test frontend**
  - Command: `npm run build`
  - Expected: PASS

---

### Task 6: Kiểm thử Tổng thể & Nghiệm thu Toàn diện

**Files:**
- Verification only

- [ ] **Step 1: Chạy kiểm thử Backend toàn diện**
  - Command: `cd backend && go test -v ./...`
  - Expected: Code 0, PASS 100%.

- [ ] **Step 2: Chạy kiểm thử Frontend toàn diện**
  - Command: `cd frontend && npm test` và `npm run build`
  - Expected: Code 0, Build thành công, Không có lỗi Type hay Test nào.

- [ ] **Step 3: Rà soát git diff**
  - Đảm bảo tuân thủ Karpathy Principles: code đơn giản nhất, thay đổi phẫu thuật chính xác.
