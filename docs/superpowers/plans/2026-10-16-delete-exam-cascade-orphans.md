# Delete Exam Cascade Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Khi xóa một đề thi (`DELETE /api/v1/exams/:id`), hệ thống tự động xóa cứng toàn bộ bài nộp (`submissions`), kiểm tra các câu hỏi thuộc đề thi: nếu câu hỏi không thuộc bất kỳ đề thi nào khác thì xóa cứng khỏi ngân hàng câu hỏi (`questions`), đồng thời xóa các file ảnh vật lý trên ổ đĩa (`uploads/questions/...`) nếu không còn câu hỏi nào khác tham chiếu.

**Architecture:**
- **Helper trích xuất và dọn dẹp ảnh**:
  - `extractImageURLs(contents ...string) []string`: Trích xuất tất cả URL ảnh `/uploads/questions/...` từ HTML / text bằng regex `src="(/uploads/questions/[^"]+)"`.
  - `filterUnusedImages(db *gorm.DB, imageURLs []string, deletingQuestionIDs []string) []string`: Kiểm tra xem các ảnh này có đang được tham chiếu bởi bất kỳ câu hỏi nào khác ngoài danh sách đang xóa không. Chỉ giữ lại ảnh không còn ai dùng.
  - `deletePhysicalFiles(imageURLs []string)`: Xóa các file vật lý trên disk bằng `os.Remove`.
- **Luồng xử lý trong `DeleteExam` (`backend/internal/handlers/exam_handler.go`)**:
  - Chạy trong Database Transaction (`tx := config.DB.Begin()`):
    1. Tìm bản ghi `models.Exam` theo `id`. Nếu không tìm thấy, trả về 404.
    2. Hard-delete toàn bộ `models.Submission` có `exam_id = id`.
    3. Xác định danh sách câu hỏi liên quan: `parentQuestionIDs = exam.QuestionIDs`, kèm các câu hỏi con có `parent_id IN (parentQuestionIDs)`.
    4. Lọc câu hỏi mồ côi: Với mỗi câu hỏi, kiểm tra xem nó có nằm trong `question_ids` của bất kỳ đề thi nào khác (`id != exam.ID`) không (nếu là câu con thì kiểm tra xem câu cha có được dùng ở đề khác không).
    5. Với các câu hỏi mồ côi: Gom toàn bộ nội dung (`content`, `options`, `solutionGuide`, `hint`, `quickSolveTips`, `generalMethod`, `mistakes`) để trích xuất danh sách file ảnh.
    6. Hard-delete (`Unscoped().Delete`) các câu hỏi mồ côi (cả sub-questions và parent questions).
    7. Hard-delete `models.Exam`.
    8. Commit transaction.
    9. Sau khi commit thành công: Lọc các file ảnh không còn bị câu hỏi nào khác trong DB tham chiếu, và gọi `os.Remove` xóa sạch trên ổ đĩa.
- **TDD & Testing**:
  - Viết test kiểm thử toàn diện cho helper trích xuất ảnh và kiểm tra ảnh mồ côi.
  - Viết test cho `DeleteExam` kiểm tra 3 khía cạnh: (1) xóa đề thi & submissions, (2) phân loại đúng câu hỏi mồ côi vs câu hỏi dùng chung, (3) dọn dẹp file ảnh trên ổ đĩa.

**Tech Stack:** Go 1.26 (Gin, GORM, PostgreSQL pq.StringArray), Regex, OS filesystem (`os.Remove`), Testify.

---

### Task 1: Tạo helper trích xuất và dọn dẹp ảnh câu hỏi

**Files:**
- Create: `backend/internal/services/image_cleanup_service.go`
- Create: `backend/internal/services/image_cleanup_service_test.go`

- [x] **Step 1: Viết test cho helper trích xuất URL ảnh từ HTML/JSON text**
  - Viết test `TestExtractImageURLs` kiểm tra:
    - Trích xuất chính xác các URL có dạng `/uploads/questions/...` từ thẻ `img` trong `src="..."`.
    - Loại bỏ các URL trùng lặp (deduplicate).
    - Bỏ qua các URL khác không thuộc `/uploads/questions/`.

