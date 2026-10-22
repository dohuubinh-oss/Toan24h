# Short Answer and Angle LaTeX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Chuyển đổi toàn diện trường `quick_solve_tips` ("Mẹo giải nhanh") thành `short_answer` ("Lời giải ngắn") trên toàn bộ hệ thống (Prompt AI, Database PostgreSQL, Backend Go, Frontend Next.js) và bổ sung quy chuẩn bắt buộc ký hiệu góc hình học bằng dấu mũ LaTeX (`\hat{A} = \hat{C}`, `\widehat{ABC}`).

**Architecture:** 
1. Cập nhật Prompt AI và JSON Schema để hướng dẫn Gemini xuất ra `short_answer` (lời giải ngắn gọn nhất, ưu tiên trích xuất nếu có sẵn, hoặc tự giải cô đọng) và quy định góc viết bằng `\hat{...}` / `\widehat{...}`.
2. Cập nhật Backend GORM model `Question` (cột `short_answer`), tự động migrate an toàn cột CSDL từ `quick_solve_tips` sang `short_answer`, hỗ trợ fallback 2 chiều tránh phá vỡ API hiện có.
3. Cập nhật Frontend types, Giao diện biên tập `QuestionEditorSection` (nhãn "Lời giải ngắn"), component `AIHintPanel`, `JsonInputSection`, `AiQuestionExtractModal` và client API mapping.

**Tech Stack:** Go (Gin, GORM, PostgreSQL), TypeScript, Next.js 16, React, Tailwind CSS, Jest/Vitest.

**Spec:** Thảo luận và thống nhất tại phiên Brainstorming ngày 2026-10-22:
- Bổ sung quy tắc ký hiệu góc LaTeX: `\hat{A} = \hat{C}` (1 chữ cái), `\widehat{ABC}` (3 chữ cái), cấm `\angle` hoặc `∠`.
- Đổi `quick_solve_tips` thành `short_answer`: "Lời giải ngắn" - ngắn gọn, học sinh nhìn vào là biết cách giải; nếu có sẵn đáp án thì đưa vào, nếu không thì AI bắt buộc tự sinh lời giải ngắn nhất.

## Global Constraints
- Không làm mất hoặc xáo trộn dữ liệu hiện có trong bảng `questions` của PostgreSQL.
- Giữ cơ chế fallback để tương thích ngược: nếu client/file JSON cũ gửi `quick_solve_tips`, hệ thống vẫn nhận và lưu vào `short_answer`.
- Tất cả unit tests backend (`go test ./...`) và frontend test suite liên quan phải chạy PASS 100%.

## Review Focus
1. Nhập JSON cũ chỉ có `quick_solve_tips`: phải tự động map sang `short_answer` ở cả Frontend và Backend.
2. Nhập JSON mới có `short_answer`: lưu đúng vào cột `short_answer` và trả về đúng cho client.
3. Câu hỏi hình học khi AI bóc tách: biểu thức góc phải tuân thủ dạng `\hat{A}` hoặc `\widehat{ABC}`.
4. Giao diện `QuestionEditorSection`: hiển thị đúng nhãn "Lời giải ngắn", binding 2 chiều lưu và sửa thành công.
5. Học sinh mở bảng gợi ý `AIHintPanel`: cấp độ 3 hiển thị đúng tiêu đề "Lời giải ngắn" và nội dung từ `short_answer`.

---

### Task 1: Cập nhật Prompt AI bóc tách và File JSON mẫu

**Files:**
- Modify: `backend/internal/services/question_extractor.go:640-735`
- Modify: `jsonexamp.json:1-55`
- Modify: `frontend/src/components/questions/creator/JsonInputSection.tsx:20-130`

**Interfaces:**
- JSON Schema output: đổi trường `"quick_solve_tips"` thành `"short_answer"`.
- Quy tắc công thức toán: thêm điều khoản ký hiệu góc LaTeX `\hat{A} = \hat{C}`, `\widehat{ABC}`.

- [x] **Step 1: Cập nhật prompt trong `question_extractor.go`**
  - Tại quy tắc công thức toán: bổ sung hướng dẫn "Ký hiệu góc hình học BẮT BUỘC dùng dấu mũ trên đỉnh chữ cái theo cú pháp LaTeX chuẩn: dùng `\hat{A}`, `\hat{B}` cho góc 1 chữ cái hoặc `\widehat{ABC}` cho góc 3 chữ cái (ví dụ: `\hat{A} = \hat{C}`, `\widehat{ABC} = 60^\circ`). Tuyệt đối KHÔNG dùng `\angle` hay ký tự Unicode `∠`."
  - Tại mục 16 quy tắc bóc tách: đổi `"quick_solve_tips"` thành `"short_answer": Lời giải ngắn gọn, cô đọng nhất giúp học sinh nhìn vào là biết ngay cách giải bài toán. Nếu đề bài/tài liệu gốc có sẵn đáp án mẫu hoặc lời giải vắn tắt thì trích xuất vào; nếu không có thì AI bắt buộc phải tự giải và sinh ra lời giải ngắn gọn, súc tích nhất.`
  - Tại JSON Schema mẫu và phần ví dụ: thay thế `"quick_solve_tips"` bằng `"short_answer"`.

