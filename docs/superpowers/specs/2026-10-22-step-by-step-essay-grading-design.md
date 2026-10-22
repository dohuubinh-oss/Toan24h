# Tài Liệu Thiết Kế: Nâng Cấp Chấm Điểm Câu Tự Luận Theo Thang Điểm Từng Bước (Rubric)

**Ngày:** 22-10-2026  
**Trạng thái:** Chờ phê duyệt (Pending Approval)  
**Tác giả:** Antigravity AI Pair Programmer & Người dùng  

---

## 1. Tổng Quan & Động Lực (Intent & The Why)

Hiện tại, hệ thống chấm bài tự luận toán học bằng Gemini (`GradeEssayBatchWithGemini`) chỉ chấm và trả về một điểm số tổng duy nhất cho toàn bộ câu hỏi (`score/maxScore`), kèm theo một đoạn giải thích chung và trích dẫn lỗi sai tổng thể.

### Hạn chế hiện tại:
1. Học sinh không thấy được bài làm của mình làm đúng đến bước nào, mất điểm ở bước nào trong tiến trình suy luận.
2. Không phản ánh đúng thực tế chấm thi môn Toán tại Việt Nam (thường chia thang điểm cụ thể theo từng bước: ĐKXĐ, biến đổi đại số, lập luận hình học, kết luận nghiệm).
3. Đề bài và câu hỏi trong hệ thống chưa chuẩn hóa trường điểm số cho từng bước trong `solution_guide`.

### Mục tiêu giải pháp:
Nâng cấp toàn diện luồng trích xuất câu hỏi, lưu trữ và chấm điểm tự luận bằng Gemini:
- Hỗ trợ thang điểm từng bước (rubric) ngay từ khâu tạo đề/trích xuất ảnh.
- Gemini chấm điểm dứt khoát theo từng bước, tự động công nhận cách giải khác hợp lệ.
- Trả về và lưu trữ bảng điểm chi tiết từng bước (`step_results`).
- Hiển thị trực quan bảng tiến trình từng bước trên giao diện kết quả bài thi.

---

## 2. Các Quyết Định Thiết Kế Chính (Decisions)

### A. Quyết định từ Người dùng (Theirs)
1. **Nguồn biểu điểm câu hỏi:**
   - Nếu tài liệu tải lên đã có sẵn lời giải và điểm số từng bước: Hệ thống trích xuất và sử dụng chính xác các bước và số điểm này.
   - Nếu tài liệu chỉ có lời giải mà chưa có điểm từng bước: Gemini tự động phân tích lời giải để phân bổ điểm cho từng bước theo tổng điểm của câu hỏi.
2. **Quy tắc tính điểm từng bước:**
   - Tính dứt khoát (all-or-nothing): Mỗi bước giải làm đúng trọn vẹn sẽ nhận đủ điểm của bước đó; nếu có bất kỳ lỗi sai nào (dù sai công thức hay nhầm lẫn số học) thì **mất trọn điểm của bước đó (nhận 0 điểm)**.
   - Tổng điểm câu tự luận = Tổng điểm các bước thành phần học sinh đạt được.
3. **Xử lý cách giải khác (Alternative Solutions):**
   - Nếu học sinh giải bài theo một phương pháp toán học khác hoàn toàn so với lời giải mẫu nhưng vẫn đúng logic, Gemini linh hoạt công nhận, tự lập ra các bước tương đương của cách giải mới và phân bổ điểm tương ứng để chấm cho học sinh.

### B. Quyết định kỹ thuật của Agent (My Calls / Builder Decisions)
1. **Cấu trúc dữ liệu bước giải (`solution_guide.steps`):**
   - Bổ sung trường `point` (số thực là bội số của 0.25, ví dụ: 0.25, 0.5, 0.75, 1.0) vào mỗi item trong `solution_guide.steps`:
     ```json
     {
       "step": 1,
       "title": "Điều kiện xác định",
       "content": "• Biểu thức dưới căn có nghĩa khi $x \\ge 2$...",
       "formula": "x \\ge 2",
       "point": 0.25
     }
     ```
   - Tổng `point` của các bước luôn bằng `difficulty_point` / `point` của câu hỏi (chuẩn hóa thang điểm 0.25 của môn Toán).
