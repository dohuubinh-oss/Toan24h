# Thiết kế: Hợp nhất Đăng nhập Telegram & Khắc phục Cơ chế Xác thực Cookie

**Ngày tạo:** 19-09-2026  
**Chủ đề:** Telegram QR Login Unification, Payload Bug Fix, and Cross-Domain Cookie Synchronization  
**Trạng thái:** Chờ duyệt (Pending User Review)

---

## 1. Mục tiêu (Goals & Objectives)

1. **Hợp nhất giao diện Đăng nhập Telegram**:
   - Xóa bỏ hoàn toàn widget iframe cũ của Telegram (`telegram-widget.js`) để tránh lỗi ngôn ngữ ("Connexion...") và lỗi miền không hợp lệ trên môi trường thử nghiệm.
   - Thay thế bằng một nút duy nhất: **"Đăng nhập với Telegram"** (chuẩn nhận diện thương hiệu Telegram với icon máy bay giấy).
   - Khi người dùng nhấn nút, hiển thị hộp thoại (Modal) quét mã QR được tinh chỉnh:
     - **Xóa bỏ** dòng chữ: *"Quét mã QR bằng điện thoại hoặc bấm nút mở ứng dụng Telegram bên dưới."*
     - **Xóa bỏ** nút: *"Mở ứng dụng Telegram trên Điện thoại"*.
     - **Giữ lại**: Mã QR to rõ nét, logo bot `@toan6789_bot`, 3 bước hướng dẫn tinh gọn, và trạng thái nhận diện đăng nhập tức thì.

2. **Khắc phục triệt để lỗi `Invalid request payload`**:
   - Loại bỏ việc gửi dữ liệu trùng lặp sang endpoint `/auth/telegram-login` sau khi phiên QR đã hoàn tất.
   - Khi nhận kết quả polling `status === 'completed'` từ backend, kích hoạt trực tiếp luồng hoàn tất đăng nhập, lưu trữ phiên người dùng và chuyển hướng ngay lập tức.

3. **Khắc phục lỗi Đăng nhập bằng Mật khẩu không phản hồi / bị đá ngược**:
   - Cấu hình Cookie Cross-Domain giữa Backend (`api.toan6789.vn`) và Frontend (`toan6789.vn`): thiết lập domain `.toan6789.vn`, `Secure: true`, `SameSite: Lax` khi chạy production.
   - Bổ sung ghi đè cookie client (`document.cookie`) trong `authApi.ts` để Next.js Middleware tại `toan6789.vn` luôn đọc được `userRole` và `userGrade`.
   - Hiển thị phản hồi trực quan (Thông báo xanh thành công + hiệu ứng chuyển trang, thông báo đỏ chi tiết khi sai thông tin).

---

## 2. Kiến trúc & Chi tiết Kỹ thuật (Technical Specifications)

### 2.1 Thành phần Frontend (`frontend/`)

1. **`frontend/src/components/auth/TelegramLoginWidget.tsx`**:
   - Xóa bỏ thẻ `<script>` nhúng widget và state `isLocalhost`.
   - Chỉ xuất ra một nút bấm duy nhất:
     ```tsx
     <button
       type="button"
       onClick={startQrSession}
       className="w-full flex items-center justify-center gap-2.5 py-3 px-4 bg-[#24A1DE] hover:bg-[#208ec4] text-white font-semibold rounded-xl shadow-md transition-all text-sm"
     >
       <Send className="w-4 h-4" />
       <span>Đăng nhập với Telegram</span>
     </button>
     ```
   - Trong Modal Popup:
     - Xóa dòng hướng dẫn phụ và nút liên kết mở app.
     - Giữ mã QR trung tâm với kích thước lớn (size 210px), có khung trắng bo góc viền nhẹ.
     - Hiển thị 3 bước hướng dẫn tối giản:
       1. Mở camera điện thoại hoặc app Telegram để quét mã QR.
       2. Nhấn nút **Bắt đầu (Start)** trong bot `@toan6789_bot`.
       3. Máy tính sẽ tự động đăng nhập.
     - Khi `status === 'completed'`: Không gọi `onAuthCallback(user)` dạng request payload; thay vào đó gọi `onSuccess(user)` để chuyển hướng thẳng.

2. **`frontend/src/components/auth/LoginForm.tsx` & `RegisterForm.tsx`**:
   - Cập nhật prop xử lý `onSuccess`:
     ```tsx
     const handleTelegramSuccess = (user: any) => {
       toast.success('Đăng nhập Telegram thành công!');
       if (user.role === 'admin' || user.role === 'teacher') {
         window.location.href = '/dashboard/lectures';
       } else {
         window.location.href = '/lectures';
       }
     };
     ```
   - Trong `onSubmit` (Đăng nhập password):
     - Hiển thị thông báo trạng thái: toast xanh *"Đăng nhập thành công! Đang chuyển hướng..."*.
     - Bổ sung ghi cookie `userRole` và `userGrade` trực tiếp trên client để phòng trường hợp cross-domain cookie bị trễ.

3. **`frontend/src/lib/authApi.ts`**:
   - Trong hàm `login(data)`:
     ```typescript
     if (res.user) {
       document.cookie = `userRole=${res.user.role}; path=/; max-age=86400; SameSite=Lax`;
       if (res.user.grade) {
         document.cookie = `userGrade=${res.user.grade}; path=/; max-age=86400; SameSite=Lax`;
       }
     }
     ```

### 2.2 Thành phần Backend (`backend/`)

1. **Cookie Configuration (`backend/internal/handlers/auth_handler.go` & `auth_telegram.go`)**:
   - Viết hàm trợ giúp thiết lập Cookie dùng chung:
     ```go
     func setAuthCookies(c *gin.Context, accessToken, refreshToken, role, grade string) {
         domain := ""
         secure := false
         if os.Getenv("GIN_MODE") == "release" || strings.Contains(c.Request.Host, "toan6789.vn") {
             domain = ".toan6789.vn"
             secure = true
         }
         c.SetCookie("accessToken", accessToken, 24*60*60, "/", domain, secure, true)
         c.SetCookie("refreshToken", refreshToken, 7*24*60*60, "/", domain, secure, true)
         c.SetCookie("userRole", role, 24*60*60, "/", domain, secure, false)
         c.SetCookie("userGrade", grade, 24*60*60, "/", domain, secure, false)
     }
     ```
   - Sử dụng hàm này ở tất cả các vị trí: `Login`, `Refresh`, `CheckTelegramQRStatus`.

---

## 3. Kế hoạch Kiểm thử & Xác minh (Verification Plan)

1. **Kiểm thử Giao diện (UI Verification)**:
   - Truy cập `/login`: Chỉ thấy đúng 1 nút duy nhất "Đăng nhập với Telegram".
   - Bấm nút: Popup mở ra chứa mã QR to, KHÔNG còn dòng chữ *"Quét mã QR bằng điện thoại hoặc..."* và KHÔNG còn nút *"Mở ứng dụng Telegram trên Điện thoại"*.
2. **Kiểm thử Quét QR Telegram**:
   - Dùng điện thoại quét QR và bấm Start.
   - Kiểm tra log backend: xác thực thành công.
   - Kiểm tra màn hình máy tính: Tự động báo đăng nhập thành công và chuyển vào bài giảng theo đúng vai trò. Không xuất hiện lỗi `Invalid request payload`.
3. **Kiểm thử Đăng nhập Password**:
   - Nhập email/password: Có thông báo phản hồi rõ ràng, chuyển hướng vào hệ thống mượt mà, không bị đá ngược về `/login`.
