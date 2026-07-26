# Design Specification: Nút Bài Giảng Trong Chế Độ Luyện Tập (Practice Mode)

## 1. Bối cảnh (Context)
Học sinh khi làm bài tập/bài thi ở chế độ luyện tập (practice mode) đôi khi quên kiến thức và cần xem lại lý thuyết. Để hỗ trợ trải nghiệm học tập tốt hơn mà không bị tính là gian lận, hệ thống cần cung cấp một liên kết trực tiếp để học sinh mở bài giảng tương ứng với bài luyện tập.

## 2. Mục tiêu (Goals)
- Cung cấp một nút "Bài Giảng" trong màn hình làm bài ở chế độ luyện tập (Practice).
- Cho phép người dùng chuyển qua đọc lý thuyết (bài giảng liên kết) và dễ dàng quay trở lại bài thi.
- Không làm mất trạng thái làm bài (các câu đã chọn) khi quay lại.

## 3. Thiết kế giải pháp (Solution Design)

### 3.1. Giao diện (UI/UX)
- **Vị trí nút:** Trong component `MultipleChoiceQuestion` và `EssayQuestion`, nút "Bài Giảng" (sử dụng icon Book/Library) sẽ được đặt ngay sau nhãn "Câu hỏi X" và trước nút "Đánh dấu".
- **Điều kiện hiển thị:**
  - `examType === 'practice'`
  - Có tồn tại `lectureId` được truyền vào component.

### 3.2. Luồng xử lý (Data Flow & Navigation)
- **Từ trang bài thi:** 
  - Trang `/dashboard/exams/[id]/take` hoặc tương tự sẽ lấy `lectureId` từ object `exam`.
  - Truyền `lectureId` xuống dưới qua Props cho component câu hỏi.
  - Khi click nút "Bài Giảng", lưu path hiện tại vào tham số (query param) `?returnUrl=` hoặc vào `sessionStorage` để có thể điều hướng ngược lại.
  - Chuyển hướng sang trang bài giảng: `/dashboard/lectures/[lectureId]`.

- **Tại trang Bài giảng (`/dashboard/lectures/[id]`):**
  - Kiểm tra nếu query param có `returnUrl` (hoặc kiểm tra `sessionStorage`).
  - Nếu có, render một nút nổi (Floating action) hoặc nút ở thanh tiêu đề có nhãn "Trở về bài thi".
  - Khi click "Trở về bài thi", router sẽ điều hướng ngược về `returnUrl`.

### 3.3. Bảo toàn trạng thái (State Preservation)
- Theo logic hiện tại, hệ thống thi của chúng ta (có thể) đã lưu tự động các thay đổi vào backend (auto-save mỗi khi user check đáp án) thông qua API hoặc Context. 
- Khi người dùng điều hướng qua `router.push()` và quay lại bằng `router.back()` hoặc URL cũ, trạng thái mới nhất từ server sẽ được load lại. 

## 4. Các thay đổi dự kiến (Expected Changes)
1. Cập nhật Props của `MultipleChoiceQuestion` và `EssayQuestion` thêm `lectureId?: string`.
2. Sửa UI tại 2 component trên để hiển thị nút khi thỏa mãn điều kiện.
3. Truyền `lectureId` từ trang thi `(fullscreen)/exam/[id]/take/page.tsx` (hoặc trang practice) xuống các component câu hỏi.
4. Cập nhật trang `/dashboard/lectures/[id]/page.tsx` để đọc `returnUrl` (qua `searchParams`) và render nút "Trở về bài thi".

## 5. Rủi ro & Trade-offs
- **State reset:** Nếu bài làm chưa được sync lên server ngay lập tức khi click đáp án, việc chuyển trang (navigate) có thể làm reset bài làm. 
  - *Mitigation:* Đảm bảo các hàm select đáp án đều trigger API save, hoặc sử dụng LocalStorage/Context persistent nếu cần. Đối với chế độ practice hiện tại, thường mỗi câu làm xong sẽ có call API hoặc lưu local. Thiết kế này dựa trên giả định data đã được bảo toàn.

## 6. Self-Review
- [x] Placeholder scan: Không có TBD.
- [x] Internal consistency: Thiết kế thống nhất giữa luồng đi và luồng về.
- [x] Scope check: Phạm vi nhỏ, đủ cho 1 lần implement.
- [x] Ambiguity check: Cơ chế điều hướng đã rõ ràng (dùng query param).
