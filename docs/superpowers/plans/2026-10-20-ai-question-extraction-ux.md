# AI Question Extraction UX & Automated JSON Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hoàn thiện trải nghiệm bóc tách đề thi ở trang tạo câu hỏi: đổi tên nút thành "Bóc tách câu hỏi", tự động điền chuỗi JSON vào ô "Nhập nhanh bằng JSON" và tự động xử lý vào component, tự động xuống dòng và format HTML (giống trang bài giảng) cho Nội dung & Lời giải, đảm bảo bắt buộc có Đáp án (Trắc nghiệm/Tự luận) dạng LaTeX chuẩn.

**Architecture:** Tạo tiện ích `questionTextFormatter.ts` để đồng bộ cơ chế chuyển đổi văn bản sang HTML (đoạn `<p>`, xuống hàng `<br/>`, danh sách `<ul>`, `<ol>`). Nâng cấp `AiQuestionExtractModal` đổi tên nút và phát sinh chuỗi `rawJson`, nối trực tiếp vào `JsonInputSection` qua prop `initialValue` trong `CreateQuestionContent`. Tối ưu prompt và post-processing trong `question_extractor.go` ở backend để bảo đảm luôn có `correct_answer` dạng LaTeX.

**Tech Stack:** Next.js 16, TypeScript, React 19, Vitest, Go Fiber/Gin, Gemini Vision.

