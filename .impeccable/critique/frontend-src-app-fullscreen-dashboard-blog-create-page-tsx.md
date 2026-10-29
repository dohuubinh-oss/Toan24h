# Design Critique Snapshot: Trang Tạo Bài Viết Blog & Video Shorts
**Target:** `frontend/src/app/(fullscreen)/dashboard/blog/create/page.tsx`
**Mode:** Operate Mode (Công cụ Quản trị/Soạn bài Giáo viên & Biên tập viên)
**Date:** 2026-10-28
**Method:** dual-agent (A: 3a17ac42-77e8-48be-b851-f413d8f7ba54 · B: 4510ff00-8497-4e10-bae9-ca0a8ec0cd82)

---

## 1. Design Health Score (Nielsen Heuristics)

| # | Heuristic | Điểm (0-4) | Vấn đề cốt lõi (Key Issue) |
|---|-----------|:----------:|----------------------------|
| 1 | Visibility of System Status | 2 | Có spinner khi OCR, nhưng thiếu chỉ báo lưu nháp thời gian thực và thanh tiến độ tổng thể của playlist. |
| 2 | Match System & Real World | 2 | Thuật ngữ và công thức mặc định bị lệch sang THPT (tích phân, hàm bậc 3, Radian); phơi bày thẻ HTML kỹ thuật (`<div class="step-box">`). |
| 3 | User Control and Freedom | 1 | Không có nút "Lưu nháp"; không có nút Hoàn tác (Undo); nút "Áp dụng mẫu" đè mất nội dung cũ không thể phục hồi. |
| 4 | Consistency and Standards | 3 | Đồng bộ tốt hệ màu Blue/Slate của `DESIGN.md`; tuy nhiên nhiều nút có touch target quá nhỏ (24–28px) vi phạm chuẩn A11y. |
| 5 | Error Prevention | 2 | Thiếu cảnh báo khi rời trang khi chưa lưu (`beforeunload`); không có xác nhận trước khi xóa video Short hoặc ghi đè template. |
| 6 | Recognition Rather Than Recall | 2 | Giáo viên phải tự nhớ cú pháp LaTeX hoặc thẻ HTML; không có bảng bấm phím Casio trực quan; phải chuyển tab để xem trước. |
| 7 | Flexibility and Efficiency | 3 | Trải nghiệm Ctrl+V dán ảnh toàn trang và dán từng thẻ rất mạnh mẽ; nhưng thiếu phím tắt lưu bài (Ctrl+S) và thao tác thu gọn (accordion). |
| 8 | Aesthetic and Minimalist Design | 2 | Bố cục bị phình to theo chiều dọc khi có nhiều video; nhiều box lồng nhau gây rối mắt; hiển thị mã HTML làm mất đi vẻ thanh lịch. |
| 9 | Error Recovery | 2 | Báo lỗi Toast khi thiếu tiêu đề, nhưng khi OCR thất bại lại âm thầm thế bằng công thức mặc định mà không báo rõ lý do ảnh mờ hay lỗi mạng. |
| 10 | Help and Documentation | 2 | Có mô tả gợi ý dưới banner kéo thả, nhưng thiếu bảng tra cứu nhanh cú pháp công thức Toán THCS và hướng dẫn định dạng video chuẩn 9:16. |
| **Tổng** | **Health Score** | **21/40** | **Rating Band: Acceptable (52.5%)** |

---

## 2. Design Specificity Verdict

- **LLM Assessment:** Giao diện đã sở hữu mầm mống đặc thù rất mạnh mẽ nhờ tính năng **Playlist Video Shorts 9:16 kết hợp ghi chú công thức toán học đồng bộ 2 bước** và cơ chế **dán ảnh trực tiếp (Ctrl+V) qua AI OCR**. Tuy nhiên, tính đặc thù đang bị xung đột về mặt học thuật: `toan6789.vn` phục vụ học sinh THCS (Lớp 6-9), nhưng dữ liệu mẫu và template mặc định lại đưa công thức hàm bậc ba, tích phân và đơn vị góc Radian của THPT (Lớp 11-12). Ngoài ra, việc phơi bày mã HTML thô (`<div class="step-box">`) ra ô soạn thảo làm giảm tính chuyên môn của một công cụ EdTech dành cho thầy cô.
- **Deterministic Scan:** Phát hiện 22 lỗi kỹ thuật mã nguồn (0 P0, 8 P1, 10 P2, 4 P3). Trọng yếu gồm: thumbnail rail item trong `ShortsPlaylistStage.tsx` là thẻ `div` thiếu tương tác bàn phím; hàng loạt nút icon thiếu `aria-label`; touch targets nhỏ hơn 44x44px; thiếu thẻ `<form>` ngữ nghĩa; và class không tồn tại `hover:bg-primary-dark`.

---

## 3. Overall Impression
Tính năng mang tính đột phá cao với sự kết hợp giữa Video Shorts 9:16, AI OCR bóc tách công thức Toán từ ảnh và cấu trúc ghi chú đồng bộ 2 bước. Tuy nhiên, giao diện hiện mang nhiều "khoản nợ trải nghiệm" (UX Debt) của một công cụ soạn thảo: thiếu cơ chế lưu an toàn (Auto-save/Draft), tải nhận thức cao khi danh sách kéo dài, và nguy cơ mất dữ liệu khi vô tình ghi đè template.

---

