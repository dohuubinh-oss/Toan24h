# Thiết kế Thang điểm (Rubric) trong Trang Tạo câu hỏi & Hướng dẫn giải

## 1. Mục tiêu (Goals)
1. Cung cấp giao diện trực quan và tiện dụng cho giáo viên khi tạo hoặc chỉnh sửa câu hỏi trên trang `/dashboard/questions/create`:
   - Hiển thị và cấu hình thang điểm chi tiết cho từng bước giải (`solution_guide.steps[i].point`).
   - Tự động đồng bộ tổng điểm của các bước giải vào trường `Điểm` (`currentQuestion.point`) của câu hỏi và hiển thị gợi ý thông minh trong Sidebar thiết lập.
2. Nâng cấp bộ định dạng hiển thị `formatSolutionGuide`:
   - Hiển thị huy hiệu (badge) thang điểm cho từng bước trong timeline hướng dẫn giải (ví dụ `0.5 điểm`, `1.0 điểm`).
3. Chuẩn hóa quy trình trích xuất câu hỏi từ ảnh đề thi bằng AI (Gemini Vision):
   - AI tự động phân bổ thang điểm cho từng bước giải sao cho tổng điểm các bước khớp chính xác với điểm câu hỏi.

## 2. Kiến trúc & Thành phần (Architecture & Components)

### 2.1. Frontend Model & Types (`types/question.ts`)
- Mở rộng kiểu dữ liệu `SolutionStep` với trường `point?: number | null`.
- Định nghĩa kiểu `StructuredSolutionGuide`:
  ```typescript
  export interface SolutionStep {
    step: number;
    title: string;
    content: string;
    formula?: string | null;
    point?: number | null;
  }

  export interface StructuredSolutionGuide {
    problem?: string;
    steps: SolutionStep[];
    conclusion?: string;
    tips?: string;
  }
  ```

### 2.2. Bộ hiển thị Timeline Hướng dẫn giải (`questionTextFormatter.ts`)
- Khi render các bước giải trong `formatSolutionGuide`:
  - Kiểm tra nếu `item.point` có giá trị > 0:
    Render badge điểm:
    ```html
    <span class="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
      ${item.point} điểm
    </span>
    ```

### 2.3. Khung Soạn thảo Hướng dẫn giải theo bước (`StepByStepSolutionEditor.tsx` & `QuestionEditorSection.tsx`)
- Hỗ trợ 2 chế độ:
  1. **Chế độ Từng bước có Thang điểm (Mặc định khi có cấu trúc object)**:
     - Header: Tiêu đề "Hướng dẫn giải chi tiết theo bước" + Badge tổng điểm: `Tổng thang điểm: X đ (tự động tính)`.
     - Danh sách từng bước:
       - Header bước: `Bước {i}` + Input điểm `[ 0.5 ] đ` + Nút xóa bước.
       - Tên bước (`title`).
       - Nội dung diễn giải (`content` - RichTextEditor mini).
       - Công thức toán (`formula` - KaTeX input).
     - Nút "+ Thêm bước giải" để thêm nhanh bước mới.
     - Ô "Kết luận bài toán" (`conclusion`).
     - Tự động cộng tổng điểm: Khi giáo viên thay đổi điểm ở bất kỳ bước nào, tự động gọi `updateQuestion('point', sumPoints)`.
  2. **Chế độ Văn bản tự do**:
     - Cho phép giáo viên chuyển qua lại với trình soạn thảo RichText tự do nếu không muốn chia theo bước.

### 2.4. Thanh thiết lập câu hỏi (`QuestionSettingsSidebar.tsx`)
- Dưới ô nhập `Điểm`:
  - Nếu câu hỏi đang sử dụng cấu trúc từng bước có điểm, hiển thị dòng ghi chú thân thiện:
    `✨ Tự động tính từ các bước giải ({totalPoints} đ)`
  - Giáo viên vẫn có thể tùy ý sửa thủ công nếu muốn ghi đè.

### 2.5. Backend AI Extractor (`question_extractor.go`)
- Bổ sung quy tắc trong prompt của Gemini Vision:
  - Cấu trúc `solution_guide.steps`:
    `+ "point": float (Thang điểm cho bước này. BẮT BUỘC tổng điểm các bước giải phải bằng điểm của câu hỏi "point", ví dụ: bước 1 là 0.5, bước 2 là 0.5 thì tổng điểm là 1.0)`.

## 3. Tiêu chí nghiệm thu (Acceptance Criteria)
1. **Kiểm thử đơn vị frontend**:
   - `formatSolutionGuide` render đúng badge điểm khi bước giải có `point`.
   - `formatSolutionGuide` không bị lỗi khi `point` là undefined / null / 0.
2. **Kiểm thử tương tác biên tập**:
   - Thêm, sửa điểm, xóa bước giải trong `QuestionEditorSection` phản hồi mượt mà.
   - Tổng điểm câu hỏi tự động cập nhật ngay lập tức khi thay đổi điểm ở bất kỳ bước nào.
   - Chuyển đổi giữa chế độ từng bước và văn bản tự do bảo toàn dữ liệu.
3. **Kiểm thử backend**:
   - Unit test `question_extractor_test.go` xác nhận parse thành công mảng steps có `point`.
