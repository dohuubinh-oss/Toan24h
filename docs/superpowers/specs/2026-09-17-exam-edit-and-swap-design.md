# Spec Thiết Kế: Tính Năng Sửa Đề Thi & Đổi Câu Hỏi (Exam Edit & Question Swap)

- **Ngày tạo:** 2026-09-17
- **Dự án:** Toan24h (Frontend Next.js App Router + Backend Go/Gin/GORM)
- **Trạng thái:** Chờ Duyệt (Draft Spec)

---

## 1. Mục Tiêu & Phạm Vi (Goal & Scope)

Bổ sung tính năng quản lý đề thi linh hoạt cho giảng viên/admin:
1. **Sửa Đề Thi (Edit Exam):** Cho phép người dùng chỉnh sửa tiêu đề, mã đề, khối lớp, thời gian, loại đề và danh sách câu hỏi của một đề thi đã tồn tại trong ngân hàng đề thi (`/dashboard/exams`), sau đó lưu ghi đè (update) vào database.
2. **Đổi Câu Hỏi (Swap Question):** Trong trang tạo/sửa đề thi (`/dashboard/exams/create`), cho phép đổi một câu hỏi bất kỳ bằng cách chuyển hướng đến ngân hàng câu hỏi (`/dashboard/questions`), chọn câu hỏi mới thay thế, và tự động điều hướng trở lại trang tạo/sửa đề thi với danh sách câu hỏi đã cập nhật.

---

## 2. Kiến Trúc Backend (Backend Design)

