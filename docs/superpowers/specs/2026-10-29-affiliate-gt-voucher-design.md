# Thiết kế Hệ thống Mã giới thiệu (GT Voucher) & Hoa hồng Đối tác

## 1. Bối cảnh & Mục đích (Intent & Why)
Xây dựng cơ chế tiếp thị liên kết (Affiliate / Referral) tự động cho nền tảng Toán 6789 (toan6789.vn) nhằm:
- Khuyến khích giáo viên (Teacher), cộng tác viên (Affiliate) và quản trị viên (Admin) chia sẻ nền tảng đến học sinh.
- Cung cấp ưu đãi thiết thực cho học sinh khi đăng ký qua mã giới thiệu.
- Tự động hóa việc ghi nhận doanh thu và chia sẻ hoa hồng mỗi khi học sinh nạp tiền/mua gói học, chốt sổ định kỳ vào đầu mỗi tháng theo nguyên tắc minh bạch, tối giản.

---

## 2. Mục tiêu & Phi mục tiêu (Goals, Non-goals, Anti-goals)

### Mục tiêu (Goals)
1. **Cấp mã tự động**: Mỗi tài khoản có vai trò `admin`, `teacher`, `affiliate` được cấp duy nhất một mã voucher bắt đầu bằng tiền tố `GT` (ví dụ `GT886912`), không có thời hạn hết hạn (trọn đời).
2. **Quyền lợi học sinh**: Học sinh đăng ký mới kèm mã `GT...` được nhận ngay **1 tháng VIP** miễn phí.
3. **Chia sẻ hoa hồng trọn đời**: Học sinh đăng ký qua mã sẽ gắn chặt với người giới thiệu. Mọi lần nạp tiền của học sinh đó đều tự động chia hoa hồng:
   - **Đối tác (Affiliate)**: 30% giá trị nạp
   - **Giáo viên (Teacher)**: 60% giá trị nạp
   - **Quản trị viên (Admin)**: 70% giá trị nạp
4. **Theo dõi dòng tiền trong `User`**:
   - `commission_balance`: Hoa hồng chưa thanh toán (tích lũy trong tháng hiện tại).
   - `total_commission_received`: Tổng số tiền hoa hồng đã nhận (lũy kế qua các tháng).
5. **Chốt sổ tự động hàng tháng**: Đúng `00:00:00` ngày đầu tiên mỗi tháng (ngày mùng 1), hệ thống tự động:
   `total_commission_received += commission_balance` và reset `commission_balance = 0`.
6. **Giao diện trang cá nhân (Profile / Account Settings)**: Hiển thị khối "Mã giới thiệu & Hoa hồng" gọn gàng gồm mã `GT`, nút sao chép, số dư chờ nhận tháng này và tổng tiền đã nhận.

### Phi mục tiêu (Non-goals)
- Không làm cổng rút tiền tự động qua ngân hàng hay kết nối ví điện tử rút tiền. (Admin thực hiện chuyển khoản thủ công cho đối tác dựa trên số liệu chốt sổ).
- Không thêm bộ lọc phức tạp Tháng/Năm trên giao diện để tránh rườm rà.

### Anti-goals
- Không để xảy ra tình trạng một tài khoản nhận nhiều hơn 1 mã giới thiệu.
- Không để xảy ra gian lận tự giới thiệu (tự nhập mã của chính mình).
- Không làm gián đoạn luồng thanh toán chính của học sinh qua PayOS nếu xử lý hoa hồng gặp lỗi (phải có transaction an toàn).

---

## 3. Ràng buộc kỹ thuật (Constraints)
- Backend: Go (Gin, GORM, PostgreSQL `toan24h`).
- Frontend: Next.js 16 (App Router, Tailwind CSS, Lucide icons).
- Phù hợp với `PRODUCT.md` và `DESIGN.md`.
- Tuyệt đối tuân thủ chính sách: Không tự ý deploy lên VPS; hoạt động trong ranh giới repo `/Users/modeptrai/Desktop/toan6789.vn`.

---

## 4. Đặc tả chi tiết (System Specification)

### 4.1. Cơ sở dữ liệu (Database Schema)

#### Bổ sung trường trong bảng `users`
- `referral_code`: `varchar(50)` (Unique index, null cho học sinh, bắt đầu bằng `GT` cho teacher/admin/affiliate).
- `referrer_id`: `uuid` (Khoá ngoại tham chiếu đến `users.id`, lưu người đã giới thiệu học sinh này).
- `commission_balance`: `bigint` / `int` (Mặc định 0, lưu số tiền hoa hồng đang chờ thanh toán tháng này bằng VNĐ).
- `total_commission_received`: `bigint` / `int` (Mặc định 0, lưu tổng số tiền hoa hồng đã được chốt sổ/thanh toán).

#### Bảng `vouchers` (Tận dụng bảng hiện có)
- `code`: `varchar(50)` (Ví dụ `GT688921`, Unique index, uppercase).
- `affiliate_id`: `uuid` (Tham chiếu đến `users.id`).
- `free_months`: `1` (Học sinh nhận 1 tháng VIP).
- `commission_percent`: `30.0` (affiliate), `60.0` (teacher), `70.0` (admin).
- `max_uses`: `0` (Không giới hạn).
- `expires_at`: `NULL` (Không bao giờ hết hạn).
- `is_active`: `true`.

