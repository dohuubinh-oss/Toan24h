# Hệ thống 2 Lần Thi (Official Attempt 1 & Retake Attempt 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cho phép học sinh làm lại bài thi chính thức không giới hạn, lưu điểm Lần 1 làm điểm chính thức vĩnh viễn và ghi đè các lần thi sau vào Lần 2 (tối đa đúng 2 bản ghi/đề thi/học sinh), xóa bỏ lỗi chặn nộp bài 400.

**Architecture:** Mở rộng model `Submission` với trường `AttemptNumber` (int, default 1). Tại handler nộp bài `SubmitExamAnswers`, chuyển đổi logic: Lần 1 tạo attempt 1; Lần 2 tạo attempt 2; Lần 3+ cập nhật/ghi đè attempt 2. API kết quả trả về thông tin các lần thi để Frontend hiển thị thanh chuyển đổi Lần 1 (Chính thức) và Lần 2 (Ôn tập gần nhất).

**Tech Stack:** Go (Fiber/Gin, GORM, PostgreSQL), Next.js 16 (React 19, TypeScript, Tailwind CSS, Lucide icons).

---

## Global Constraints

- Không làm phình cơ sở dữ liệu: Mỗi học sinh trên mỗi đề thi chỉ có tối đa 2 bản ghi `Submission` (attempt 1 và attempt 2).
- Điểm chính thức (`attempt = 1`) không bao giờ bị ghi đè hay mất dữ liệu khi làm lại.
- Bỏ chặn hoàn toàn mã lỗi 400 `"Bài thi chính thức chỉ được làm và nộp 1 lần"`.
- Giữ vững Type-safety và tương thích ngược với API frontend hiện tại.

## Review Focus

1. **Lần nộp đầu tiên**: Tạo bản ghi `attempt = 1`, tính điểm và lưu trữ bình thường.
2. **Lần nộp thứ 2**: Tạo bản ghi mới `attempt = 2`, điểm và bài làm lần 1 vẫn nguyên vẹn.
3. **Lần nộp thứ 3 trở đi**: Cập nhật đè lên bản ghi `attempt = 2`, số lượng bản ghi trong database vẫn là 2.
4. **Học sinh chưa hoàn thành lần 1 (đang làm dở in_progress)**: Tiếp tục cập nhật bài làm lần 1 cho đến khi nộp hoàn tất.
5. **Xem kết quả trên giao diện**: Chuyển đổi mượt mà giữa Lần 1 và Lần 2, hiển thị rõ ràng nhãn Chính thức và Ôn tập.

---

### Task 1: Cập nhật Model & Database Migration Backend

**Files:**
- Modify: `backend/internal/models/submission.go:102-118`
- Test: `backend/internal/handlers/exam_result_handler_test.go`

**Interfaces:**
- Produces: `Submission.AttemptNumber` (int, default 1, gorm tag `type:int;default:1`)

- [ ] **Step 1: Thêm trường `AttemptNumber` vào struct `Submission` trong `backend/internal/models/submission.go`**
```go
type Submission struct {
    ID                           uuid.UUID        `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
    UserID                       *uuid.UUID       `gorm:"type:uuid;index" json:"userId,omitempty"`
    ExamID                       uuid.UUID        `gorm:"type:uuid;not null;index" json:"examId"`
    AttemptNumber                int              `gorm:"type:int;not null;default:1" json:"attemptNumber"`
    Status                       SubmissionStatus `gorm:"type:varchar(20);not null;default:'in_progress'" json:"status"`
    ...
