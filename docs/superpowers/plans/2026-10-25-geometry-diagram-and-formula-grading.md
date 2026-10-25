# Geometry Diagram & Formula-First Grading Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Triển khai cơ chế upload ảnh hình vẽ riêng biệt qua Mobile QR lưu tạm tại `uploads/temp`, tự động chuyển sang `uploads/diagrams` khi nộp bài thành công để Gemini Vision chấm điểm hình vẽ độc lập (0.5 điểm), dọn dẹp ảnh quá 15 tháng, đồng thời giữ nguyên luồng OCR bài làm văn bản (không lưu ảnh bài viết) và chấm ưu tiên công thức Toán học (Formula-First).

**Architecture:** 
1. Nâng cấp `MobileUploadController` hỗ trợ `type=diagram`: lưu tạm vào `./uploads/temp/{sessionId}_diagram.jpg`.
2. Thêm trường `StudentDiagramURL` và `DiagramResult` vào `models.QuestionAnswer`.
3. Trong `exam_result_handler.go`: khi nộp bài thành công, di chuyển ảnh từ `uploads/temp` sang `uploads/diagrams/{submissionId}_{questionId}.jpg` và lưu URL chính thức.
4. Bổ sung hàm dọn dẹp `CleanupOldSubmissionsAndDiagrams` trong `cronjob.go` quét và xóa các file hình vẽ đã lưu quá 15 tháng.
5. Nâng cấp `ai_grader.go` đọc file ảnh hình vẽ nạp vào Gemini Vision để chấm độc lập 0.5đ, đồng thời áp dụng quy tắc Formula-First cho phần text bài làm.
6. Nâng cấp frontend: thêm nút "📷 Tải ảnh hình vẽ" trên giao diện làm bài, khung preview ảnh, và thẻ "Phần vẽ hình: 0.5/0.5đ" trên trang kết quả.

**Tech Stack:** Go 1.26, Next.js 16.2.6, Tailwind CSS, TypeScript, Gemini Multimodal Vision API, GORM JSONB.

**Spec:** `docs/superpowers/specs/2026-10-25-geometry-diagram-and-formula-grading-design.md`

## Global Constraints

- **Tách biệt hai luồng:** Bài làm viết chữ dùng OCR thành text (không lưu ảnh). Hình vẽ tải riêng qua QR và chỉ lưu ảnh hình vẽ này.
- **Vòng đời Temp -> Diagrams:** Upload vào `uploads/temp/`, chỉ chuyển vào `uploads/diagrams/` khi nộp bài thành công.
- **Dọn dẹp 15 tháng:** Định kỳ xóa các file hình vẽ và dọn kết quả thi cũ hơn 15 tháng.
- **Independent Diagram Scoring:** Điểm hình vẽ 0.5 điểm là một mục độc lập, KHÔNG gộp vào câu con a, b, hay c.
- **Score Rules:** Vẽ đúng theo giả thiết => 0.5 / 0.5đ. Vẽ sai hoặc không vẽ hình => 0.0 / 0.5đ.
- **Formula-First Rule:** Đánh giá các bước làm bài dựa trên công thức, đẳng thức, hệ thức và biến đổi số học; tuyệt đối không trừ điểm nếu học sinh không viết câu từ dẫn giải.
- **Backward Compatibility:** Không làm lỗi các bài thi cũ hoặc các câu hỏi không có hình vẽ.

---

### Task 1: Cấu trúc Dữ liệu `DiagramResult` & Nâng cấp Model Submission

**Files:**
- Modify: `backend/internal/models/submission.go`
- Test: `backend/internal/models/submission_test.go`

**Interfaces:**
- Produces:
  ```go
  type DiagramResult struct {
      HasDiagramRequired bool    `json:"has_diagram_required"`
      Score              float64 `json:"score"`
      MaxScore           float64 `json:"max_score"`
      IsCorrect          bool    `json:"is_correct"`
      StudentDiagramURL  string  `json:"student_diagram_url,omitempty"`
      Explanation        string  `json:"explanation,omitempty"`
  }
  ```
  Thêm `StudentDiagramURL string json:"student_diagram_url,omitempty"` và `DiagramResult *DiagramResult json:"diagram_result,omitempty"` vào `models.QuestionAnswer`.

- [x] **Step 1: Write the failing test**
Viết test trong `submission_test.go` kiểm tra serialization / deserialization của `QuestionAnswer` chứa `StudentDiagramURL` và `DiagramResult`.

- [x] **Step 2: Run test to verify it fails**
Chạy: `cd backend && go test ./internal/models/... -run TestQuestionAnswer_DiagramResult`
Kỳ vọng: FAIL (undefined `DiagramResult`).

- [x] **Step 3: Implement `DiagramResult` in `submission.go`**
Thêm struct `DiagramResult`, trường `StudentDiagramURL` và `DiagramResult` vào `QuestionAnswer`.