- [x] **Step 2: Cập nhật `jsonexamp.json`**
  - Cập nhật quy tắc ký hiệu góc mũ và thay thế `"quick_solve_tips"` thành `"short_answer"`.

- [x] **Step 3: Cập nhật `QUESTION_JSON_HINT` và `QUESTION_AI_PROMPT_TEMPLATE` trong `JsonInputSection.tsx`**
  - Đồng bộ nội dung schema gợi ý và template prompt với `short_answer` và ký hiệu góc.

- [x] **Step 4: Kiểm tra cú pháp và build thử**
  - Chạy: `go vet ./internal/services/...`
  - Expected: PASS

---

### Task 2: Backend Extractor Service & Model DTO Support `short_answer`

**Files:**
- Modify: `backend/internal/services/question_extractor.go:45-75`
- Modify: `backend/internal/services/question_extractor.go:400-530`
- Modify: `backend/internal/services/question_extractor_test.go`

**Interfaces:**
- `ExtractedQuestionItem`: thêm `ShortAnswer string `json:"short_answer"`` và giữ `QuickSolveTips string `json:"quick_solve_tips,omitempty"``.
- Logic hậu xử lý: đồng bộ 2 chiều giữa `ShortAnswer` và `QuickSolveTips` nếu một trong hai rỗng.

- [x] **Step 1: Viết test case kiểm tra fallback và trích xuất `short_answer`**
  - Trong `question_extractor_test.go`: viết unit test `TestParseAndProcessExtractedBlocks_ShortAnswer` kiểm tra:
    + JSON có `short_answer` -> `item.ShortAnswer` nhận đúng giá trị.
    + JSON cũ chỉ có `quick_solve_tips` -> `item.ShortAnswer` tự động nhận giá trị từ `quick_solve_tips`.

- [x] **Step 2: Chạy test để xác nhận test chạy và phản ánh đúng hành vi**
  - Chạy: `go test -run TestParseAndProcessExtractedBlocks_ShortAnswer ./internal/services/...`

- [x] **Step 3: Triển khai struct và logic gán trong `question_extractor.go`**
  - Cập nhật `ExtractedQuestionItem` có `ShortAnswer` và `QuickSolveTips`.
  - Trong vòng lặp chuẩn hóa câu hỏi:
    ```go
    if q.ShortAnswer == "" && q.QuickSolveTips != "" {
        q.ShortAnswer = q.QuickSolveTips
    } else if q.QuickSolveTips == "" && q.ShortAnswer != "" {
        q.QuickSolveTips = q.ShortAnswer
    }
    ```

- [x] **Step 4: Chạy test để xác nhận PASS**
  - Chạy: `go test -v -run TestParseAndProcessExtractedBlocks_ShortAnswer ./internal/services/...`
  - Expected: PASS

---

### Task 3: Database & Backend Model / Handlers Migration

**Files:**
- Modify: `backend/internal/models/question.go`
- Modify: `backend/internal/config/database.go`
- Modify: `backend/internal/handlers/question_handler.go`
- Modify: `backend/internal/services/image_cleanup_service.go`
- Test: `backend/internal/handlers/question_handler_test.go` hoặc `backend/internal/models/question_test.go`

**Interfaces:**
- `models.Question`: Cột DB `short_answer`, DTO `shortAnswer` và `short_answer`.
- `QuestionDetail` DTO: Nhận `short_answer` hoặc `quick_solve_tips`.
- Migration: Đổi tên cột CSDL từ `quick_solve_tips` sang `short_answer` an toàn nếu cột cũ tồn tại.

- [x] **Step 1: Viết test cho Model Question về mapping `ShortAnswer`**
  - Kiểm tra `BeforeCreate` / `AfterFind` khi serialize/deserialize model với `ShortAnswer` và `QuickSolveTips`.

- [x] **Step 2: Cập nhật `models/question.go`**
  - Đổi field trong `Question`:
    ```go
    ShortAnswer     string `gorm:"type:text;column:short_answer" json:"shortAnswer,omitempty"`
    QuickSolveTips  string `gorm:"-" json:"quickSolveTips,omitempty"`
    ```
  - Cập nhật hook `BeforeCreate` và `AfterFind` để đồng bộ fallback giữa `ShortAnswer` và `QuickSolveTips`.

- [x] **Step 3: Cập nhật an toàn CSDL trong `config/database.go`**
  - Thêm logic migration trước/sau `AutoMigrate`:
    ```go
    if DB.Migrator().HasColumn(&models.Question{}, "quick_solve_tips") && !DB.Migrator().HasColumn(&models.Question{}, "short_answer") {
        _ = DB.Migrator().RenameColumn(&models.Question{}, "quick_solve_tips", "short_answer")
    }
    ```