#### Bảng `commission_transactions` (Lưu vết giao dịch hoa hồng)
- `id`: `uuid` (Primary Key).
- `order_code`: `bigint` (OrderCode từ bảng `transactions`).
- `referrer_id`: `uuid` (Người nhận hoa hồng).
- `student_id`: `uuid` (Học sinh nạp tiền).
- `student_amount`: `int` (Số tiền học sinh nạp).
- `commission_rate`: `float32` (30, 60, hoặc 70).
- `commission_amount`: `int` (Số tiền hoa hồng tính được).
- `status`: `varchar(20)` (`pending` hoặc `settled`).
- `created_at`: `timestamp`.

---

### 4.2. Luồng nghiệp vụ (Business Logic)

#### Luồng 1: Tự động cấp mã `GT...` cho tài khoản
- Khi tạo tài khoản mới có vai trò `admin`, `teacher`, `affiliate` (hoặc nâng quyền):
  - Sinh mã `GT` + 6 ký tự số/chữ ngẫu nhiên (ví dụ: `GT` + 6 chữ số: `GT729104`).
  - Đảm bảo mã chưa tồn tại trong `vouchers` và `users`.
  - Tạo 1 bản ghi trong `vouchers` gắn với `user.id` và `commission_percent` tương ứng.
  - Cập nhật `user.referral_code = code`.
- Đối với các tài khoản cũ đã có sẵn: Chạy hàm migration lúc khởi động backend, tự động quét và cấp mã cho những tài khoản chưa có `referral_code`.

#### Luồng 2: Học sinh đăng ký tài khoản với mã `GT...` (Hỗ trợ cả Form đăng ký & Google Sign-In)
- **Cách 1 - Nhập form truyền thống**: Học sinh nhập mã vào ô "Mã giới thiệu / Khuyến mãi" tại trang `/register` (hoặc link chia sẻ `toan6789.vn/register?ref=GTxxxxxx` tự động điền sẵn mã).
- **Cách 2 - Đăng ký nhanh với Google**: Khi học sinh truy cập qua link giới thiệu `?ref=GTxxxxxx` và bấm nút "Đăng nhập bằng Google", hệ thống gửi kèm mã `refCode` lên endpoint `/api/v1/auth/google`.
- Backend xử lý (áp dụng cho cả 2 cách đối với tài khoản học sinh mới):
  - Kiểm tra mã `GT...`:
    - Nếu hợp lệ: Cấp ngay **1 tháng VIP** cho học sinh (`ExpiresAt = now + 1 month`).
    - Gắn `user.referrer_id = voucher.affiliate_id` (Lưu vết vĩnh viễn người giới thiệu).
    - Tạo bản ghi `voucher_usages`.

#### Luồng 3: Học sinh nạp tiền / mua gói học (Webhook PayOS)
- Khi webhook nhận tín hiệu thanh toán thành công (`payload.Data.Code == "00"`):
  - Kích hoạt gói VIP cho học sinh như hiện tại.
  - Kiểm tra nếu `student.referrer_id != nil`:
    - Tìm tài khoản người giới thiệu `referrer`.
    - Xác định tỷ lệ hoa hồng dựa trên vai trò của `referrer`:
      - `affiliate`: 30%
      - `teacher`: 60%
      - `admin`: 70%
    - Tính số tiền hoa hồng: `commissionAmount = int(float64(tx.Amount) * rate / 100.0)`.
    - Cập nhật số dư trong cùng DB Transaction:
      `referrer.commission_balance += commissionAmount`.
    - Ghi bản ghi vào `commission_transactions`.

#### Luồng 4: Cronjob chốt sổ đầu tháng (Monthly Settlement)
- Lên lịch chạy định kỳ vào `00:00:00` ngày 01 hàng tháng:
  - Quét tất cả `users` có vai trò `admin`, `teacher`, `affiliate` và `commission_balance > 0`.
  - Thực hiện:
    `user.total_commission_received += user.commission_balance`
    `user.commission_balance = 0`
  - Đánh dấu các bản ghi `commission_transactions` trong tháng trước sang trạng thái `settled`.
  - Ghi log đối soát rõ ràng: Ngày giờ, số lượng tài khoản, tổng số tiền chốt sổ.

---

### 4.3. Giao diện người dùng (Frontend UI)

#### Vị trí: Trang Quản lý tài khoản (`/profile` hoặc trang cá nhân của Dashboard)
- **Điều kiện hiển thị**: Chỉ hiển thị khối này nếu `user.role` là `admin`, `teacher`, hoặc `affiliate`. Học sinh (`student`) sẽ không thấy.
- **Thẻ thông tin "Chương trình Đối tác & Giới thiệu"**:
  - **Mã giới thiệu**: Badge to rõ `GTxxxxxx` kèm nút bấm "Sao chép mã" (Copy) tiện lợi.
  - **Tỷ lệ hoa hồng của bạn**: Hiển thị phần trăm (ví dụ: `60% cho Giáo viên`).
  - **Số dư hoa hồng tháng này**: Số tiền VNĐ nổi bật (màu xanh lá/primary), ghi chú `Chốt sổ vào ngày 01 hàng tháng`.
  - **Tổng hoa hồng đã nhận**: Số tiền lũy kế đã chốt sổ qua các tháng.

---

## 5. Quyết định kỹ thuật của Người xây dựng (Decisions left to builder)
- Format mã: Dùng `GT` + 6 chữ số ngẫu nhiên ngẫu nhiên để dễ nhớ và học sinh dễ gõ trên điện thoại.
- Kiểm tra trùng: Thử tối đa 5 lần sinh mã ngẫu nhiên; nếu trùng thì thử lại trước khi lưu.
- Xử lý Cronjob: Dùng Goroutine hẹn giờ chạy hàng tháng trong Go backend, tính toán thời gian `time.Until(nextMonthFirstDay)`.
