# Critique Snapshot: frontend/src/app/(main)/(dashboardStudent)/student/page.tsx

<!-- impeccable:critique-schema 1 -->
- **Target:** `frontend/src/app/(main)/(dashboardStudent)/student/page.tsx`
- **Method:** `dual-agent (A: 710d03ec-5a6d-4008-a444-b9098197131a · B: 3b33c640-6f0e-46a7-9c14-d43f664de85a)`
- **Total Score:** 25 / 40
- **NA Heuristics:** None
- **Severity Count:** P0: 0, P1: 2, P2: 3, P3: 1
- **Date:** 2026-10-30

## 1. Design Health Score (Nielsen's 10 Heuristics)

| # | Heuristic | Score (0-4) | Key Issue |
|---|-----------|:-----------:|-----------|
| 1 | Visibility of System Status | 2 | Chưa có `loading.tsx` cho 4 async promises; khi API lỗi, âm thầm render mock data mà không báo trạng thái offline. |
| 2 | Match System / Real World | 2 | Mock data chứa "Giải tích" (Calculus) không tồn tại ở cấp 2 (Lớp 5-9); nhãn "Tiến độ chương" bị dùng nhầm cho đề thi. |
| 3 | User Control and Freedom | 3 | Modal dismiss hoạt động tốt; tuy nhiên học sinh không thể ghim, đổi hoặc tùy biến đề thi trên hero card. |
| 4 | Consistency and Standards | 3 | Font Lexend và bo góc `rounded-2xl` nhất quán; tuy nhiên phong cách đan xen giữa Material 3 Outlined và arcade gamification (gradient + neon glow). |
| 5 | Error Prevention | 3 | `GradeSelectionModal` chặn tốt tài khoản thiếu lớp; tuy nhiên fallback cứng về Khối 9 nếu cookie thiếu. |
| 6 | Recognition Rather Than Recall | 3 | Huy hiệu và avatar nhận diện tốt; tuy nhiên thiếu hiển thị khối lớp hiện tại trên Header khiến học sinh phải tự nhớ. |
| 7 | Flexibility and Efficiency | 2 | Thiếu lối tắt tăng tốc cho học sinh khá giỏi (ôn lại câu sai, danh sách đề mới nhất, phím tắt). |
| 8 | Aesthetic and Minimalist Design | 3 | Giao diện hiện đại nhưng card hero và thử thách ngày có độ bão hòa màu quá cao, bóng đổ neon lấn át nội dung học tập. |
| 9 | Error Recovery | 2 | Thiếu error boundary và nút tải lại dữ liệu khi kết nối gián đoạn. |
| 10 | Help and Documentation | 2 | Chưa có tooltip giải thích cách tính Cấp độ (Level), thời gian chốt Chuỗi học (Streak) hoặc tiêu chí mở khóa thành tích. |
| **Tổng** | | **25 / 40** | **Chấp nhận được (Acceptable — 62.5%)** |

## 2. Design Specificity Verdict
- **LLM Assessment:** 5.5 / 10. Giao diện mang dáng dấp của một LMS trò chơi hóa thông thường (kiểu Duolingo/Quizizz) hơn là một nền tảng Toán học chuyên sâu K-12. Không có sự hiện diện của công thức KaTeX nào trên trang chủ học sinh, biểu tượng máy tính cầm tay `<Calculator />` không phản ánh học sinh Tiểu học/THCS, và dữ liệu fallback chứa môn "Giải tích" (chỉ học ở cấp 3).
- **Deterministic Scan & Code Evidence:** 17 phát hiện kỹ thuật:
  - 5 bóng đổ tùy biến (arbitrary shadows) và màu RGBA hardcode (`shadow-[0_0_15px_-3px_...]`).
  - 1 lỗi touch target kích thước nhỏ (36px × 36px nút đóng modal trong `PromotionRewardModal`).
  - 6 lỗi trợ năng & ARIA: `<span role="button">` lồng bên trong thẻ `<Link>` ở `StudentTopics`, 2 thanh tiến độ thiếu thuộc tính `role="progressbar"`, icon trang trí thiếu `aria-hidden`.
  - 2 lỗi bố cục di động: `layout.tsx` thiếu `pl-4` khiến màn hình điện thoại bị lệch sát mép trái 0px.

## 3. Priority Issues Summary
- **[P1] Lỗi bố cục di động & Đứt gãy điều hướng Mobile:** Sidebar ẩn trên mobile nhưng không có thanh Bottom Nav hay Drawer; `layout.tsx` bị lệch padding mép trái (0px); `Sidebar.tsx` thiếu link tới Ngân hàng đề thi (`/exams`).
- **[P1] Nghịch lý điểm 10/10 trên Hero Card:** Khi học sinh đạt điểm tuyệt đối 10/10, hệ thống vẫn khuyên "Hãy làm lại để bứt phá đạt điểm tối đa!" thay vì mở khóa đề mới.
- **[P2] Lỗi xung đột cấu trúc tương tác ARIA:** `StudentTopics.tsx` lồng `<span role="button">` bên trong `<Link>`, vi phạm chuẩn W3C; thanh progress bar ở `DailyChallenge` thiếu thuộc tính trợ năng.
- **[P2] Lệch lạc chương trình Toán GDPT 2018 & Thiếu huy hiệu Khối:** Mock data chứa "Giải tích" (Calculus); header thiếu hiển thị khối lớp học sinh đang theo học.
- **[P2] Tương phản văn bản WCAG AA & Bóng đổ Neon:** `text-white/80` trên nền primary chỉ đạt ~3.2:1 (dưới chuẩn 4.5:1); màu bóng vàng đặt nhầm trên icon sấm sét xanh.
- **[P3] Thiếu Suspense Loading Skeleton:** Chưa có file `loading.tsx` cho 4 truy vấn API bất đồng bộ.

## 4. Persona Red Flags
- **Jordan (Lớp 6, Người mới):** Dễ hoang mang khi thấy môn "Giải tích" hoặc bảng xếp hạng 12.000 XP; không biết mình đang ở chế độ lớp mấy vì header không ghi rõ khối lớp.
- **Alex (Lớp 9, Ôn thi Chuyên/Vào 10):** Không tìm thấy link vào Ngân hàng đề thi từ menu Sidebar; bị bảo làm lại đề dù đã đạt điểm 10/10 tuyệt đối.
- **Casey (Học trên điện thoại):** Màn hình bị lệch sát mép trái (0px padding); không có thanh điều hướng menu mobile nào để chuyển sang mục Bài giảng hay BXH; nút đóng modal khó bấm khi đang di chuyển.