## 4. What's Working
1. **Quy trình tiếp nhận đề bài bằng Dán ảnh (Ctrl+V) & AI OCR:** Việc bắt sự kiện `paste` toàn cục và trên từng thẻ để chuyển ảnh bài toán thành công thức LaTeX giải quyết trực diện điểm nghẽn nhập liệu của giáo viên.
2. **Khung xem trước Rạp học tập (Split Stage Theater):** Tái hiện chuẩn xác bố cục hiện đại: player 9:16 có backdrop mờ, thumbnail rail trực quan và ghi chú đồng bộ có nút sao chép vào sổ tay.
3. **Màu sắc và phông chữ thương hiệu:** Áp dụng triệt để palette Blue 600 (`#2563EB`), Slate 50 (`#F8FAFC`), Outline mờ và phông `Lexend` theo đúng tinh thần Modern Academic.

---

## 5. Priority Issues

### [P0] Thiếu cơ chế Lưu Nháp (Save Draft), Tự động lưu (Auto-save) và Cảnh báo rời trang
- **Why it matters:** Soạn 5 video Shorts có công thức Toán mất 30–45 phút. Tắt trình duyệt hoặc mất mạng sẽ xóa sạch dữ liệu của giáo viên.
- **Fix:** Bổ sung nút "Lưu nháp", tự động lưu `localStorage` (debounced 1.5s), thêm hook `beforeunload`.
- **Suggested command:** `/impeccable harden`

### [P1] Nút "Mẫu chuẩn" ghi đè dữ liệu tàn phá không thể hoàn tác
- **Why it matters:** Bấm nút *"Mẫu chuẩn shorts-blog-layout"* sẽ lập tức đè mất nội dung ghi chú đã soạn mà không có hộp thoại xác nhận hay Undo.
- **Fix:** Bổ sung kiểm tra xác nhận khi ghi chú đã có nội dung, hoặc lưu snapshot để Ctrl+Z hoàn tác.
- **Suggested command:** `/impeccable clarify`

### [P1] Lệch pha phạm vi học thuật: Đưa kiến thức Lớp 12 THPT vào nền tảng Toán THCS Lớp 6-9
- **Why it matters:** Template mặc định, danh mục bài viết (`Bi-Quyet-Thi: Bí quyết thi THPT`) và ví dụ mẫu mang nội dung Tích phân, hàm số bậc 3, góc Radian, làm lệch định vị thương hiệu `toan6789.vn`.
- **Fix:** Chuẩn hóa sang kiến thức Toán 6-9 (Hệ phương trình, Phương trình bậc hai, Căn thức, Hệ thức lượng, đơn vị độ DEG).
- **Suggested command:** `/impeccable clarify`

### [P1] Danh sách thumbnail rail thiếu hoàn toàn khả năng điều hướng bằng bàn phím (A11y)
- **Why it matters:** `ShortsPlaylistStage.tsx` dùng thẻ `div` cho item thumbnail, người dùng bàn phím hoặc công nghệ trợ năng không thể chọn bài học.
- **Fix:** Đổi thành `<button type="button">` hoặc gán `role="button"`, `tabIndex={0}`, `aria-selected`, `onKeyDown`.
- **Suggested command:** `/impeccable clarify`

### [P2] Tải nhận thức cao và phình to trang do thiếu cơ chế Thu gọn (Accordion)
- **Why it matters:** Khi có 4–6 video Shorts, trang kéo dài hơn 3,000px, khiến giáo viên mất phương hướng về cấu trúc tổng thể.
- **Fix:** Thiết kế thẻ bài học theo dạng Accordion: thu gọn còn 60px hiển thị thứ tự, thumbnail và tiêu đề; chỉ mở rộng thẻ đang chỉnh sửa.
- **Suggested command:** `/impeccable layout`

---

## 6. Persona Red Flags
- **Thầy An (Giáo viên dạy Toán 9):** Muốn nhân bản nhanh thẻ bài học nhưng không có nút Duplicate; phải cuộn lên đầu trang liên tục để bấm "Xem trước"; không có phím tắt `Ctrl + S`.
- **Cô Mai (Giáo viên lớn tuổi, ít am hiểu công nghệ):** Không có tính năng Mobile QR Code để chụp ảnh từ điện thoại; hoang mang khi thấy các thẻ HTML thô (`<div class="step-box">`) trong ô ghi chú.
- **Biên tập viên toan6789.vn:** Không thể chọn tác giả bài viết từ giao diện; thiếu quy trình Lưu nháp chờ Trưởng ban chuyên môn duyệt.

---

## 7. Minor Observations & Questions to Consider
- **Minor:** Nút icon có touch target quá nhỏ (~28px); class `hover:bg-primary-dark` bị lỗi không tồn tại; thiếu kiểm tra regex định dạng thời lượng `mm:ss`.
- **Question 1:** *"Điều gì sẽ xảy ra nếu cung cấp chế độ Split-Screen Studio (Trái: Danh sách mẹo - Phải: Xem thử khung Shorts 9:16 tương tác thời gian thực) trên màn hình desktop?"*
- **Question 2:** *"Liệu ta có thể đưa nút 'Quét mã QR từ điện thoại' trực tiếp vào thẻ dán ảnh để thầy cô chụp bài tập viết tay chuyển thẳng lên web?"*
- **Question 3:** *"Thay vì ô textarea HTML thô, nếu có thanh công cụ 'Casio Keypad Palette' cho phép bấm chèn các phím [MENU], [OPTN], [CALC], [ALPHA] thành các phím 3D nổi bật thì sao?"*