**Spec:** [docs/superpowers/specs/2026-10-20-ai-question-extraction-ux-design.md](file:///Users/modeptrai/Desktop/toan6789.vn/docs/superpowers/specs/2026-10-20-ai-question-extraction-ux-design.md)

## Global Constraints
- **NO AUTO DEPLOY TO VPS**: Tuyệt đối không tự ý deploy lên VPS. Chỉ kiểm thử cục bộ và commit/push lên Git.
- **TDD Principle**: Viết test trước, kiểm tra fail, implement minimal code và kiểm tra pass trước khi commit mỗi task.

## Review Focus
1. Chuỗi có chứa sẵn HTML hoặc KaTeX `$..$` không bị escape hoặc hỏng format khi qua `formatTextToHtml`.
2. Phương án trắc nghiệm có chứa công thức LaTeX tự động khớp đúng với `correct_answer` để radio button được active.
3. Khi AI hoàn tất bóc tách, ô Textarea trong `JsonInputCard` được điền đúng chuỗi JSON vừa bóc tách.
4. Câu hỏi tự luận kích hoạt đúng tab "Tự luận" và hiển thị đáp án mẫu trong editor.
5. Danh sách câu hỏi chùm (group) giữ nguyên `shared_content` và các câu con.

---

### Task 1: Question Text to HTML Formatter Utility

**Files:**
- Create: `frontend/src/components/questions/creator/utils/questionTextFormatter.ts`
- Create test: `frontend/src/components/questions/creator/utils/questionTextFormatter.test.ts`

- [ ] **Step 1: Write unit tests for `formatTextToHtml` and question formatting in `questionTextFormatter.test.ts`**
  Tests:
  - Text with single newlines gets wrapped in `<p>` with `<br/>`.
  - Text with bullet points (`- `, `* `, `• `) converts to `<ul><li>`.
  - Text with numbered list (`1. `, `2. `) converts to `<ol><li>`.
  - Preserves existing HTML block elements (`<p>`, `<div>`, `<ul>`, `<table>`).
  - Preserves LaTeX formulas `$x = 2$`, `$$\frac{a}{b}$$`.

- [ ] **Step 2: Run test to verify it fails**
  Run: `npm test -- src/components/questions/creator/utils/questionTextFormatter.test.ts --run` in `frontend/`
  Expected: FAIL (file not found).

- [ ] **Step 3: Implement `questionTextFormatter.ts`**
  Implement `cleanCitations`, `formatTextToHtml`, `formatQuestionContent`, and `formatSolutionGuide`.

- [ ] **Step 4: Run test to verify it passes**
  Run: `npm test -- src/components/questions/creator/utils/questionTextFormatter.test.ts --run` in `frontend/`
  Expected: PASS.

- [ ] **Step 5: Commit Task 1**
  Commit: `feat(questions): add questionTextFormatter utility for auto-line-breaks and HTML formatting`

---

### Task 2: Integrate Formatter into JsonInputSection

**Files:**
- Modify: `frontend/src/components/questions/creator/JsonInputSection.tsx`
- Create or modify test: `frontend/src/components/questions/creator/JsonInputSection.test.tsx`

- [ ] **Step 1: Write test in `JsonInputSection.test.tsx`**
  Tests:
  - Accepting `initialValue` prop and rendering it in textarea.
  - Multi-line question content and solution guide are automatically converted to HTML paragraphs with line breaks upon `handleProcess`.

- [ ] **Step 2: Run test to verify failure**
  Run: `npm test -- src/components/questions/creator/JsonInputSection.test.tsx --run` in `frontend/`
  Expected: FAIL.

- [ ] **Step 3: Update `JsonInputSection.tsx`**
  - Add `initialValue?: string` to `JsonInputSectionProps`.
  - Pass `initialValue` to `JsonInputCard`.
  - In `handleProcess`: apply `formatQuestionContent` to `q.content` and `formatSolutionGuide` to `q.solution_guide`.

- [ ] **Step 4: Run test to verify it passes**
  Run: `npm test -- src/components/questions/creator/JsonInputSection.test.tsx --run` in `frontend/`
  Expected: PASS.

- [ ] **Step 5: Commit Task 2**
  Commit: `feat(questions): integrate HTML text formatting and initialValue in JsonInputSection`

---

### Task 3: Rename Submit Button & Output JSON in AiQuestionExtractModal

**Files:**
- Modify: `frontend/src/components/questions/creator/AiQuestionExtractModal.tsx`
- Modify: `frontend/src/components/questions/creator/AiQuestionExtractModal.test.tsx`

- [ ] **Step 1: Update tests in `AiQuestionExtractModal.test.tsx`**
  - Change assertion for button label: expect `Bóc tách câu hỏi` instead of `Bắt đầu bóc tách`.
  - Verify that `onExtracted` is called with sanitized blocks and JSON string.

- [ ] **Step 2: Run test to verify it fails**
  Run: `npm test -- src/components/questions/creator/AiQuestionExtractModal.test.tsx --run` in `frontend/`
  Expected: FAIL (button with text "Bóc tách câu hỏi" not found).

- [ ] **Step 3: Update `AiQuestionExtractModal.tsx`**
  - Change submit button text: `Bắt đầu bóc tách` -> `Bóc tách câu hỏi`.
  - Update `onExtracted` to pass `(blocks: QuestionBlock[], rawJson?: string)`.
  - Apply `formatQuestionContent` and `formatSolutionGuide` to extracted blocks before passing to `onExtracted`.

- [ ] **Step 4: Run test to verify it passes**
  Run: `npm test -- src/components/questions/creator/AiQuestionExtractModal.test.tsx --run` in `frontend/`
  Expected: PASS.

- [ ] **Step 5: Commit Task 3**
  Commit: `feat(questions): rename extract button to 'Bóc tách câu hỏi' and pass formatted JSON string`

---

### Task 4: Auto-Fill & Auto-Process JSON in Create Question Page

**Files:**
- Modify: `frontend/src/app/(fullscreen)/dashboard/questions/create/page.tsx`

- [ ] **Step 1: Update `page.tsx` state and handler**
  - Add state `const [extractedJson, setExtractedJson] = useState('')`.
  - Pass `initialValue={extractedJson}` to `<JsonInputSection ... />`.
  - In `handleAiExtracted(blocks: QuestionBlock[], rawJson?: string)`:
    - `const jsonStr = rawJson || JSON.stringify(blocks, null, 2)`
    - `setExtractedJson(jsonStr)`
    - `setQuestionBlocks(blocks)`
    - `setCurrentBlockIndex(0)`
    - `setCurrentQuestionIndex(0)`
    - `scrollToEditor()`
    - Toast success message.

- [ ] **Step 2: Verify TypeScript and tests**
  Run: `npx tsc --noEmit` and `npm test -- src/components/questions/creator/AiQuestionExtractModal.test.tsx --run` in `frontend/`
  Expected: PASS with 0 errors.

- [ ] **Step 3: Commit Task 4**
  Commit: `feat(questions): auto-fill JSON textarea and process questions upon AI extraction`

---

### Task 5: Backend Prompt Hardening for Guaranteed Answer & LaTeX

**Files:**
- Modify: `backend/internal/services/question_extractor.go`
- Modify or create test: `backend/internal/services/question_extractor_test.go`

- [ ] **Step 1: Write test for answer mapping in `question_extractor_test.go`**
  Test that if Gemini returns option letters (e.g. `correct_answer: "A"` or `"A. $x = 2$"`), post-processing normalizes it to the exact option content `"$x = 2$"`.
  Test that essay question (`type == "Tự luận"`) retains `correct_answer` LaTeX formula.

- [ ] **Step 2: Run test to verify behavior**
  Run: `go test -v -run TestNormalizeQuestionAnswer ./internal/services/...` in `backend/`

- [ ] **Step 3: Update `question_extractor.go`**
  - Củng cố prompt: BẮT BUỘC trường `correct_answer` không được để trống cho cả trắc nghiệm và tự luận.
  - Thêm logic ánh xạ: nếu trắc nghiệm có `correct_answer` dạng letter (`A`, `B`, `C`, `D`), tự động lấy chuỗi `options[idx]`.

- [ ] **Step 4: Run test to verify it passes**
  Run: `go test -v -run TestNormalizeQuestionAnswer ./internal/services/...` in `backend/`
  Expected: PASS.

- [ ] **Step 5: Commit Task 5**
  Commit: `feat(ai): guarantee valid LaTeX correct_answer and option normalization in question extractor`

---

### Task 6: Full Verification & Git Push

- [ ] **Step 1: Run all backend tests**
  Run: `go test ./internal/utils/... ./internal/middleware/... ./internal/controllers/... ./internal/handlers/...` in `backend/`
  Expected: PASS.

- [ ] **Step 2: Run frontend tests & build**
  Run: `npm test -- src/components/questions/creator/ --run` in `frontend/`
  Run: `npm run build` in `frontend/`
  Expected: PASS with 0 errors.

- [ ] **Step 3: Push commits to GitHub `origin main`**
  Run: `git push origin main`
  > [!IMPORTANT]
  > DO NOT deploy to Dokku VPS!
