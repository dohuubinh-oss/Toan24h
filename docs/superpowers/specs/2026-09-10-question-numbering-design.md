# Thiết kế Đếm Số Thứ Tự và Hiển thị Câu hỏi Chùm (Dashboard Question Creator)

## 1. Mục tiêu & Bối cảnh
Trong trang tạo câu hỏi (`/dashboard/questions/create`), khi giáo viên nhập hoặc chỉnh sửa các câu hỏi (bao gồm câu đơn và câu hỏi chùm):
- Trước đây: Hệ thống đếm tổng toàn bộ câu hỏi con (flatten), dẫn đến câu hỏi chùm bị tính nhiều lần vào tổng số câu.
- Mục tiêu mới: Câu hỏi chùm chỉ tính là **1 câu hỏi lớn** trong tổng số câu hỏi. Hiển thị rõ số thứ tự câu lớn và chỉ số tiến độ câu con bên trong badge câu hỏi chùm theo **Phương án 3**.

## 2. Quy chuẩn Hiển thị (Phương án 3)
1. **Tổng số câu hỏi (Total Questions / Total Blocks):**
   $$N = \text{questionBlocks.length}$$
2. **Số thứ tự câu lớn:**
   $$\text{Câu } (currentBlockIndex + 1)$$
   Ví dụ: `CÂU 9`
3. **Hiển thị Badge loại câu hỏi:**
   - Nếu là câu đơn (`!isGroup`): Không hiện badge chùm.
   - Nếu là câu hỏi chùm (`isGroup === true` hoặc `currentBlock.questions.length > 1`):
     Badge hiển thị: `CÂU HỎI CHÙM (y/M)`
     Trong đó:
     - $y = currentQuestionIndex + 1$ (thứ tự câu con hiện tại)
     - $M = currentBlock.questions.length$ (tổng số câu con trong chùm)
     Ví dụ: `CÂU HỎI CHÙM (1/3)`
4. **Mẫu số tổng:**
   `/ N` (Ví dụ: `/ 9`)
5. **Ví dụ tổng thể giao diện thanh Floating Bar:**
   - Câu đơn thứ 3 trong 9 câu:
     `«  ‹  CÂU 3  / 9  ›  »`
   - Câu con thứ 2 trong chùm câu 9 (có 3 câu con) trong tổng số 9 câu:
     `«  ‹  CÂU 9  [CÂU HỎI CHÙM (2/3)]  / 9  ›  »`

## 3. Quy chuẩn Điều hướng & Tương tác
- **Nút `‹` (Prev)**: Lùi lại 1 câu con (nếu đang ở đầu câu chùm thì lùi về câu con cuối của block trước). Disable khi đang ở block 0, subQuestion 0.
- **Nút `›` (Next)**: Tiến tới 1 câu con (nếu đang ở cuối câu chùm thì sang block tiếp theo). Disable khi đang ở block cuối, subQuestion cuối.
- **Nút `«` (First / Prev Block)**: Nhảy về câu hỏi đầu tiên của block trước đó (hoặc nhảy về Block 1).
- **Nút `»` (Last / Next Block)**: Nhảy tới câu hỏi đầu tiên của block tiếp theo (hoặc nhảy về Block cuối).
- **Nút Thùng rác (Delete)**: Xóa câu con hiện tại. Nếu block chỉ còn 1 câu con thì xóa toàn bộ block; cập nhật lại state index an toàn.

## 4. Phạm vi File Cần Thay đổi
1. `frontend/src/app/(fullscreen)/dashboard/questions/create/page.tsx`
2. `frontend/src/components/questions/creator/JsonInputSection.tsx` (nếu có props liên quan)
