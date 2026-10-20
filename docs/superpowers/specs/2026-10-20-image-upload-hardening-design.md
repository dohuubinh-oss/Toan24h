# Tài Liệu Thiết Kế: Củng Cố & Chuẩn Hóa Toàn Diện Hệ Thống Upload Ảnh (Toan6789.vn)

**Ngày lập**: 2026-10-20  
**Tác giả**: Antigravity Assistant & modeptrai  
**Trạng thái**: Chờ phê duyệt (Pending Approval)

---

## 1. Bối cảnh & Mục đích (Intent & Why)

Hệ thống `toan6789.vn` tiếp nhận lượng lớn hình ảnh từ nhiều luồng khác nhau:
1. Giáo viên/Admin tải ảnh đề thi để AI bóc tách câu hỏi và bài giảng.
2. Trích xuất và cắt hình học, đồ thị tự động sang thư mục tạm (`./uploads/temp`) rồi di chuyển sang thư mục câu hỏi (`./uploads/questions/{grade}`).
3. Học sinh chụp ảnh bài làm viết tay từ điện thoại thông qua mã QR (`/mobile-upload/:sessionId`).
4. Người dùng cập nhật ảnh đại diện cá nhân (`/api/v1/users/me/avatar`).

Hiện tại, các điểm tiếp nhận này tiềm ẩn rủi ro về:
- **Bảo mật**: Chỉ kiểm tra đuôi mở rộng file (`.png`, `.jpg`), chưa xác thực nhị phân (Magic Bytes), thiếu Rate Limiting trên cổng công khai.
- **Hiệu năng & Tài nguyên**: Ảnh đại diện lưu file gốc không nén gây lãng phí dung lượng và chậm tải; thiếu tiêu đề HTTP `Cache-Control` cho ảnh tĩnh.
- **Toàn vẹn dữ liệu**: Ảnh đại diện cũ không được dọn dẹp khi đổi ảnh mới.

---

## 2. Mục tiêu, Giới hạn & Thiết luật (Goals, Non-Goals, Constraints)

### 2.1. Mục tiêu (Goals)
1. **Bảo mật tuyệt đối (Security Hardening)**:
   - Xác thực kép: Vừa kiểm tra phần mở rộng file, vừa đọc 512 bytes đầu tiên bằng `http.DetectContentType` (Magic Bytes) để xác nhận MIME type thực tế (`image/jpeg`, `image/png`, `image/webp`).
   - Từ chối dứt khoát các tệp SVG (nguy cơ XSS), HTML, script trá hình hoặc tệp vượt quá giới hạn dung lượng.
   - Thêm cơ chế Rate Limiting (chống spam/DoS) cho endpoint công khai `/mobile-upload/:sessionId`.
   - Bổ sung Security Headers (`X-Content-Type-Options: nosniff`) cho toàn bộ đường dẫn tĩnh `/uploads`.
2. **Tối ưu hiệu năng & Trải nghiệm (Performance & UX)**:
   - Tự động nén và resize ảnh đại diện về kích thước chuẩn (tối đa 400x400px), loại bỏ EXIF metadata nhạy cảm, giảm dung lượng từ hàng MB xuống ~30-60KB.
   - Cấu hình tiêu đề `Cache-Control`:
     - Ảnh vĩnh viễn (`/uploads/questions/*`, `/uploads/avatars/*`): `public, max-age=31536000, immutable`.
     - Ảnh tạm (`/uploads/temp/*`): `no-cache, no-store, must-revalidate`.
3. **Toàn vẹn dữ liệu (Data Integrity)**:
   - Tự động xóa file ảnh đại diện cũ khi người dùng tải lên ảnh mới.
   - Giữ nguyên thiết lập lịch trình dọn dẹp thư mục tạm định kỳ theo đúng yêu cầu người dùng.

### 2.2. Điều kiện ràng buộc từ Người Dùng (User Constraints)
- **Chu kỳ dọn rác**: **Vẫn giữ tần suất dọn dẹp thư mục tạm là 7 ngày/lần** (`7 * 24 * time.Hour`).
- **NO AUTO DEPLOY**: Tuyệt đối không tự ý deploy lên VPS. Chỉ kiểm thử cục bộ và commit Git.

### 2.3. Phi mục tiêu (Non-Goals)
- Không chuyển đổi lưu trữ sang S3/Cloud Storage bên ngoài trong phạm vi task này (giữ nguyên lưu trữ local volume để bảo toàn cấu hình Dokku hiện tại).

---

## 3. Kiến Trúc Kỹ Thuật Chi Tiết (Technical Architecture)