- [x] **Step 4: Cập nhật `question_handler.go` và `image_cleanup_service.go`**
  - Trong `sanitizeQuestionForPublic`: reset `q.ShortAnswer = ""` và `q.QuickSolveTips = ""`.
  - Trong `QuestionDetail` DTO: bổ sung `ShortAnswer string `json:"short_answer"``, ưu tiên lấy `short_answer` (fallback sang `quick_solve_tips`).
  - Trong `image_cleanup_service.go`: cập nhật câu query kiểm tra ảnh mồ côi từ `quick_solve_tips LIKE ?` sang `short_answer LIKE ?`.

- [x] **Step 5: Chạy toàn bộ backend test**
  - Chạy: `go test ./...`
  - Expected: ALL PASS

---

### Task 4: Frontend Types, Creator & Display Components Update

**Files:**
- Modify: `frontend/src/types/question.ts`
- Modify: `frontend/src/lib/api.ts`
- Modify: `frontend/src/components/questions/creator/QuestionEditorSection.tsx`
- Modify: `frontend/src/components/questions/creator/JsonInputSection.tsx`
- Modify: `frontend/src/components/questions/creator/AiQuestionExtractModal.tsx`
- Modify: `frontend/src/components/exam/taking/AIHintPanel.tsx`

**Interfaces:**
- `Question` interface: thêm `short_answer?: string;`, giữ `quick_solve_tips?: string;` làm optional.
- Editor UI: hiển thị nhãn "Lời giải ngắn" (icon Zap/FileText), liên kết với `updateQuestion('short_answer', val)`.
- Student Hint Panel: Cấp độ 3 hiển thị "Lời giải ngắn", lấy `question.short_answer || question.quick_solve_tips`.

- [x] **Step 1: Cập nhật `frontend/src/types/question.ts`**
  - Thêm `short_answer?: string;` vào interface `Question`.

- [x] **Step 2: Cập nhật `frontend/src/lib/api.ts`**
  - Tại hàm map câu hỏi gửi lên và nhận về từ backend:
    + `short_answer: q.short_answer ?? q.shortAnswer ?? q.quick_solve_tips ?? q.quickSolveTips`
    + `shortAnswer: data.short_answer ?? data.shortAnswer ?? data.quick_solve_tips ?? data.quickSolveTips`
    + Giữ cả key `quick_solve_tips` để tương thích.

- [x] **Step 3: Cập nhật `QuestionEditorSection.tsx`**
  - Đổi label tại khối mẹo giải nhanh thành:
    ```tsx
    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
      <Zap className="w-4 h-4 text-amber-500" /> Lời giải ngắn
    </label>
    <RichTextEditor
      hideToolbar={true}
      content={currentQuestion?.short_answer || currentQuestion?.quick_solve_tips || ''}
      onChange={(val) => {
        updateQuestion('short_answer', val)
        updateQuestion('quick_solve_tips', val)
      }}
    />
    ```

- [x] **Step 4: Cập nhật `JsonInputSection.tsx` và `AiQuestionExtractModal.tsx`**
  - Trong `JsonInputSection.tsx`: tại hàm `handleProcess`:
    ```typescript
    if (!processedQ.short_answer && (processedQ as any).quick_solve_tips) {
      processedQ.short_answer = (processedQ as any).quick_solve_tips;
    }
    ```
  - Trong `AiQuestionExtractModal.tsx`:
    ```typescript
    short_answer: q.short_answer || q.quick_solve_tips || '',
    quick_solve_tips: q.short_answer || q.quick_solve_tips || '',
    ```

- [x] **Step 5: Cập nhật `AIHintPanel.tsx`**
  - Đổi level 3 thành:
    ```tsx
    { level: 3, title: 'Lời giải ngắn', icon: Zap, content: question.short_answer || question.quick_solve_tips, color: 'amber' }
    ```

- [x] **Step 6: Chạy kiểm tra TypeScript và unit tests frontend**
  - Chạy: `cd frontend && npm test -- --run` hoặc kiểm tra build type: `npm run build` / vitest.

---

### Task 5: End-to-End Verification & Sanity Check

**Files:**
- Verification only

- [x] **Step 1: Chạy toàn bộ backend test suite**
  - Command: `cd backend && go test -v ./...`
  - Expected: Code 0, tất cả packages pass.

- [x] **Step 2: Chạy toàn bộ frontend test suite**
  - Command: `cd frontend && npm test`
  - Expected: Code 0, không có test hồi quy nào bị hỏng.

- [x] **Step 3: Kiểm tra git diff tổng thể**
  - Rà soát các thay đổi đảm bảo tính surgical, tuân thủ Karpathy Principles.
