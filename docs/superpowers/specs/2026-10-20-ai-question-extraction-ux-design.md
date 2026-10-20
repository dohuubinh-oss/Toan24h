# Design Spec: AI Question Extraction UX & Automated JSON Pipeline

**Date:** 2026-10-20  
**Feature:** AI Question Extraction UX & Automated JSON Workflow  
**Scope:** `frontend` (Question Creator, AI Modal, JsonInputCard, Text Formatter) & `backend` (Gemini Extraction Prompt & Validation)  

---

## 1. Context & Objectives

Khi người dùng bóc tách đề thi tại trang tạo câu hỏi (`/dashboard/questions/create`), quy trình hiện tại có các điểm cần tối ưu:
1. Nút bấm trong modal đang để là **"Bắt đầu bóc tách"**, cần đổi tên thành **"Bóc tách câu hỏi"** để phản ánh chính xác hành động.
2. Sau khi AI bóc tách xong, dữ liệu JSON cần được **tự động điền vào ô "Nhập nhanh bằng JSON"** và **tự động kích hoạt cơ chế Xử lý JSON**, cập nhật ngay lập tức vào các component biên tập và state của ứng dụng.
3. **Nội dung câu hỏi** và **Lời giải chi tiết** chưa tự động ngắt dòng và format HTML (danh sách bullet `<ul>`, đánh số `<ol>`, ngắt dòng `<br/>`, đoạn `<p>`) như cơ chế chuẩn bên trang tạo bài giảng (`formatTextToHtml`).
4. Dữ liệu **Đáp án (`correct_answer`)** bắt buộc phải luôn được trả về và hiển thị đúng:
   - Với **Trắc nghiệm**: Dữ liệu đáp án phải khớp với một trong 4 phương án (đã bỏ tiền tố A., B., C., D.), sử dụng công thức LaTeX chuẩn `$..$` để tự động tick chọn radio button chính xác và hiển thị đẹp qua KaTeX.
   - Với **Tự luận**: Bật tab "Tự luận", trường `correct_answer` bắt buộc có đáp số / lời giải mẫu dưới dạng LaTeX chuẩn `$..$`.

---

## 2. Technical Decisions & Architecture

### 2.1. Đổi tên nút trong Modal Bóc Tách
- Trong `AiQuestionExtractModal.tsx`:
  - Đổi text nút submit từ `Bắt đầu bóc tách` -> `Bóc tách câu hỏi`.
  - Cập nhật test case trong `AiQuestionExtractModal.test.tsx`.

### 2.2. Luồng tự động điền JSON & Tự động xử lý (Automated JSON Pipeline)
- Trong `AiQuestionExtractModal.tsx`:
  - Sau khi nhận dữ liệu từ API `/questions/extract-ai`, chuẩn hóa các khối câu hỏi, đồng thời sinh chuỗi `jsonString = JSON.stringify(sanitizedBlocks, null, 2)`.
  - Truyền cả `sanitizedBlocks` và `jsonString` qua `onExtracted(blocks, jsonString)`.
- Trong `dashboard/questions/create/page.tsx`:
  - Thêm state `extractedJsonString: string`.
  - Truyền `extractedJsonString` vào `JsonInputSection` qua prop `initialValue`.
  - Khi modal gọi `onExtracted(blocks, jsonString)`:
    - Lưu `extractedJsonString = jsonString`.
    - Tự động gọi `handleProcessJson(blocks)` để cập nhật `questionBlocks`, reset index về câu đầu tiên và cuộn mượt xuống khu vực biên tập.

### 2.3. Tự động xuống dòng & Chuẩn hóa Text sang HTML (`questionTextFormatter.ts`)
- Tạo utility `frontend/src/components/questions/creator/utils/questionTextFormatter.ts`:
  - Đồng bộ hàm `formatTextToHtml(text?: string | null): string` từ `lectureJsonParser.ts`:
    - Tách đoạn theo `\n\s*\n` thành thẻ `<p>`.
    - Nhận diện gạch đầu dòng `[-*•]\s+` thành `<ul><li>`.
    - Nhận diện số thứ tự `\d+[\.\)]\s+` thành `<ol><li>`.
    - Giữ nguyên các thẻ HTML có sẵn (`<p>`, `<div>`, `<ul>`, `<ol>`, `<table>`, `<img>`).
    - Nối các dòng văn bản đơn lẻ bằng `<br/>` trong cùng một thẻ `<p>`.
  - Áp dụng vào:
    - `q.content` (Nội dung câu hỏi).
    - `q.solution_guide` (Lời giải chi tiết: hỗ trợ cả chuỗi thuần lẫn object timeline `problem/steps/conclusion/tips`).
    - `block.shared_content` (Nội dung đề dẫn chung cho câu hỏi chùm).

### 2.4. Backend Gemini Prompt Củng Cố Đáp Án & LaTeX
- Trong `backend/internal/services/question_extractor.go`:
  - Củng cố prompt:
    - BẮT BUỘC trường `correct_answer` không được để trống trong mọi trường hợp.
    - Với Trắc nghiệm: `correct_answer` phải bằng chính xác nội dung của 1 trong 4 `options` (đã gọt bỏ A., B., C., D.), các công thức toán bắt buộc viết dạng LaTeX `$..$`.
    - Với Tự luận: `correct_answer` phải ghi rõ đáp số / kết quả rút gọn dạng LaTeX `$..$`.
  - Backend post-processing:
    - Nếu `type == "Trắc nghiệm"` và `correct_answer` trả về ký tự 'A', 'B', 'C', 'D', tự động chuyển đổi thành nội dung tương ứng của `options[index]` để đảm bảo hiển thị đồng nhất.

---

## 3. Review Focus & Edge Cases

1. **Câu hỏi đã có sẵn HTML/LaTeX**: Không bọc thừa thẻ `<p>` nếu text đã là HTML có cấu trúc hợp lệ.
2. **Khớp phương án Trắc nghiệm**: So khớp đáp án không bị lệch do khoảng trắng hoặc ký tự tiền tố `A. `, `B) `.
3. **Câu hỏi tự luận không có options**: `options` là mảng rỗng `[]`, `type` là `"Tự luận"`, tab Tự luận trong `QuestionEditorSection` tự động được kích hoạt.
4. **Hiển thị JSON trong ô Textarea**: Ô textarea trong `JsonInputCard` được cập nhật đồng bộ chuỗi JSON mới nhất.
