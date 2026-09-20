# Thiết Kế Liên Kết Bài Giảng Với Tác Giả & Tính Năng Tải Ảnh Đại Diện (Avatar Upload)

## 1. Mục Tiêu & Tổng Quan
1. **Liên kết Bài giảng & Tác giả**: Thay thế dữ liệu mock (`Thầy Nguyễn Văn A`) bằng tác giả thật đã tạo hoặc được chỉ định biên soạn bài giảng.
2. **Tải ảnh đại diện (Avatar Upload)**: Cho phép mọi người dùng (Học sinh, Giáo viên, Admin) tải ảnh đại diện từ thiết bị cá nhân tại trang `/profile`.
3. **Quy tắc Fallback**: Đối với các bài giảng cũ chưa có thông tin tác giả, hiển thị tác giả mặc định là **"Nhóm Toan6789"**.

---

## 2. Thiết Kế Chi Tiết: Liên Kết Bài Giảng & Tác Giả

### 2.1. CSDL & Backend
* **Model `Lecture`** (`backend/internal/models/lecture.go`):
  * Thêm cột `AuthorID *uuid.UUID` (`gorm:"type:uuid;index" json:"authorId,omitempty"`).
  * Quan hệ `Author *User` (`gorm:"foreignKey:AuthorID" json:"author,omitempty"`).
* **Tạo / Sửa bài giảng** (`LectureService` / `LectureController`):
  * Khi Giáo viên tạo bài: Gán `AuthorID = currentUserID` từ JWT token.
  * Khi Admin tạo bài: Cho phép nhận `authorId` được chỉ định từ payload (hoặc mặc định là `currentUserID`).
* **Truy vấn bài giảng**:
  * Khi gọi API `GetLectureByID` và `GetLecturesByGrade`: Tự động Preload quan hệ `Author` để trả về thông tin `fullName`, `role`, `telegramAvt`, `avatarUrl`.

### 2.2. Giao diện (Frontend)
* **Form tạo bài giảng** (`LectureBasicSettings.tsx`):
  * Nếu người dùng là **Admin**: Hiển thị trường chọn *"Giáo viên biên soạn"* (lấy danh sách từ `GET /api/v1/users?role=teacher`).
* **Header bài giảng** (`LectureHeader.tsx`):
  * **Tên tác giả**:
    * Nếu có `author`: Hiển thị `Thầy/Cô [Họ và tên]` (ví dụ: `Thầy Nguyễn Văn Nam` hoặc `Cô Lê Thị Mai`).
    * Nếu không có `author` (bài giảng cũ): Hiển thị **"Nhóm Toan6789"**.
  * **Avatar tác giả**:
    * Nếu có avatar upload / avatar Telegram: Hiển thị ảnh đại diện thật.
    * Nếu chưa có ảnh: Hiển thị vòng tròn chữ cái đầu kèm gradient tinh tế.

---

## 3. Thiết Kế Chi Tiết: Tải Ảnh Avatar Tại Trang Profile (`/profile`)

### 3.1. API Backend
* **Endpoint**: `POST /api/v1/users/me/avatar` (Yêu cầu xác thực Auth).
* **Dung lượng tối đa**: 5MB.
* **Định dạng cho phép**: `.jpg`, `.jpeg`, `.png`, `.webp`.
* **Thư mục lưu trữ**: `./uploads/avatars/`.
* **Xử lý**:
  * Lưu file với tên ngẫu nhiên UUID: `uuid + ext`.
  * Cập nhật trường `telegram_avt` (hoặc `avatar_url`) trong bảng `users`.
  * Trả về URL ảnh mới: `{"status": "success", "data": {"avatarUrl": "/uploads/avatars/xxx.png"}}`.

### 3.2. Giao diện Người Dùng (`ProfilePage.tsx`)
* Thêm nút tròn icon Camera ở góc dưới Avatar của User.
* Khi nhấn: Mở file picker (`<input type="file" accept="image/*" />`).
* Hiển thị trạng thái đang tải lên (loading spinner).
* Sau khi tải lên thành công:
  * Cập nhật avatar trên giao diện tức thì.
  * Cập nhật `localStorage` (`user`) và thông báo Toast chúc mừng.
