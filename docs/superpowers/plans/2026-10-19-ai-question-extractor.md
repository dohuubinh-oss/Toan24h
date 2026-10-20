# AI Multi-Image Question Extractor & Google Drive Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow teachers to upload multiple photos of exam papers to automatically extract structured questions with Gemini Vision (formatting math to LaTeX, converting variation tables to HTML/LaTeX, and auto-cropping geometry/graph diagrams), and rename `book_name` to `gg_drive` with direct external link navigation.

**Architecture:**
1. Database & Go Models: Rename `book_name` to `gg_drive` in PostgreSQL and GORM models; update frontend `types/question.ts` and `QuestionSettingsSidebar.tsx` to display "Link Drive" with an external launch button.
2. Backend Image Cropper: Pure Go image cropping utility to cut detected diagram bounding boxes from source images and store them in `backend/uploads/extracted_diagrams/`.
3. Backend Gemini Extraction Service: Multi-image Gemini Vision caller prompting for Vietnamese math questions matching `QuestionBlock[]` JSON schema, post-processing diagrams, and exposing endpoint `POST /api/v1/questions/extract-ai`.
4. Frontend Modal & Integration: `AiQuestionExtractModal.tsx` allowing multi-image upload and Drive link input, wired into `dashboard/questions/create/page.tsx` to populate `questionBlocks`.

**Tech Stack:** Go 1.22+, Gin, GORM, PostgreSQL, Gemini Vision API, Next.js 16+, React 19, TypeScript, Vitest, Testing Library.