```

- [ ] **Step 2: Viết test kiểm tra migration tự động `AttemptNumber`**
Run: `go test ./internal/handlers -run TestSubmissionMigration -v`

- [ ] **Step 3: Commit**
```bash
git add backend/internal/models/submission.go
git commit -m "feat(models): add AttemptNumber to Submission struct"
```

---

### Task 2: Cải tiến Logic Nộp Bài `SubmitExamAnswers` (Tối đa 2 bản ghi)

**Files:**
- Modify: `backend/internal/handlers/exam_result_handler.go:58-140`
- Test: `backend/internal/handlers/exam_result_handler_test.go`

**Interfaces:**
- Consumes: `models.Submission.AttemptNumber`
- Produces: `SubmitExamAnswers` lưu đúng attempt 1 (tạo mới), attempt 2 (tạo mới lần 2, ghi đè từ lần 3+)

- [ ] **Step 1: Viết test TDD kiểm tra 3 chu kỳ nộp bài liên tiếp trong `backend/internal/handlers/exam_result_handler_test.go`**
  - Test nộp lần 1: Tạo record attempt 1.
  - Test nộp lần 2: Tạo record attempt 2, record attempt 1 giữ nguyên.
  - Test nộp lần 3: Ghi đè record attempt 2, tổng số submission vẫn là 2.

- [ ] **Step 2: Chạy test để xác nhận test ban đầu fail**
Run: `go test ./internal/handlers -run TestTwoAttemptsSubmissionLogic -v`
Expected: FAIL

- [ ] **Step 3: Cập nhật logic tìm kiếm & quyết định attempt trong `backend/internal/handlers/exam_result_handler.go`**
  - Query danh sách submissions: `config.DB.Where("exam_id = ? AND user_id = ?", examID, studentID).Order("attempt_number asc").Find(&existingSubs)`
  - Xác định submission cần lưu:
    - Nếu `len(existingSubs) == 0`: `submission.AttemptNumber = 1`, `isUpdate = false`.
    - Nếu `len(existingSubs) == 1`:
      - Nếu `existingSubs[0].AttemptNumber == 1 && existingSubs[0].Status == models.StatusInProgress`: tiếp tục làm bài lần 1 (`isUpdate = true`, `submission = existingSubs[0]`).
      - Ngược lại (Lần 1 đã nộp/đã chấm xong): đây là Lần 2 -> `submission.ID = uuid.New()`, `submission.AttemptNumber = 2`, `isUpdate = false`.
    - Nếu `len(existingSubs) >= 2`:
      - Tìm bản ghi `attempt_number == 2` (hoặc bản ghi thứ 2): `isUpdate = true`, `submission = attempt2Sub`.
  - Bỏ hoàn toàn đoạn `c.JSON(http.StatusBadRequest, gin.H{"message": "Bài thi chính thức chỉ được làm và nộp 1 lần. Bạn không thể nộp lại."})`.

- [ ] **Step 4: Chạy lại test để xác nhận test pass 100%**
Run: `go test ./internal/handlers -run TestTwoAttemptsSubmissionLogic -v`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add backend/internal/handlers/exam_result_handler.go backend/internal/handlers/exam_result_handler_test.go
git commit -m "feat(api): implement 2-attempt submission lifecycle with overwrite on attempt 2"
```

---

### Task 3: Cập nhật API Kết Quả Trả Về Danh Sách Lần Thi (`attempts`)

**Files:**
- Modify: `backend/internal/handlers/exam_result_handler.go:388-460`
- Modify: `frontend/src/lib/api.ts`

**Interfaces:**
- Produces: `GetExamResultByID` trả về thêm danh sách các lần thi `attempts: [{ id, attemptNumber, totalScore, status, submittedAt }]` để Frontend biết học sinh có bao nhiêu lần thi.

- [ ] **Step 1: Viết test kiểm tra payload API `GetExamResultByID` có trường `attempts`**
Run: `go test ./internal/handlers -run TestGetExamResultWithAttempts -v`

- [ ] **Step 2: Cập nhật `GetExamResultByID` để load toàn bộ submissions của user cho exam đó và đính kèm mảng `attempts`**

- [ ] **Step 3: Chạy test kiểm tra pass**
Run: `go test ./internal/handlers -run TestGetExamResultWithAttempts -v`
Expected: PASS