### 3.1. Utility Xác Thực Tệp Nhị Phân (`backend/internal/utils/file_validator.go`)
Hàm tiện ích dùng chung:
```go
type ImageValidationOptions struct {
    MaxSizeBytes int64
    AllowedMimes []string // ["image/jpeg", "image/png", "image/webp"]
}

// ValidateImageBytes kiểm tra magic bytes thực tế của mảng byte ảnh
func ValidateImageBytes(data []byte, opts ImageValidationOptions) error

// ValidateImageHeader kiểm tra multipart.FileHeader kết hợp đọc 512 byte đầu tiên
func ValidateImageHeader(header *multipart.FileHeader, opts ImageValidationOptions) error
```

### 3.2. Nâng Cấp Toàn Diện Cổng Upload Mobile Qua QR (`mobile_upload_controller.go` & `mobile-upload/page.tsx`)
- **Nén ảnh trực tiếp trên trình duyệt điện thoại (Client-side Canvas Compression)**:
  - Trước khi upload, Canvas trên mobile tự động resize ảnh xuống cạnh dài tối đa 1920px, chất lượng JPEG 85%.
  - Giảm dung lượng ảnh từ 8-12MB xuống còn ~300KB - 500KB (giảm 95% thời gian upload và chống timeout).
- **Hỗ trợ chụp nhiều trang liên tiếp (Multi-Page Hand-written Capture)**:
  - Cho phép học sinh chụp Trang 1, Trang 2, Trang 3... trên cùng một phiên làm việc trước khi ấn "Hoàn tất nộp bài".
  - Backend ghép nối kết quả nhận dạng theo đúng số thứ tự trang.
- **Tự động xoay ảnh theo cờ EXIF Orientation**:
  - Đảm bảo ảnh chụp bị nghiêng/lật ngang khi để trên bàn học được tự động dựng thẳng trước khi chuyển cho Gemini OCR.
- **Bảo mật phiên QR (Session Security & Anti-Hijacking)**:
  - Session ID có thời hạn sống (TTL) 10 phút. Hết 10 phút, mã QR trên máy tính tự động báo hết hạn và tạo phiên mới.
  - Sau khi điện thoại nộp thành công, session bị hủy ngay lập tức để chống gửi đè.
- **Rate Limiting**:
  - Tối đa 5 lần gửi ảnh / phút / session / IP để chống spam và bảo vệ quota Gemini API.
- **Đối chiếu ảnh gốc trên máy tính**:
  - Trả về cả text OCR và link ảnh tạm để học sinh có thể click xem lại bản nháp viết tay nếu cần.

### 3.3. Tối Ưu Avatar (`user_handler.go`)
- Khi người dùng tải ảnh lên:
  1. Kiểm tra magic bytes và dung lượng (Max 5MB).
  2. Dùng thư viện Go `image` để decode ảnh, tính toán tỉ lệ và resize về tối đa 400x400px.
  3. Encode lại dưới dạng JPEG chất lượng 85% hoặc WebP/PNG chuẩn hóa, loại bỏ EXIF tag (bảo vệ quyền riêng tư người dùng).
  4. Nếu `user.TelegramAvt` trỏ tới file cục bộ cũ trong `/uploads/avatars/`, xóa file cũ an toàn trước khi lưu URL mới.

### 3.4. Static File Serving Middleware (`routes.go`)
Thay thế `r.Static("/uploads", "./uploads")` bằng custom handler hoặc middleware gắn Header:
- `X-Content-Type-Options: nosniff`
- Kiểm tra URL:
  - Nếu bắt đầu bằng `/uploads/temp/` -> `Cache-Control: no-cache, no-store, must-revalidate`
  - Nếu thuộc `/uploads/questions/` hoặc `/uploads/avatars/` -> `Cache-Control: public, max-age=31536000, immutable`

### 3.5. Cronjob Dọn Dẹp (`cronjob.go`)
- Chu kỳ ticker: Giữ nguyên `7 * 24 * time.Hour` (7 ngày/lần).
- Xóa tất cả file trong `./uploads/temp` có thời gian sửa đổi cũ hơn thời gian quy định một cách an toàn.

---

## 4. Kế Hoạch Kiểm Thử (Verification Plan)
1. **Unit Test Go**:
   - Test `ValidateImageBytes` & `ValidateImageHeader` với file hợp lệ (JPEG, PNG, WebP) và file giả mạo (đổi đuôi `.txt`, `.php`, `.svg` thành `.png`).
   - Test `UploadAvatar` với resize tự động và dọn dẹp file cũ.
   - Test Rate Limiter của `MobileUploadController` (gửi vượt ngưỡng bị chặn 429).
2. **API Integration Test**:
   - Kiểm tra các tiêu đề HTTP phản hồi (`X-Content-Type-Options`, `Cache-Control`) khi truy cập `/uploads/questions/...` và `/uploads/temp/...`.
3. **Frontend E2E / Component Test**:
   - Kiểm tra `MobileQrUploadModal.tsx`, `page.tsx` hiển thị thông báo lỗi rõ ràng nếu ảnh không đúng định dạng.