- [x] **Step 2: Triển khai hàm `ExtractQuestionImageURLs` và `DeletePhysicalImages`**
  - Viết regex `var questionImgRegex = regexp.MustCompile(`src="(/uploads/questions/[^"]+)"`)`.
  - Hàm `ExtractQuestionImageURLs(texts ...string) []string`.
  - Hàm `DeletePhysicalImages(imageURLs []string)`.

- [x] **Step 3: Chạy test cho helper ảnh và đảm bảo PASS**
  - Chạy `go test -v ./internal/services -run TestExtractImageURLs`.

---

### Task 2: Triển khai logic kiểm tra câu hỏi mồ côi và dọn dẹp trong `DeleteExam`

**Files:**
- Modify: `backend/internal/handlers/exam_handler.go`
- Create / Modify: `backend/internal/handlers/exam_delete_test.go`

- [x] **Step 1: Viết test cho `DeleteExam` (TDD)**
  - Viết test `TestDeleteExam_CascadeCleanup`:
    - Tạo 2 đề thi: Đề 1 (chứa Q1, Q2) và Đề 2 (chứa Q2, Q3).
    - Tạo các file ảnh giả lập trong thư mục `uploads/questions/...` tương ứng với Q1 và Q2.
    - Tạo submission cho Đề 1.
    - Gọi API `DELETE /api/v1/exams/:id` cho Đề 1.
    - Kỳ vọng:
      - Đề 1 bị xóa khỏi DB.
      - Submission của Đề 1 bị xóa khỏi DB.
      - Q1 (mồ côi) bị xóa khỏi DB; file ảnh của Q1 bị xóa khỏi ổ đĩa.
      - Q2 (dùng chung ở Đề 2) KHÔNG bị xóa; file ảnh của Q2 vẫn còn trên ổ đĩa.
      - Q3 và Đề 2 vẫn nguyên vẹn.

- [x] **Step 2: Triển khai logic đầy đủ trong `DeleteExam` của `backend/internal/handlers/exam_handler.go`**
  - Lấy thông tin `exam` theo ID.
  - Mở transaction `tx := config.DB.Begin()`.
  - Xóa cứng các submissions của exam: `tx.Unscoped().Where("exam_id = ?", exam.ID).Delete(&models.Submission{})`.
  - Quét danh sách câu hỏi cha và câu hỏi con.
  - Xác định các câu hỏi mồ côi (không nằm trong `question_ids` của bất kỳ đề nào khác có `id != exam.ID`).
  - Gom text của các câu hỏi mồ côi để trích xuất URL ảnh.
  - Xóa cứng các câu hỏi mồ côi: `tx.Unscoped().Delete(&models.Question{}, "id IN (?)", orphanIDs)`.
  - Xóa cứng exam: `tx.Unscoped().Delete(&models.Exam{}, "id = ?", exam.ID)`.
  - Commit transaction.
  - Kiểm tra những ảnh nào không còn câu hỏi nào trong DB tham chiếu thì gọi xóa file vật lý bằng `os.Remove`.

- [x] **Step 3: Chạy test kiểm thử `DeleteExam` và xác nhận PASS**
  - Chạy test kiểm thử để xác nhận logic hoạt động chính xác.

---

### Task 3: Kiểm thử toàn diện và nghiệm thu (Verification)

**Files:**
- Verify toàn bộ backend test suite và kiểm tra không ảnh hưởng đến các chức năng khác.

- [x] **Step 1: Chạy toàn bộ backend test liên quan**
  - Chạy test các handler và services.
- [x] **Step 2: Kiểm tra biên và an toàn**
  - Đề thi rỗng (không có câu hỏi).
  - Đề thi có câu hỏi chùm (parent - child).
  - Đề thi có nhiều submission.
  - Câu hỏi dùng ảnh trùng nhau.