2. **Cấu trúc lưu trữ kết quả chấm từng bước (`StepResult`):**
   - Trong `models.QuestionAnswer` (lưu trữ trong `submissions.answers` JSONB), bổ sung trường `step_results`:
     ```json
     "step_results": [
       {
         "step": 1,
         "title": "Điều kiện xác định",
         "score": 0.25,
         "max_score": 0.25,
         "is_correct": true,
         "error_location": "",
         "deduction_reason": ""
       },
       {
         "step": 2,
         "title": "Biến đổi phương trình",
         "score": 0.0,
         "max_score": 0.5,
         "is_correct": false,
         "error_location": "2x - 4 = 10 <=> 2x = 6",
         "deduction_reason": "Chuyển vế đổi dấu sai (-4 chuyển vế thành -4 thay vì +4)"
       }
     ]
     ```
   - Bổ sung cờ `is_alternative_method: boolean` và ghi chú phương pháp nếu học sinh làm theo cách khác.
3. **Khả năng tương thích ngược (Backward Compatibility):**
   - Nếu câu hỏi cũ chỉ có chuỗi text thuần hoặc `solution_guide` chưa có `point`, lúc chấm Gemini sẽ tự động chia đều hoặc chia điểm hợp lý theo các bước hiện có dựa trên `maxScore` của câu hỏi.
   - Giao diện hiển thị: Nếu bài thi cũ chưa có `step_results`, tự động fallback về hiển thị điểm và nhận xét tổng như trước đây, đảm bảo 100% không vỡ giao diện.

---

## 3. Goals, Non-Goals & Anti-Goals

### Goals:
- [x] **Trích xuất thông minh:** Nâng cấp Prompt trong `question_extractor.go` và `jsonexamp.txt` để nhận diện điểm từng bước từ ảnh hoặc tự phân bổ nếu thiếu điểm.
- [x] **Chấm điểm chi tiết:** Cập nhật Prompt và Schema trong `ai_grader.go` (`GradeEssayBatchWithGemini`) để so khớp và trả về `step_results` cho từng câu hỏi tự luận.
- [x] **Tích hợp Backend:** Lưu `step_results` vào `QuestionAnswer` trong `exam_result_handler.go`, tính tổng điểm dựa trên tổng các bước.
- [x] **Giao diện trực quan:** Hiển thị danh sách thẻ các bước trong `EssayQuestion.tsx` và trang kết quả bài thi (`/exam/[id]/result`), có icon trạng thái (xanh/đỏ), điểm số đạt/tối đa và trích dẫn lỗi sai nếu có.

### Non-Goals:
- Không thay đổi logic chấm của câu hỏi trắc nghiệm khách quan (`mc`).
- Không hỗ trợ điểm số lẻ một phần trong cùng một bước (tuân thủ quy tắc mất trọn điểm bước khi có lỗi).

### Anti-Goals:
- Tuyệt đối không thêm các nút bấm thừa thãi làm rác UI (theo yêu cầu của người dùng).
- Không phá vỡ dữ liệu các đề thi và kết quả thi đã lưu trước đây trong CSDL.

---

## 4. Kiến Trúc Kỹ Thuật Chi Tiết

### A. Luồng Dữ Liệu Chấm Điểm Từng Bước
```
[Học sinh nộp bài thi tự luận]
                │
                ▼
[POST /api/v1/exams/:id/submit] -> `exam_result_handler.go`
                │
                ├─ Lấy danh sách câu tự luận (Nội dung, Lời giải mẫu kèm các bước & điểm, Bài làm HS)
                │
                ▼
[services.GradeEssayBatchWithGemini(essayInput)] -> `ai_grader.go`
                │
                ├─ AI kiểm tra phương pháp làm của học sinh (theo đáp án hay cách mới)
                ├─ AI đánh giá từng bước: Đúng hoàn toàn -> full điểm; Sai sót -> 0 điểm + trích dẫn lỗi
                ├─ AI tính tổng điểm câu = tổng điểm các bước
                │
                ▼
[Trả về EssayBatchResponse kèm StepResults]
                │
                ├─ Lưu vào submission.AnswersMap[qID].StepResults
                ├─ Cập nhật totalScore của bài thi
                │
                ▼
[Frontend: /exam/[id]/result & EssayQuestion.tsx]
                │
                └─ Render danh sách các thẻ bước giải với KaTeX, điểm số và lỗi sai chi tiết
```