- [ ] **Step 4: Commit**
```bash
git add backend/internal/handlers/exam_result_handler.go
git commit -m "feat(api): return attempts history in GetExamResultByID"
```

---

### Task 4: Cập Nhật Giao Diện Xem Kết Quả (`/exam/[id]/result`)

**Files:**
- Modify: `frontend/src/app/(fullscreen)/exam/[id]/result/page.tsx`
- Test: `frontend/src/app/(fullscreen)/exam/[id]/result/page.test.tsx` (nếu có) hoặc vitest

- [ ] **Step 1: Bổ sung Component chuyển đổi Tabs giữa Lần 1 và Lần 2**
  - Hiển thị thanh tabs tinh tế phía trên kết quả:
    - `[ 🏅 Lần 1 (Chính thức): {score}đ ]`
    - `[ 🔄 Lần 2 (Ôn tập gần nhất): {score}đ ]`
  - Khi click tab, chuyển đổi dữ liệu bài làm/điểm số tương ứng với lần thi đó.
  - Thêm nút `Làm lại bài thi (Ôn tập)` ở cuối trang kết quả dẫn về `/exam/{examId}/take`.

- [ ] **Step 2: Kiểm tra build TypeScript**
Run: `npm run build` trong `frontend/`
Expected: Build thành công, 0 lỗi type.

- [ ] **Step 3: Commit**
```bash
git add frontend/src/app/\(fullscreen\)/exam/\[id\]/result/page.tsx
git commit -m "feat(ui): add attempt switcher tabs to exam result page"
```

---

### Task 5: Cập Nhật Giao Diện Làm Bài (`/exam/[id]/take`) & Danh Sách Đề Thi

**Files:**
- Modify: `frontend/src/app/(fullscreen)/exam/[id]/take/page.tsx`
- Modify: `frontend/src/app/(main)/(dashboardStudent)/exams/lop/[grade]/page.tsx`

- [ ] **Step 1: Cập nhật trang Làm bài (`take/page.tsx`)**
  - Nếu học sinh đã có bài nộp lần 1, hiển thị banner thông báo thân thiện:
    `"Bạn đang làm lại đề thi để ôn luyện kiến thức. Kết quả lần thi này sẽ được lưu vào Lần ôn tập (Lần 2) và không ảnh hưởng đến Điểm chính thức."`
  - Cho phép nộp bài bình thường, chuyển hướng đến trang kết quả Lần 2 sau khi nộp.

- [ ] **Step 2: Cập nhật trang danh sách đề thi (`exams/lop/[grade]/page.tsx`)**
  - Cột điểm số: Ưu tiên lấy điểm `attempt == 1` làm Điểm thi chính thức.
  - Nếu có `attempt == 2`: Hiển thị kèm `(Ôn tập: {score}đ)`.

- [ ] **Step 3: Kiểm tra toàn bộ tests frontend và TypeScript**
Run: `npm run build` trong `frontend/`
Expected: 0 errors.

- [ ] **Step 4: Commit**
```bash
git add frontend/src/app/\(fullscreen\)/exam/\[id\]/take/page.tsx frontend/src/app/\(main\)/\(dashboardStudent\)/exams/lop/\[grade\]/page.tsx
git commit -m "feat(ui): display retake banner on take page and show attempt 1/2 scores on exam list"
```

---

### Task 6: Kiểm Thử Toàn Diện & Triển Khai (Deploy VPS)

**Files:**
- Toàn bộ repo

- [ ] **Step 1: Chạy kiểm thử Backend Go (`go test ./...`) và build (`go build ./cmd/api`)**
- [ ] **Step 2: Chạy kiểm thử Frontend (`npm test`, `npm run build`)**
- [ ] **Step 3: Push code lên GitHub `origin/main`**
- [ ] **Step 4: Deploy Dokku Backend & Dokku Frontend lên VPS**
- [ ] **Step 5: Kiểm tra trực tiếp trên VPS qua HTTPS**