### 2.1 API Cập nhật Đề Thi (`PUT /api/v1/exams/:id`)
- **File sửa đổi:**
  - [exam_handler.go](file:///Users/modeptrai/Desktop/Toan24h/backend/internal/handlers/exam_handler.go)
  - [routes.go](file:///Users/modeptrai/Desktop/Toan24h/backend/internal/routes/routes.go)
- **Chi tiết Handler `UpdateExam`:**
  - Lấy `id` từ URL parameter.
  - Bind JSON body vào struct `models.Exam`.
  - Thực hiện kiểm tra sự tồn tại của Exam trong DB.
  - Sử dụng GORM để cập nhật các thông tin của đề thi (`Title`, `ExamCode`, `Grade`, `Duration`, `Cate`, `Type`, `DiffScore`, `QuestionIds`, `LectureID`).
  - Trả về JSON thành công kèm object `Exam` đã cập nhật.
- **Route Registration:**
  - Thêm route `admin.PUT("/exams/:id", handlers.UpdateExam)` trong nhóm route bảo vệ của admin.

---

## 3. Kiến Trúc Frontend (Frontend Design)

### 3.1 Cập nhật Client API Layer
- **File sửa đổi:** [api.ts](file:///Users/modeptrai/Desktop/Toan24h/frontend/src/lib/api.ts)
- Bổ sung hàm `updateExam(id: string, payload: any): Promise<any>` gọi `PUT /exams/:id`.

---

### 3.2 Bổ sung nút Edit tại Ngân hàng Đề thi
- **File sửa đổi:** [ExamTable.tsx](file:///Users/modeptrai/Desktop/Toan24h/frontend/src/components/exams/ExamTable.tsx)
- **Giao diện:**
  - Thêm nút Icon `Edit2` (Màu primary/slate) cạnh nút `Trash2` (Xóa) trong cột **Thao tác**.
- **Hành vi (Event):**
  - Khi click nút Edit: ngăn sự kiện lan truyền (`e.stopPropagation()`), điều hướng người dùng tới:
    `/dashboard/exams/create?id=${exam.id}&qids=${exam.questionIds.join(',')}`.

---

### 3.3 Chỉnh sửa trang Tạo/Sửa Đề Thi
- **File sửa đổi:** 
  - [page.tsx (create exam)](file:///Users/modeptrai/Desktop/Toan24h/frontend/src/app/(fullscreen)/dashboard/exams/create/page.tsx)
  - [ExamQuestionList.tsx](file:///Users/modeptrai/Desktop/Toan24h/frontend/src/components/exams/ExamQuestionList.tsx)
  - [QuestionCard.tsx](file:///Users/modeptrai/Desktop/Toan24h/frontend/src/components/questions/QuestionCard.tsx)

- **Chi tiết xử lý tại `create/page.tsx`:**
  1. **Nạp dữ liệu khi mở trang ở chế độ Sửa (`id` trên URL):**
     - Kiểm tra URL param `id`.
     - Nếu có `id`, gọi `getExamById(id)`. Khi có dữ liệu đề thi từ backend, set state cho `exam` bao gồm `title`, `examCode`, `grade`, `duration`, `cate`, `type`, `lectureId`, và fetch chi tiết các câu hỏi dựa theo `questionIds`.
  2. **Xử lý khi bấm nút "Lưu đề thi":**
     - Nếu URL có `id`: Gọi `updateExam(id, payload)` -> Hiển thị toast thông báo "Cập nhật đề thi thành công!" -> Chuyển về `/dashboard/exams`.
     - Nếu URL không có `id`: Gọi `createExam(payload)` -> Hiển thị toast thông báo "Tạo đề thi mới thành công!" -> Chuyển về `/dashboard/exams`.
  3. **Xử lý nút "Đổi câu hỏi":**
     - Xây dựng callback `handleSwapQuestion(targetQId: string)`.
     - Khi bấm nút "Đổi câu hỏi" ở câu `targetQId`, điều hướng tới:
       `/dashboard/questions?swapFrom=${targetQId}&qids=${currentQids.join(',')}${examId ? '&id=' + examId : ''}`.

- **Chi tiết xử lý tại `QuestionCard.tsx` & `ExamQuestionList.tsx`:**
  - Thêm prop `onSwap?: () => void` vào `QuestionCardProps`.
  - Hiển thị nút **Đổi câu hỏi** (Icon `RefreshCw`, tooltip "Đổi câu hỏi") nằm ngay bên trái nút Xóa (`Trash2`).
  - Truyền prop `onSwap` từ `ExamQuestionList` tới từng `QuestionCard`.

---

### 3.4 Chỉnh sửa trang Ngân hàng Câu hỏi (Chế độ Chọn câu hỏi thay thế)
- **File sửa đổi:** [page.tsx (questions)](file:///Users/modeptrai/Desktop/Toan24h/frontend/src/app/(main)/dashboard/questions/page.tsx)
- **Chi tiết xử lý:**
  1. Đọc các param từ URL: `swapFrom`, `qids`, `id` (nếu sửa đề cũ).
  2. **Giao diện Banner:**
     - Nếu có `swapFrom`, hiển thị 1 Banner thông báo nổi bật ở đầu trang: 
       `"Đang chọn câu hỏi thay thế cho câu hỏi ID: ${swapFrom}. Vui lòng chọn câu hỏi mới bên dưới."` kèm nút "Hủy đổi".
  3. **Thao tác trên từng QuestionCard:**
     - Nếu đang ở chế độ `swapFrom`: Hiển thị thêm nút **"Chọn thay thế"** (Button xanh/indigo) ở thẻ câu hỏi.
     - Khi bấm **"Chọn thay thế"** cho câu hỏi mới `newQId`:
       - Tạo danh sách `newQids` mới bằng cách thay thế vị trí của `swapFrom` bằng `newQId`.
       - Điều hướng về `/dashboard/exams/create?qids=${newQids.join(',')}${id ? '&id=' + id : ''}`.

---

## 4. Kế Hoạch Kiểm Thử (Testing & Verification)

1. **Backend Integration Tests:**
   - Đảm bảo endpoint `PUT /api/v1/exams/:id` hoạt động chính xác với payload hợp lệ và trả về 404 khi `id` không tồn tại.
2. **Kịch bản Sửa đề thi:**
   - Vào `/dashboard/exams` -> Bấm icon Edit ở một đề thi -> Trang `/dashboard/exams/create?id=...` nạp đúng tên, cấu hình và danh sách câu hỏi.
   - Thay đổi thông tin (VD: Tên đề thi, thời gian) -> Bấm "Lưu đề thi" -> Kiểm tra dữ liệu được ghi đè trong database.
3. **Kịch bản Đổi câu hỏi:**
   - Trong trang tạo/sửa đề thi -> Bấm nút "Đổi câu hỏi" ở câu số 2.
   - Trang `/dashboard/questions` mở ra kèm Banner chọn câu thay thế.
   - Chọn câu hỏi mới -> Quay trở lại trang tạo/sửa đề thi -> Câu số 2 đã được thay bằng câu hỏi mới chọn.

---