### B. Chi tiết Thay Đổi Mã Nguồn

#### 1. Backend Go:
- **`backend/internal/services/question_extractor.go`**:
  - Cập nhật định nghĩa struct `SolutionGuideStep` có `Point float32 json:"point"`.
  - Cập nhật prompt trích xuất đề thi: Nếu ảnh có điểm từng bước thì ghi đúng `point`, nếu không có thì tự tính `point` cho từng bước sao cho tổng bằng điểm câu.
- **`backend/internal/models/submission.go`**:
  - Bổ sung struct `StepGradeResult`:
    ```go
    type StepGradeResult struct {
        Step            int     `json:"step"`
        Title           string  `json:"title"`
        Score           float64 `json:"score"`
        MaxScore        float64 `json:"max_score"`
        IsCorrect       bool    `json:"is_correct"`
        ErrorLocation   string  `json:"error_location,omitempty"`
        DeductionReason string  `json:"deduction_reason,omitempty"`
    }
    ```
  - Thêm trường `StepResults []StepGradeResult` và `IsAlternativeMethod bool` vào `QuestionAnswer`.
- **`backend/internal/services/ai_grader.go`**:
  - Thêm `StepResults []StepGradeResult` vào `EssayQuestionResult`.
  - Nâng cấp `gradeEssayChunk`:
    - Prompt chỉ dẫn Gemini so khớp từng bước trong `solution_guide` (hoặc lập bước tương đương nếu học sinh giải cách khác).
    - Quy tắc trừ trọn điểm bước khi sai.
    - Cập nhật `responseSchema` của Gemini API để trả về mảng `stepResults`.
- **`backend/internal/handlers/exam_result_handler.go`**:
  - Truyền `solution_guide` vào `EssayBatchQuestionItem`.
  - Gán `res.StepResults` vào `ans.StepResults` khi lưu bài thi.

#### 2. Frontend Next.js:
- **`frontend/src/components/exam/taking/EssayQuestion.tsx` & `/exam/[id]/result/page.tsx`**:
  - Bổ sung kiểu dữ liệu `StepGradeResult` trong `aiFeedbacks`.
  - Hiển thị danh sách các bước đã chấm (Step breakdown card):
    - Mỗi bước có số thứ tự, tiêu đề bước.
    - Badge điểm: ví dụ `+0.5 / 0.5 đ` (màu xanh lá) hoặc `0.0 / 0.25 đ` (màu đỏ).
    - Nếu bước bị 0 điểm: Hiển thị box trích dẫn lỗi sai (`error_location`) và lý do trừ điểm (`deduction_reason`).
    - Nếu học sinh giải cách khác: Hiển thị tag biểu thị "Lời giải phương pháp khác hợp lệ".

---

## 5. Kế Hoạch Kiểm Thử (Testing Strategy)

Tuân thủ nghiêm ngặt **Superpowers Strict TDD**:
1. **Unit Test Backend:**
   - Test `question_extractor`: Trích xuất thành công `solution_guide.steps` có trường `point` cả khi có sẵn điểm và khi AI tự phân bổ.
   - Test `ai_grader`: Mock phản hồi Gemini chứa `stepResults`, kiểm tra tính toán tổng điểm bằng tổng điểm các bước, kiểm tra quy tắc 0 điểm khi bước có lỗi.
   - Test `exam_result_handler`: Đảm bảo lưu đúng `step_results` vào JSONB của CSDL và tương thích với bài thi cũ.
2. **Unit Test & Type Check Frontend:**
   - Test component `EssayQuestion` hiển thị đầy đủ thẻ các bước khi có `stepResults`.
   - Chạy `npx tsc --noEmit` và `npm run test` để đảm bảo không có lỗi type hay hồi quy.