- [x] **Step 4: Run test to verify it passes**
Chạy: `cd backend && go test ./internal/models/... -run TestQuestionAnswer_DiagramResult`
Kỳ vọng: PASS.

- [x] **Step 5: Commit**
`git add backend/internal/models/submission.go backend/internal/models/submission_test.go && git commit -m "feat(models): add DiagramResult and StudentDiagramURL to QuestionAnswer"`

---

### Task 2: Hỗ trợ Upload Hình vẽ Tạm thời (`type=diagram` vào `./uploads/temp/`)

**Files:**
- Modify: `backend/internal/controllers/mobile_upload_controller.go`
- Modify: `backend/internal/controllers/mobile_upload_controller_test.go`

**Interfaces:**
- Produces:
  - Bổ sung `UploadType string` (`"ocr"` | `"diagram"`) và `DiagramURL string` trong `MobileUploadResult`.
  - Khi `type=diagram`: Lưu ảnh tạm vào `./uploads/temp/{sessionId}_diagram.jpg`, bỏ qua OCR, trả về `diagramUrl: "/uploads/temp/..."`.
  - Khi `type=ocr` (mặc định): Tiếp tục OCR và không lưu file vĩnh viễn.

- [x] **Step 1: Write the failing test**
Viết test trong `mobile_upload_controller_test.go`:
- Test upload với `?type=diagram`: Kiểm tra file ảnh được lưu tại `./uploads/temp/`, không gọi extractor OCR, và response trả về `diagramUrl`.
- Test upload thông thường `type=ocr`: Kiểm tra OCR vẫn chạy bình thường.

- [x] **Step 2: Run test to verify it fails**
Chạy: `cd backend && go test ./internal/controllers/... -run "TestMobileUpload_Diagram|TestMobileUpload_OCR"`
Kỳ vọng: FAIL.

- [x] **Step 3: Implement `type=diagram` branch in `mobile_upload_controller.go`**
Thêm kiểm tra query param `type`, lưu file vào `./uploads/temp/` và lưu `DiagramURL` vào session store.

- [x] **Step 4: Run test to verify it passes**
Chạy: `cd backend && go test ./internal/controllers/... -run "TestMobileUpload_Diagram|TestMobileUpload_OCR"`
Kỳ vọng: PASS.

- [x] **Step 5: Commit**
`git add backend/internal/controllers/mobile_upload_controller.go backend/internal/controllers/mobile_upload_controller_test.go && git commit -m "feat(upload): support temporary diagram upload to temp folder in mobile upload controller"`

---

### Task 3: Di chuyển Ảnh sang Thư mục Chính thức khi Nộp bài & Dọn dẹp 15 Tháng (File & DB)

**Files:**
- Modify: `backend/internal/handlers/exam_result_handler.go`
- Modify: `backend/internal/services/cronjob.go`
- Test: `backend/internal/services/cronjob_test.go`

**Interfaces:**
- Produces:
  - Trong `exam_result_handler.go`: Khi nộp bài thành công, nếu `ans.StudentDiagramURL` bắt đầu bằng `/uploads/temp/`, di chuyển sang `./uploads/diagrams/{submissionId}_{questionId}.jpg` và cập nhật URL chính thức.
  - Trong `cronjob.go`: Hàm `CleanupOldSubmissionsAndDiagrams(db *gorm.DB, retentionMonths int) (int64, int, error)` tự động quét và xóa sạch các file ảnh hình vẽ trong `./uploads/diagrams/` có tuổi thọ trên 15 tháng, đồng thời xóa sạch các bản ghi kết quả bài thi `submissions` cũ hơn 15 tháng (`created_at < time.Now().AddDate(0, -15, 0)`).

- [x] **Step 1: Write tests for move and cleanup (File & DB Submissions)**
Viết test trong `cronjob_test.go`: kiểm tra logic xóa file ảnh hình vẽ và xóa bản ghi `submissions` cũ hơn 15 tháng.

- [x] **Step 2: Run test to verify it fails**
Chạy: `cd backend && go test ./internal/services/... -run TestCleanupOldSubmissionsAndDiagrams15Months`
Kỳ vọng: FAIL.

- [x] **Step 3: Implement move logic & cleanup function**
Cài đặt di chuyển file trong `exam_result_handler.go` và hàm `CleanupOldSubmissionsAndDiagrams` trong `cronjob.go`.

- [x] **Step 4: Run test to verify it passes**
Chạy: `cd backend && go test ./internal/services/... -run TestCleanupOldSubmissionsAndDiagrams15Months`
Kỳ vọng: PASS.

- [x] **Step 5: Commit**
`git add backend/internal/handlers/exam_result_handler.go backend/internal/services/cronjob.go backend/internal/services/cronjob_test.go && git commit -m "feat(grading): move diagram to permanent on submit and clean up 15-month diagrams and submissions"`

---

### Task 4: Nâng cấp AI Grader: Gemini Vision Chấm Hình vẽ (0.5đ) & Ưu tiên Công thức