**Spec:** [docs/superpowers/specs/2026-10-19-ai-question-extractor-design.md](file:///Users/modeptrai/Desktop/toan6789.vn/docs/superpowers/specs/2026-10-19-ai-question-extractor-design.md)

## Global Constraints

- **Absolute Isolation:** All changes confined to `toan6789.vn`.
- **Strict TDD:** Write failing tests first for every backend and frontend unit.
- **Robust LaTeX & HTML:** Ensure formula syntax and table layouts conform to existing RichTextEditor rendering.
- **Resource Protection:** Limit total file upload size to 25MB across all images in a batch.

## Review Focus

1. **Database Backward Compatibility:** Ensure GORM migration or ALTER TABLE safely renames `book_name` without data loss.
2. **Diagram Cropping Bounds:** Verify coordinates (`[ymin, xmin, ymax, xmax]`) are clamped to actual image width/height to prevent panics.
3. **Invalid/Malformed Gemini Output:** If Gemini returns non-JSON or missing fields, gracefully return a helpful error rather than a 500 panic.
4. **Toast Context in Frontend Tests:** Wrap test renders in `<ToastProvider>`.
5. **Multi-page Image Ordering:** Ensure uploaded images preserve page order during Gemini analysis.

---

### Task 1: Rename `book_name` to `gg_drive` across Database, Backend, and Frontend

**Files:**
- Modify: `backend/internal/models/question.go`
- Modify: `backend/internal/handlers/question_handler.go`
- Modify: `backend/internal/handlers/exam_handler.go`
- Modify: `backend/internal/config/database.go` (or run DB migration)
- Modify: `frontend/src/types/question.ts`
- Modify: `frontend/src/components/questions/creator/QuestionSettingsSidebar.tsx`
- Modify: `frontend/src/components/questions/creator/QuestionSettingsSidebar.test.tsx`
- Modify: `frontend/src/app/(fullscreen)/dashboard/questions/create/page.tsx`

**Interfaces:**
- Produces: `GgDrive` field on `models.Question` and `gg_drive` in TypeScript `Question`.
- Produces: Sidebar UI with label "Link Drive" and `ExternalLink` anchor button.

- [ ] **Step 1: Write failing test in `QuestionSettingsSidebar.test.tsx`**
Update test to assert "Link Drive" label is present, input updates `gg_drive`, and external link button renders when URL is set.

- [ ] **Step 2: Run test to verify it fails**
Run: `npx vitest run src/components/questions/creator/QuestionSettingsSidebar.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Execute database column rename**
Run:
`docker-compose exec -T postgres psql -U admin -d toan24h -c "DO \$\$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='questions' AND column_name='book_name') THEN ALTER TABLE questions RENAME COLUMN book_name TO gg_drive; ALTER TABLE questions ALTER COLUMN gg_drive TYPE TEXT; END IF; END \$\$;"`

- [ ] **Step 4: Update Backend Models and Handlers**
- In `backend/internal/models/question.go`: Change `BookName` to `GgDrive string \`gorm:"type:text;column:gg_drive" json:"gg_drive"\``.
- Support alias in json tags so existing exam handlers and tests compile and function.
- In `backend/internal/handlers/question_handler.go` & `exam_handler.go`: update `BookName` references to `GgDrive`.

- [ ] **Step 5: Update Frontend Types, Sidebar, and Create Page**
- In `frontend/src/types/question.ts`: update `book_name?: string` to `gg_drive?: string`.
- In `frontend/src/components/questions/creator/QuestionSettingsSidebar.tsx`:
  - Change label to "Link Drive".
  - Change placeholder to "VD: https://drive.google.com/...".
  - Bind to `currentQuestion?.gg_drive`.
  - When `currentQuestion?.gg_drive` starts with `http`, show clickable `ExternalLink` icon button.
- In `frontend/src/app/(fullscreen)/dashboard/questions/create/page.tsx`:
  - Sync `field === 'gg_drive'` across all questions.

- [ ] **Step 6: Run tests and verify pass**
Run: `npx vitest run src/components/questions/creator/QuestionSettingsSidebar.test.tsx`
Expected: PASS.
Run: `cd backend && go test ./internal/handlers/...`
Expected: PASS.

- [ ] **Step 7: Commit changes**
`git add backend/ frontend/ && git commit -m "refactor(schema): rename book_name to gg_drive and add drive link navigation"`

---

### Task 2: Implement Backend Diagram Cropping Utility

**Files:**
- Create: `backend/internal/utils/image_cropper.go`
- Create: `backend/internal/utils/image_cropper_test.go`

**Interfaces:**
- Produces: `CropDiagram(srcImg image.Image, box []float64, outputDir string) (string, error)`
  - `box`: `[ymin, xmin, ymax, xmax]` normalized coordinates (0.0 to 1.0 or 0 to 1000).
  - Returns relative web path: `extracted_diagrams/<uuid>.jpg`.

- [ ] **Step 1: Write failing test for `CropDiagram`**
Create `backend/internal/utils/image_cropper_test.go` with a synthetic 500x500 test image, crop a 100x100 sub-region, verify file is created with valid dimensions and returns web URL.

- [ ] **Step 2: Run test to verify it fails**
Run: `cd backend && go test -v ./internal/utils/`
Expected: FAIL (file does not exist).

- [ ] **Step 3: Implement `image_cropper.go`**
- Use standard Go `image` package: `image.Rect`, `draw.Draw`.
- Handle normalized coordinate clamping (prevent bounds out of range).
- Save cropped image using `jpeg.Encode` with quality 85.
- Create parent directory `uploads/extracted_diagrams/` if not present.

- [ ] **Step 4: Run test to verify it passes**
Run: `cd backend && go test -v ./internal/utils/`
Expected: PASS.

- [ ] **Step 5: Commit changes**
`git add backend/internal/utils/image_cropper* && git commit -m "feat(backend): implement diagram cropping utility for extracted exam images"`

---

### Task 3: Implement Gemini Question Extraction Service & API Endpoint

**Files:**
- Create: `backend/internal/services/question_extractor.go`
- Create: `backend/internal/services/question_extractor_test.go`
- Create: `backend/internal/handlers/ai_question_handler.go`
- Modify: `backend/internal/routes/routes.go`

**Interfaces:**
- Consumes: `CropDiagram` from `utils`, `GEMINI_API_KEY`
- Produces: `POST /api/v1/questions/extract-ai` endpoint returning JSON array of `QuestionBlock`.

- [ ] **Step 1: Write failing unit test for extraction parser**
Test that raw Gemini JSON response with mathematical LaTeX, HTML variation table, and diagram bounding boxes is correctly parsed and transformed into `QuestionBlock[]` with injected `<img>` tags.

- [ ] **Step 2: Run test to verify it fails**
Run: `cd backend && go test -v ./internal/services/`
Expected: FAIL.

- [ ] **Step 3: Implement `question_extractor.go` and `ai_question_handler.go`**
- `ExtractQuestionsFromImages(files [][]byte, mimeTypes []string) ([]QuestionBlockOutput, error)`:
  - Formulate structured Gemini prompt with system instructions to format math to LaTeX `$..$`, tables to HTML/LaTeX text, and output bounding boxes `[ymin, xmin, ymax, xmax]` for diagrams.
  - Call Gemini Vision API (`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=...`).
  - For each diagram, call `CropDiagram` on the respective source image and replace placeholder with `<img src="/uploads/extracted_diagrams/..." />`.
- Handler `ExtractAIQuestions(c *gin.Context)`:
  - Read `files` from multipart form (max 10 images, max 25MB total).
  - Return extracted `blocks`.
- Register route in `routes.go`: `api.POST("/questions/extract-ai", aiQuestionHandler.ExtractAIQuestions)`.

- [ ] **Step 4: Run test to verify it passes**
Run: `cd backend && go test -v ./internal/services/ ./internal/handlers/`
Expected: PASS.

- [ ] **Step 5: Commit changes**
`git add backend/ && git commit -m "feat(api): implement /questions/extract-ai endpoint with Gemini Vision"`

---

### Task 4: Build `AiQuestionExtractModal` Component

**Files:**
- Create: `frontend/src/components/questions/creator/AiQuestionExtractModal.tsx`
- Create: `frontend/src/components/questions/creator/AiQuestionExtractModal.test.tsx`

**Interfaces:**
- Consumes: `apiFetch` from `@/lib/api`, `useToast` from `@/components/ui/ToastProvider`
- Produces: `<AiQuestionExtractModal isOpen={boolean} onClose={() => void} onExtracted={(blocks: QuestionBlock[], driveUrl: string) => void} />`

- [ ] **Step 1: Write unit tests for `AiQuestionExtractModal`**
Test rendering, file selection, removing a selected thumbnail, entering Drive URL, submitting form, calling upload endpoint, and executing `onExtracted`.

- [ ] **Step 2: Run test to verify failure**
Run: `npx vitest run src/components/questions/creator/AiQuestionExtractModal.test.tsx`
Expected: FAIL (file does not exist).

- [ ] **Step 3: Implement `AiQuestionExtractModal.tsx`**
- Multiple file selection (`<input type="file" multiple accept="image/*" />` + drag & drop).
- Image preview carousel / grid with image removal.
- Drive URL input field.
- Loading indicator with descriptive stages ("Đang gửi ảnh lên Gemini AI...", "Đang bóc tách câu hỏi & cắt hình vẽ...").
- Call backend `POST /questions/extract-ai` using `FormData`.
- Call `onExtracted(blocks, driveUrl)` and `onClose()`.

- [ ] **Step 4: Run test to verify it passes**
Run: `npx vitest run src/components/questions/creator/AiQuestionExtractModal.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit changes**
`git add frontend/src/components/questions/creator/AiQuestionExtractModal* && git commit -m "feat(ui): implement AiQuestionExtractModal for multi-image extraction"`

---

### Task 5: Integrate AI Modal into `CreateQuestionPage` & End-to-End Verification

**Files:**
- Modify: `frontend/src/app/(fullscreen)/dashboard/questions/create/page.tsx`
- Modify: `frontend/src/app/(fullscreen)/dashboard/questions/create/page.test.tsx`

**Interfaces:**
- Integrates `AiQuestionExtractModal` into question creator header/action bar.

- [ ] **Step 1: Add "Bóc tách đề bằng AI" button to `CreateQuestionPage`**
Add prominent button with Sparkles icon next to JSON input section.

- [ ] **Step 2: Handle `onExtracted` callback**
When AI extracts questions:
- Set `questionBlocks(extractedBlocks)`.
- If `driveUrl` was provided, automatically set `gg_drive: driveUrl` on all extracted questions.
- Display success toast: "Đã bóc tách thành công N câu hỏi từ ảnh đề thi!".
- Jump to Question 1 in the editor.

- [ ] **Step 3: Run full vitest suite on creator components**
Run: `npx vitest run src/components/questions/creator/`
Expected: All tests PASS.

- [ ] **Step 4: Run typecheck**
Run: `npx tsc --noEmit` in `frontend/`
Expected: 0 errors.

- [ ] **Step 5: Commit changes**
`git add frontend/ && git commit -m "feat(exam): integrate AI question extractor into create question page"`
