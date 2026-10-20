# Image Upload Hardening & Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Triển khai giải pháp củng cố bảo mật (Magic Bytes, Rate Limiting), tối ưu hiệu năng (nén avatar, nén client-side cho Mobile QR, Cache-Control), và bảo toàn tính toàn vẹn dữ liệu cho toàn bộ hệ thống upload ảnh của `toan6789.vn`.

**Architecture:** Tạo module xác thực nhị phân dùng chung `file_validator.go`, áp dụng cho tất cả các handler upload. Tối ưu ảnh đại diện (resize 400x400px, xóa file cũ). Thêm middleware phục vụ ảnh tĩnh kèm security & cache headers. Nâng cấp cổng upload mobile qua QR với tính năng nén Canvas tại trình duyệt, chụp nhiều trang liên tiếp, và quản lý phiên 10 phút an toàn.

**Tech Stack:** Go (Gin, `image`, `net/http`), TypeScript, Next.js, React, Tailwind CSS, Vitest.

**Spec:** [2026-10-20-image-upload-hardening-design.md](file:///Users/modeptrai/Desktop/toan6789.vn/docs/superpowers/specs/2026-10-20-image-upload-hardening-design.md)

## Global Constraints
- **NO AUTO DEPLOY**: Tuyệt đối KHÔNG tự ý deploy lên VPS. Chỉ kiểm thử cục bộ và commit lên Git.
- **Tần suất dọn rác**: Vẫn giữ nguyên lịch ticker của cronjob là 7 ngày/lần (`7 * 24 * time.Hour`).
- **File types**: Chỉ chấp nhận `image/jpeg`, `image/png`, `image/webp`. Chặn hoàn toàn `.svg`, `.exe`, scripts hoặc file trá hình.

## Review Focus
1. Tệp độc hại giả mạo đuôi ảnh (ví dụ: `script.php.png` hoặc file chứa HTML/SVG) phải bị từ chối với mã lỗi 400.
2. Tệp ảnh có kích thước vượt ngưỡng (Avatar > 5MB, Mobile > 10MB) phải bị chặn dứt khoát.
3. Cổng `/mobile-upload/:sessionId` phải ngăn chặn spam qua Rate Limiting (tối đa 5 request / phút).
4. Đường dẫn `/uploads/*` phải có `X-Content-Type-Options: nosniff` và `Cache-Control` chuẩn xác theo từng loại thư mục.
5. Khi người dùng đổi ảnh đại diện mới, file ảnh đại diện cũ phải được xóa an toàn khỏi đĩa cứng.

---

### Task 1: Core Security - Binary Magic Bytes Validator Utility

**Files:**
- Create: `backend/internal/utils/file_validator.go`
- Create: `backend/internal/utils/file_validator_test.go`

- [ ] **Step 1: Write failing tests for image validator**
  Viết test kiểm tra `ValidateImageBytes` và `ValidateImageHeader` với:
  - Header hợp lệ với byte JPEG, PNG, WebP.
  - File giả mạo: extension `.png` nhưng nội dung là text plain hoặc `<?php` hoặc `<svg>`.
  - File vượt quá dung lượng `MaxSizeBytes`.
- [ ] **Step 2: Run test to confirm failure**
  Chạy `go test -v ./internal/utils/ -run TestValidateImage` để xác nhận test fail do chưa có code.
- [ ] **Step 3: Implement `file_validator.go`**
  Triển khai:
  - Kiểm tra dung lượng `header.Size`.
  - Kiểm tra đuôi mở rộng (`.jpg`, `.jpeg`, `.png`, `.webp`).
  - Đọc 512 byte đầu tiên và gọi `http.DetectContentType`.
  - Trả về lỗi rõ ràng nếu không thuộc `image/jpeg`, `image/png`, `image/webp`.
- [ ] **Step 4: Run tests and ensure 100% pass**
  Chạy `go test -v ./internal/utils/...` để đảm bảo vượt qua toàn bộ test.
- [ ] **Step 5: Commit task 1**
  Commit với thông điệp: `feat(security): add binary magic bytes image file validator`.

---

### Task 2: Integrate Binary Validation across Backend Upload Handlers

**Files:**
- Modify: `backend/internal/handlers/upload_handler.go`
- Modify: `backend/internal/handlers/user_handler.go`
- Modify: `backend/internal/handlers/ai_question_handler.go`
- Modify: `backend/internal/handlers/lecture_extractor_handler.go`
- Modify: `backend/internal/handlers/upload_handler_test.go`

- [ ] **Step 1: Update `upload_handler.go` (`UploadTempImage`)**
  Thay thế logic check đuôi file bằng `utils.ValidateImageHeader(file, utils.DefaultImageValidationOptions)`.
- [ ] **Step 2: Update `user_handler.go` (`UploadAvatar`)**
  Tích hợp `utils.ValidateImageHeader(file, utils.AvatarImageValidationOptions)`.
- [ ] **Step 3: Update `ai_question_handler.go` & `lecture_extractor_handler.go`**
  Kiểm tra `utils.ValidateImageBytes(fileBytes, ...)` trước khi nén hoặc gửi sang Gemini API.
- [ ] **Step 4: Update and run handler unit tests**
  Chạy `go test -v ./internal/handlers/...` để kiểm tra toàn bộ handler hoạt động chính xác.
- [ ] **Step 5: Commit task 2**
  Commit với thông điệp: `feat(security): enforce magic bytes validation on all image upload handlers`.

---

### Task 3: Avatar Optimization & Orphan File Cleanup

**Files:**
- Modify: `backend/internal/handlers/user_handler.go`
- Test: `backend/internal/handlers/avatar_upload_test.go`

- [ ] **Step 1: Write test for avatar resizing & old avatar deletion**
  Kiểm tra rằng khi upload avatar mới:
  - File ảnh được lưu có kích thước hợp lý (tối đa 400x400px).
  - File avatar cũ trước đó bị xóa khỏi `./uploads/avatars/`.
- [ ] **Step 2: Run test to observe behavior**
  Chạy `go test -v ./internal/handlers/ -run TestUploadAvatar`.
- [ ] **Step 3: Implement avatar resizing and old file cleanup**
  Trong `userHandler.UploadAvatar`:
  - Decode ảnh qua `image.Decode`.
  - Tính toán tỉ lệ để resize ảnh về max 400x400px (dùng phép nội suy chuẩn).
  - Encode thành JPEG chất lượng 85% để loại bỏ hoàn toàn EXIF tags.
  - Lấy `user.TelegramAvt` hiện tại, nếu có đường dẫn cục bộ dạng `/uploads/avatars/uuid...`, gọi `os.Remove` an toàn trước khi cập nhật URL mới.
- [ ] **Step 4: Run test and ensure passing**
  Chạy `go test -v ./internal/handlers/ -run TestUploadAvatar`.
- [ ] **Step 5: Commit task 3**
  Commit với thông điệp: `feat(avatar): auto resize avatar to 400x400 and cleanup orphan avatars`.

---

### Task 4: Static File Serving Security & Cache-Control Headers

**Files:**
- Modify: `backend/internal/routes/routes.go`
- Create: `backend/internal/middleware/static_cache_test.go`

- [ ] **Step 1: Write test for static route headers**
  Gửi request GET đến file tĩnh trong `/uploads/questions/...` và `/uploads/temp/...`, kiểm tra:
  - Header `X-Content-Type-Options: nosniff`.
  - `Cache-Control` cho questions là `public, max-age=31536000, immutable`.
  - `Cache-Control` cho temp là `no-cache, no-store`.
- [ ] **Step 2: Run test to confirm failure**
  Chạy `go test -v ./internal/middleware/ -run TestStaticHeaders`.
- [ ] **Step 3: Implement static headers in `routes.go`**
  Thay `r.Static("/uploads", "./uploads")` bằng custom router group có middleware đặt security & cache headers trước khi phục vụ tệp tĩnh qua `http.FileServer`.
- [ ] **Step 4: Run test and ensure passing**
  Chạy `go test -v ./internal/middleware/...` để đảm bảo test đạt.
- [ ] **Step 5: Commit task 4**
  Commit với thông điệp: `feat(static): add nosniff and immutable caching headers for uploads`.

---

### Task 5: Mobile QR Upload Hardening & Enhancements (Client Compression & Multi-Page)

**Files:**
- Modify: `backend/internal/controllers/mobile_upload_controller.go`
- Modify: `frontend/src/app/(fullscreen)/mobile-upload/page.tsx`
- Modify: `frontend/src/components/exam/taking/MobileQrUploadModal.tsx`

- [ ] **Step 1: Add Rate Limiting & Multi-page storage in `mobile_upload_controller.go`**
  - Giới hạn 5 lượt upload / phút / IP / session.
  - Hỗ trợ lưu trữ mảng kết quả nhiều trang hoặc ghép text nhận dạng theo thứ tự trang: `Trang 1: ... \n Trang 2: ...`.
  - Trả về cả `text` và `imageUrl` (nếu cần xem lại ảnh gốc).
- [ ] **Step 2: Add Client-side Canvas Compression in `mobile-upload/page.tsx`**
  - Viết helper `compressImageFile(file, maxDimension = 1920, quality = 0.85)` dùng HTML5 Canvas.
  - Nén ảnh ngay trên thiết bị học sinh trước khi gửi `FormData`.
  - Giảm dung lượng từ ~8MB xuống ~400KB.
- [ ] **Step 3: Add Multi-page UI on Mobile**
  - Thêm nút "Chụp thêm trang tiếp theo (Trang 2...)" và danh sách thumbnail các trang đã chụp.
  - Học sinh có thể chụp nhiều trang rồi bấm "Hoàn tất nộp bài" 1 lần.
- [ ] **Step 4: Add 10-Minute TTL countdown & Preview in `MobileQrUploadModal.tsx`**
  - Đếm ngược 10 phút trên modal máy tính.
  - Hiển thị thông báo khi phiên hết hạn kèm nút "Làm mới mã QR".
- [ ] **Step 5: Run tests for mobile upload**
  Chạy `go test -v ./internal/controllers/...` và `npx vitest run src/components/exam/taking/`.
- [ ] **Step 6: Commit task 5**
  Commit với thông điệp: `feat(mobile-upload): add client-side compression, multi-page capture and rate limiting`.

---

### Task 6: Comprehensive Verification & Git Push (Strict NO AUTO DEPLOY)

- [ ] **Step 1: Run all backend tests**
  `go test ./...` trong `backend`.
- [ ] **Step 2: Run all frontend tests**
  `npx vitest run` trong `frontend`.
- [ ] **Step 3: Run frontend production build**
  `npm run build` trong `frontend`.
- [ ] **Step 4: Final Git push to origin/main**
  `git push origin main`.
- [ ] **Step 5: Verify NO auto-deployment occurred**
  Xác nhận không gọi bất kỳ lệnh deploy nào lên VPS.