**Files:**
- Modify: `backend/internal/services/ai_grader.go`
- Modify: `backend/internal/services/ai_grader_test.go`

**Interfaces:**
- Consumes: `models.DiagramResult`, `utils.GlobalGeminiPool`
- Produces:
  - `EssayBatchQuestionItem.StudentDiagramURL string`
  - `EssayBatchQuestionItem.HasDiagram bool`
  - `EssayQuestionResult.DiagramResult *models.DiagramResult`
  - Đọc file ảnh từ `StudentDiagramURL` và nạp vào Gemini `inlineData`.
  - Cập nhật Prompt 1:
    + Quy tắc kiểm tra hình vẽ đối chiếu với lời giải mẫu => 0.5đ độc lập.
    + Quy tắc Formula-First: Chỉ chấm biểu thức, hệ thức Toán; không trừ điểm vì thiếu lời văn dẫn dắt.
  - Cập nhật JSON Schema của Gemini response để chứa `diagramResult`.

- [x] **Step 1: Write the failing test**
Viết test trong `ai_grader_test.go`: Parse JSON response từ Gemini chứa `diagramResult` và kiểm tra điểm số 0.5đ được unmarshal đúng.

- [x] **Step 2: Run test to verify it fails**
Chạy: `cd backend && go test ./internal/services/... -run TestEssayQuestionResult_DiagramResult`
Kỳ vọng: FAIL.

- [x] **Step 3: Update `ai_grader.go`**
Cập nhật struct `EssayBatchQuestionItem`, `EssayQuestionResult`, Prompt 1 và Schema JSON trong `gradeEssayChunk`.

- [x] **Step 4: Run test to verify it passes**
Chạy: `cd backend && go test ./internal/services/... -run TestEssayQuestionResult_DiagramResult`
Kỳ vọng: PASS.

- [x] **Step 5: Commit**
`git add backend/internal/services/ai_grader.go backend/internal/services/ai_grader_test.go && git commit -m "feat(grader): support independent diagram grading with gemini vision and formula-first evaluation"`

---

### Task 5: Nâng cấp Frontend: Nút "Tải ảnh hình vẽ" & Hiển thị Thẻ Hình vẽ (0.5đ)

**Files:**
- Modify: `frontend/src/components/exam/taking/MobileQrUploadModal.tsx`
- Modify: `frontend/src/components/exam/taking/EssayQuestion.tsx`
- Test: `frontend/src/components/exam/taking/EssayQuestion.test.tsx`

**Interfaces:**
- `MobileQrUploadModal`: hỗ trợ `uploadType="diagram"`, trả về `diagramUrl`.
- `EssayQuestion`:
  - Lúc làm bài: Thêm nút "📷 Tải ảnh hình vẽ", khung xem trước ảnh hình vẽ đã tải.
  - Lúc xem kết quả: Hiển thị thẻ độc lập **"Phần vẽ hình: 0.5 / 0.5 điểm"** với nhận xét AI và ảnh vẽ.

- [x] **Step 1: Write/Update frontend component test**
Viết test trong `EssayQuestion.test.tsx` kiểm tra hiển thị nút upload hình vẽ và thẻ kết quả khi có `diagramResult`.

- [x] **Step 2: Run test to verify it fails**
Chạy: `cd frontend && npm test -- src/components/exam/taking/EssayQuestion.test.tsx`
Kỳ vọng: FAIL.

- [x] **Step 3: Update `MobileQrUploadModal.tsx` and `EssayQuestion.tsx`**
Cập nhật callback nhận ảnh và render khối UI `DiagramResultCard`.

- [x] **Step 4: Run test to verify it passes**
Chạy: `cd frontend && npm test -- src/components/exam/taking/EssayQuestion.test.tsx`
Kỳ vọng: PASS.

- [x] **Step 5: Commit**
`git add frontend/src/components/exam/taking/MobileQrUploadModal.tsx frontend/src/components/exam/taking/EssayQuestion.tsx frontend/src/components/exam/taking/EssayQuestion.test.tsx && git commit -m "feat(ui): add dedicated diagram upload modal and display diagram grading card"`

---

### Task 6: Kiểm thử Toàn diện & Xác minh Hệ thống (Full System Verification)

**Files:**
- Full backend & frontend verification.

- [x] **Step 1: Backend tests with race detector**
Chạy: `cd backend && go test -race ./internal/utils/... ./internal/services/... ./internal/controllers/...`
Kỳ vọng: 100% tests PASS.

- [x] **Step 2: Backend build check**
Chạy: `cd backend && go build -o /dev/null ./cmd/api/main.go`
Kỳ vọng: Build thành công không có lỗi.

- [x] **Step 3: Frontend build check**
Chạy: `cd frontend && npm run build`
Kỳ vọng: Next.js build thành công.

- [x] **Step 4: Commit**
`git commit --allow-empty -m "chore: verify full system build and test suite for diagram and formula grading"`
