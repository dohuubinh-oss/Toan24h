# Thiết Kế Cơ Chế Cộng Điểm Tích Luỹ & Đua Top Tuần (Weekly Leaderboard XP)

## 1. Mục Tiêu & Tổng Quan
Xây dựng hệ thống điểm thưởng tích luỹ (XP) và Bảng Xếp Hạng Đua Top Tuần cho nền tảng toan6789.vn nhằm tạo động lực học tập, duy trì thói quen học tập đều đặn (streaks) và tạo sự cạnh tranh lành mạnh giữa các học sinh theo từng khối lớp.

---

## 2. Quy Tắc Cộng Điểm Tích Luỹ (XP Earning Rules)

| Nguồn hoạt động | Công thức tính điểm | Quy tắc chống cày ảo / Spam |
| :--- | :--- | :--- |
| **Đề thi (Exams)** | `Điểm số bài thi (thang 10) × 10` *(Tối đa: 100 XP / đề)* | Chỉ tính theo **điểm số cao nhất**. Nếu làm lại đạt điểm cao hơn, cộng phần chênh lệch `(Điểm mới - Điểm cũ) × 10`. |
| **Bài thực hành (Practices)** | `Điểm số bài tập (thang 10) × 5` *(Tối đa: 50 XP / bài)* | Chỉ tính theo **điểm số cao nhất**. Nếu làm lại đạt điểm cao hơn, cộng phần chênh lệch `(Điểm mới - Điểm cũ) × 5`. |
| **Học Bài giảng (Lectures)** | `+20 XP` khi hoàn thành bài học | Mỗi bài giảng chỉ nhận điểm **1 lần duy nhất**. |
| **Thưởng Chuyên cần (Daily Streak)** | `+10 XP` cho ngày học đầu tiên có hoạt động | Duy trì liên tục 7 ngày trong tuần: thưởng thêm `+50 XP`. |

---

## 3. Cơ Chế Bảng Xếp Hạng Top Tuần (Weekly Leaderboard)

### 3.1. Chu kỳ xếp hạng
- **Bắt đầu**: 00:00:00 Thứ Hai hàng tuần (giờ Việt Nam, UTC+7).
- **Kết thúc**: 23:59:59 Chủ Nhật hàng tuần.
- **Reset điểm tuần**: Vào 00:00:00 Thứ Hai, chỉ số `weekly_xp` của toàn bộ học sinh được reset về `0`.
- **Tổng XP trọn đời (`lifetime_xp`)**: Được bảo lưu vĩnh viễn trên hồ sơ học sinh để xác định Cấp độ (Level).

### 3.2. Phạm vi xếp hạng
- Bảng xếp hạng phân loại độc lập theo **Khối lớp** của học sinh (Lớp 5, 6, 7, 8, 9).
- Top 1, Top 2, Top 3 mỗi khối nhận huy hiệu biểu trưng (Vàng, Bạc, Đồng) và vinh danh trên trang chủ / dashboard học sinh.

---

## 4. Mô Hình Dữ Liệu (Data Schema)

### 4.1. Bảng User / Profile bổ sung trường:
- `lifetime_xp` (int, default 0): Tổng điểm tích lũy trọn đời.
- `weekly_xp` (int, default 0): Điểm tích lũy trong tuần hiện tại.
- `current_streak` (int, default 0): Số ngày học liên tục.
- `last_active_date` (date/timestamp): Ngày gần nhất học sinh có hoạt động học.

### 4.2. Bảng Lịch sử Điểm (`xp_transactions`):
- `id` (UUID / Serial)
- `user_id` (Foreign Key)
- `source_type` ('exam' | 'practice' | 'lecture' | 'streak')
- `source_id` (ID bài thi, bài tập hoặc bài giảng)
- `xp_amount` (int): Số điểm XP được cộng.
- `created_at` (timestamp)

---

## 5. Luồng Xử Lý (Logic Flow)

1. **Khi học sinh nộp bài thi / bài tập**:
   - Backend truy vấn điểm số cao nhất trước đó của học sinh cho bài thi này (`previous_highest_score`).
   - Tính toán:
     - Nếu chưa làm bao giờ: `delta_xp = current_score * factor`
     - Nếu đã làm trước đó: `delta_xp = max(0, current_score - previous_highest_score) * factor`
   - Nếu `delta_xp > 0`:
     - Cập nhật `users.weekly_xp += delta_xp`
     - Cập nhật `users.lifetime_xp += delta_xp`
     - Ghi log vào `xp_transactions`.
   - Kiểm tra ngày học để cập nhật `current_streak` và `last_active_date`. Thưởng `+10 XP` nếu là hoạt động đầu tiên trong ngày.
   - API trả về kết quả kèm `earned_xp` và `streak_updated` để Frontend hiển thị thông báo chúc mừng.

2. **Cron Job reset Top Tuần**:
   - Chạy định kỳ vào 00:00 Thứ Hai hàng tuần:
     - Lưu snapshot bảng xếp hạng tuần vừa kết thúc vào bảng lưu trữ / vinh danh.
     - Reset `weekly_xp = 0` cho toàn bộ học sinh.
