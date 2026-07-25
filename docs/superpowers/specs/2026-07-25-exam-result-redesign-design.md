# Thiết kế lại Giao diện Trang Kết quả Bài thi

## 1. Tổng quan
Trang Kết quả bài thi hiện tại (`/exam/[id]/result`) đang sử dụng giao diện dạng danh sách dài với `ResultDetailCard` để hiển thị lần lượt tất cả các câu hỏi. Mục tiêu của việc thiết kế lại là để tái sử dụng bộ khung giao diện của trang "Làm bài thi" (`/exam/[id]/take`). Việc này sẽ tạo ra một trải nghiệm đồng nhất: việc xem kết quả sẽ giống hệt như lúc đang làm bài, sử dụng thanh điều hướng (sidebar) bên cạnh và khu vực hiển thị nội dung chính để tập trung xem xét từng câu hỏi một.

## 2. Kiến trúc & Các Component Dùng chung
Để đạt được giao diện thống nhất mà không làm file code trở nên quá phức tạp, chúng ta sẽ tách bộ khung chung ra thành các Component dùng chung.

### 2.1 ExamWorkspaceLayout
- **Mục đích:** Là một Component bọc ngoài, cung cấp bố cục 2 cột chính: Thanh bên (Sidebar) và Khu vực Nội dung chính (Main Content).
- **Tham số (Props):**
  - `sidebarTopContent`: Khu vực phía trên thanh điều hướng (VD: Đồng hồ bấm giờ cho chế độ "làm bài", Vòng tròn Tổng điểm cho chế độ "xem kết quả").
  - `sidebarGrid`: Khu vực hiển thị Component lưới câu hỏi `QuestionMapSidebar`.
  - `mainContent`: Khu vực hiển thị nội dung câu hỏi hiện tại đang chọn.
  - `footerContent`: Khu vực chân trang (Chứa nút "Câu trước" / "Câu tiếp").

### 2.2 QuestionMapSidebar
- **Mục đích:** Hiển thị lưới chứa các ô số thứ tự câu hỏi để học sinh bấm vào chuyển câu nhanh.
- **Thay đổi cần làm:**
  - Thêm một biến (prop) `mode`: `"take"` (Làm bài) hoặc `"result"` (Xem kết quả).
  - **Chế độ Làm bài (`take`):** Đổi màu ô dựa trên việc học sinh đã trả lời câu đó hay chưa.
  - **Chế độ Kết quả (`result`):** Đổi màu ô dựa trên tính đúng sai: Đúng (Xanh lá), Sai (Đỏ), hoặc Đang chờ chấm/câu Tự luận (Vàng/Cam).

### 2.3 MultipleChoiceQuestion & EssayQuestion
- **Thay đổi cần làm:**
  - Thêm biến `readonly` (kiểu boolean: true/false).
  - **Khi Readonly = true (Chỉ xem):**
    - Vô hiệu hoá tất cả các thao tác nhập (chọn đáp án, tải ảnh lên).
    - Tô sáng đáp án đúng bằng màu Xanh lá.
    - Nếu học sinh chọn sai, tô sáng đáp án học sinh đã chọn bằng màu Đỏ.
    - Hiển thị phản hồi và giải thích chi tiết của AI ở bên dưới câu hỏi.
    - Hiển thị nút "Kháng cáo" đối với các câu hỏi Tự luận.

## 3. Luồng dữ liệu & Trạng thái
### 3.1 Quản lý trạng thái ở trang Kết quả
- **Tải dữ liệu:** Vẫn gọi API `getExamResultById` như cũ.
- **Xử lý dữ liệu:** Mảng `Details` (Chi tiết bài làm) trả về từ API sẽ được chuyển đổi thành các bộ nhớ đệm (dictionary):
  - `studentAnswers: { [questionId: string]: string }` (Lưu lại những gì học sinh đã chọn/nhập).
  - `questionFeedback: { [questionId: string]: { isCorrect: boolean, aiExplanation: string, errorLocation: any, score: number } }` (Lưu phản hồi của AI).
- **Trạng thái điều hướng:** Dùng biến `currentQuestionIndex` (giống như ở trang làm bài) để cho phép dùng nút "Câu trước" và "Câu tiếp".

### 3.2 Lắp ráp các Component lại với nhau
- Tại trang `/exam/[id]/result/page.tsx`:
  - Gọi sử dụng `ExamWorkspaceLayout`.
  - Truyền `ResultScoreCircle` vào vị trí `sidebarTopContent`.
  - Khi người dùng bấm vào một câu hỏi ở thanh bên, `currentQuestionIndex` sẽ cập nhật, và phần nội dung chính sẽ hiển thị câu hỏi tương ứng dưới chế độ `readonly={true}`, đồng thời nạp sẵn đáp án cũ của học sinh và phần giải thích của AI.

## 4. Xử lý lỗi & Các trường hợp đặc biệt
- **Đang xử lý kết quả:** Nếu bài thi vẫn đang được AI chấm hoặc không tìm thấy kết quả, sẽ hiển thị màn hình chờ/lỗi (phần này đã code sẵn, chỉ cần giữ nguyên).
- **Câu tự luận chưa chấm:** Nếu một câu tự luận chưa được chấm điểm (hoặc cần giáo viên xem xét thủ công), sẽ hiện huy hiệu "Chờ chấm điểm".

## 5. Bảo mật & Tính biệt lập
- Dù giao diện giống nhau, nhưng 2 trang `take/page.tsx` và `result/page.tsx` vẫn là 2 trang Next.js hoàn toàn tách biệt. Điều này đảm bảo API "Nộp bài" không bao giờ bị gọi nhầm ở trang xem Kết quả, giữ an toàn tuyệt đối cho ranh giới giữa việc làm bài và xem bài.
