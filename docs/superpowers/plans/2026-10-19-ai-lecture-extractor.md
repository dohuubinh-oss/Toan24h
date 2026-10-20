# AI Lecture Math-Type & Step-by-Step Example Extractor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Provide an AI-powered extraction pipeline in the lecture creator page (`/dashboard/lectures/create`) allowing teachers to upload multi-page photos/scans of lecture materials and textbooks, automatically digitizing Math Types (`mathType`), Methods, and Example Problems (`problems`) with step-by-step solutions (Gemini autonomously solving missing solutions), auto-cropping geometry diagrams into `./uploads/temp/<uuid>.jpg`, and loading directly into `JsonInputCard` and `dangToanList`.

**Architecture:**
- **Backend (Go/Gin):** Service `lecture_extractor.go` communicates with Gemini Vision API with a lecture-specific prompt, processes diagram bounding boxes using `utils.CropDiagram` into `./uploads/temp/<uuid>.jpg`, replaces tokens with `<img>` tags, and exposes `POST /api/v1/lectures/extract-ai` in staff group.
- **Frontend (Next.js/React):** An `AiLectureExtractModal` component allows multi-image upload with thumbnail previews and live loading feedback. `JsonInputCard` in `LectureContentEditor.tsx` renders `[ ⬆ Tải ảnh Dạng toán/ Ví dụ mẫu ]` beside `[ ✨ Định dạng ]`. On extraction, JSON is loaded into the card and immediately parsed into `dangToanList` via `parseLectureJson`.

**Tech Stack:** Go (Gin, image/jpeg, standard library), Next.js 16 (React 19, TypeScript), Vitest, Tailwind CSS, Google Gemini 1.5 Flash Vision.

**Spec:** [docs/superpowers/specs/2026-10-19-ai-lecture-extractor-design.md](file:///Users/modeptrai/Desktop/toan6789.vn/docs/superpowers/specs/2026-10-19-ai-lecture-extractor-design.md)

## Global Constraints
- Confined strictly to repository root `/Users/modeptrai/Desktop/toan6789.vn`.
- Maximum 10 images per extraction request, maximum 25MB total upload limit.
- Cropped images must strictly save to `./uploads/temp/<uuid>.jpg` to utilize existing `lecture_service.go` image persistence lifecycle.
- LaTeX formulas must use `$...$` (inline) and `$$...$$` (display).
- Tables (variation/sign tables) must be converted directly to clean HTML/Markdown tables.
- If an example problem has no existing solution, Gemini must solve it step-by-step with formulas and conclusion.

## Review Focus
- Empty/invalid image uploads: Reject with friendly 400 Bad Request error.
- Gemini response with markdown fences (````json ... ````): Cleanly strip fences before JSON parsing.
- Diagram out of bounds or invalid bounding box: Skip cropping gracefully without crashing the whole request.
- Lecture creator without any Dạng toán: Populate cleanly without corrupting existing lecture metadata (title, grade, basicConcept).

---

### Task 1: Backend Gemini Lecture Extractor Service

**Files:**
- Create: `backend/internal/services/lecture_extractor.go`
- Test: `backend/internal/services/lecture_extractor_test.go`

**Interfaces:**
- Consumes: `utils.CropDiagram(img image.Image, box []float64, tempDir string) (string, error)`
- Produces: `services.ExtractLectureFromImages(files [][]byte, mimeTypes []string) ([]byte, error)` and `services.ParseAndProcessExtractedLecture(rawJson string, sourceImages []image.Image, tempDir string) (string, error)`

- [ ] **Step 1: Write the failing test for lecture extractor**

```go
package services

import (
	"image"
	"image/color"
	"os"
	"strings"
	"testing"
)

func TestParseAndProcessExtractedLecture(t *testing.T) {
	tempDir := "./test_uploads_temp_lecture"
	_ = os.MkdirAll(tempDir, os.ModePerm)
	defer os.RemoveAll(tempDir)

	mockImg := image.NewRGBA(image.Rect(0, 0, 200, 200))
	for y := 0; y < 200; y++ {
		for x := 0; x < 200; x++ {
			mockImg.Set(x, y, color.RGBA{R: 200, G: 100, B: 50, A: 255})
		}
	}

	rawJson := `[
		{
			"mathType": "Dạng 1: Rút gọn biểu thức",
			"methods": [
				{
					"methodName": "Phương pháp chung",
					"solution": "Áp dụng hằng đẳng thức [DIAGRAM_0_1]",
					"problems": [
						{
							"problem": "Ví dụ 1: Cho hình vẽ [DIAGRAM_0_1] và rút gọn.",
							"steps": [
								{ "step": 1, "title": "Bước 1", "content": "Khai triển", "formula": "A = x^2 - 1" }
							],
							"conclusion": "Vậy A = x^2 - 1"
						}
					]
				}
			],
			"diagrams": [
				{
					"image_index": 0,
					"box_2d": [100, 100, 800, 800],
					"placeholder": "[DIAGRAM_0_1]"
				}
			]
		}
	]`

	processedJson, err := ParseAndProcessExtractedLecture(rawJson, []image.Image{mockImg}, tempDir)
	if err != nil {
		t.Fatalf("ParseAndProcessExtractedLecture failed: %v", err)
	}

	if !strings.Contains(processedJson, "<img src=\"/uploads/temp/") {
		t.Errorf("Expected placeholder [DIAGRAM_0_1] to be replaced with <img> tag, got: %s", processedJson)
	}
	if strings.Contains(processedJson, "[DIAGRAM_0_1]") {
		t.Errorf("Did not expect placeholder to remain in output JSON")
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && go test -v ./internal/services -run TestParseAndProcessExtractedLecture`
Expected: FAIL (compilation error, `ParseAndProcessExtractedLecture` undefined)

- [ ] **Step 3: Implement `lecture_extractor.go`**

Implement `ParseAndProcessExtractedLecture` and `ExtractLectureFromImages`:
- Read `GEMINI_API_KEY` and model from environment.
- Construct Gemini prompt requiring Vietnamese math lecture structure (`mathType`, `methods`, `solution`, `problems`, `steps`, `conclusion`).
- Require Gemini to solve any example problem that has no existing solution step-by-step.
- Bounding box diagram cropping via `utils.CropDiagram`.
- Clean strip markdown fences and return formatted JSON string.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && go test -v ./internal/services -run TestParseAndProcessExtractedLecture`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/internal/services/lecture_extractor.go backend/internal/services/lecture_extractor_test.go
git commit -m "feat(backend): implement gemini lecture extractor service and diagram cropping"
```

---

### Task 2: Backend Route & Handler for Lecture Extraction

**Files:**
- Create: `backend/internal/handlers/ai_lecture_handler.go`
- Modify: `backend/internal/routes/routes.go`

**Interfaces:**
- Consumes: `services.ExtractLectureFromImages`
- Produces: `handlers.ExtractAILecture(c *gin.Context)`
- Route: `POST /api/v1/lectures/extract-ai`

- [ ] **Step 1: Create handler `ai_lecture_handler.go`**

Implement `handlers.ExtractAILecture(c *gin.Context)`:
- Parse multipart form `files` (validate max 10 files, total size <= 25MB).
- Read bytes and MIME types.
- Call `services.ExtractLectureFromImages(fileBytesList, mimeTypes)`.
- Return `c.JSON(http.StatusOK, gin.H{ "status": "success", "data": jsonResult })`.

- [ ] **Step 2: Register route in `routes.go`**

In `backend/internal/routes/routes.go` under `staff.Group("")`:
```go
staff.POST("/lectures/extract-ai", handlers.ExtractAILecture)
```

- [ ] **Step 3: Verify backend compilation and tests**

Run: `cd backend && go build ./cmd/api && go test ./internal/services ./internal/handlers`
Expected: PASS (exits with code 0)

- [ ] **Step 4: Commit**

```bash
git add backend/internal/handlers/ai_lecture_handler.go backend/internal/routes/routes.go
git commit -m "feat(backend): register POST /api/v1/lectures/extract-ai endpoint"
```

---

### Task 3: Frontend `AiLectureExtractModal` Component

**Files:**
- Create: `frontend/src/components/lecture/creator/AiLectureExtractModal.tsx`
- Test: `frontend/src/components/lecture/creator/AiLectureExtractModal.test.tsx`

**Interfaces:**
- Consumes: `apiFetch`
- Produces: `<AiLectureExtractModal isOpen={isOpen} onClose={onClose} onExtracted={(jsonString: string) => void} />`

- [ ] **Step 1: Write the failing test for `AiLectureExtractModal`**

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import AiLectureExtractModal from './AiLectureExtractModal'
import { ToastProvider } from '@/components/ui/ToastProvider'
import * as api from '@/lib/api'

vi.mock('@/lib/api', () => ({
  apiFetch: vi.fn(),
}))

describe('AiLectureExtractModal Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
    window.URL.revokeObjectURL = vi.fn()
  })

  it('renders modal when open and handles file selection and submission', async () => {
    const mockJson = `[{"mathType": "Dạng 1", "methods": []}]`
    vi.mocked(api.apiFetch).mockResolvedValueOnce({
      status: 'success',
      data: mockJson,
    })

    const onExtractedMock = vi.fn()
    const onCloseMock = vi.fn()

    render(
      <ToastProvider>
        <AiLectureExtractModal isOpen={true} onClose={onCloseMock} onExtracted={onExtractedMock} />
      </ToastProvider>
    )

    expect(screen.getByText(/Bóc tách Dạng toán & Bài tập mẫu bằng AI/i)).toBeInTheDocument()

    const file = new File(['dummy'], 'lecture_p1.jpg', { type: 'image/jpeg' })
    const input = screen.getByLabelText(/Chọn ảnh bài giảng/i)
    fireEvent.change(input, { target: { files: [file] } })

    expect(screen.getByText('lecture_p1.jpg')).toBeInTheDocument()

    const submitBtn = screen.getByRole('button', { name: /Bắt đầu bóc tách/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(api.apiFetch).toHaveBeenCalledWith('/lectures/extract-ai', expect.any(Object))
      expect(onExtractedMock).toHaveBeenCalledWith(mockJson)
      expect(onCloseMock).toHaveBeenCalled()
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run src/components/lecture/creator/AiLectureExtractModal.test.tsx`
Expected: FAIL (module not found)

- [ ] **Step 3: Implement `AiLectureExtractModal.tsx`**

Build modal UI matching the clean style of `AiQuestionExtractModal`:
- Drag & Drop zone and multi-file input (`accept="image/*"`).
- Page thumbnail grid with page indicators ("Trang 1", "Trang 2") and delete buttons.
- Animated progress bar and status indicator: "Gemini AI đang bóc tách dạng toán, phương pháp & giải chi tiết các ví dụ mẫu...".
- Calls `/lectures/extract-ai` and triggers `onExtracted(rawJsonString)`.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run src/components/lecture/creator/AiLectureExtractModal.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/lecture/creator/AiLectureExtractModal.tsx frontend/src/components/lecture/creator/AiLectureExtractModal.test.tsx
git commit -m "feat(frontend): create AiLectureExtractModal component for lecture creator"
```

---

### Task 4: Integration with `JsonInputCard` and `LectureContentEditor`

**Files:**
- Modify: `frontend/src/components/common/JsonInputCard.tsx` (support custom `aiButtonText`)
- Modify: `frontend/src/components/lecture/creator/LectureContentEditor.tsx`
- Test: `frontend/src/components/lecture/creator/LectureContentEditor.test.tsx`

**Interfaces:**
- Consumes: `<AiLectureExtractModal>`, `JsonInputCardProps.aiButtonText`
- Produces: Seamless one-click AI lecture extraction triggering interactive `dangToanList` population.

- [ ] **Step 1: Enhance `JsonInputCard` with `aiButtonText` prop**

In `frontend/src/components/common/JsonInputCard.tsx`:
Add `aiButtonText?: string` to `JsonInputCardProps` (defaulting to `'Tải ảnh câu hỏi'`).
When rendered:
```tsx
<span>{aiButtonText || 'Tải ảnh câu hỏi'}</span>
```

- [ ] **Step 2: Connect AI modal in `LectureContentEditor.tsx`**

In `frontend/src/components/lecture/creator/LectureContentEditor.tsx`:
- Add state `const [isAiModalOpen, setIsAiModalOpen] = useState(false)`.
- Set `aiButtonText="Tải ảnh Dạng toán/ Ví dụ mẫu"` on `JsonInputCard`.
- Set `onAiExtract={() => setIsAiModalOpen(true)}` on `JsonInputCard`.
- In `handleAiExtracted(jsonString: string)`:
  - Call `handleProcessJson(jsonString)`.
  - Display success toast: `toast.success("Bóc tách Dạng toán và ví dụ mẫu thành công!")`.
- Render `<AiLectureExtractModal isOpen={isAiModalOpen} onClose={() => setIsAiModalOpen(false)} onExtracted={handleAiExtracted} />`.

- [ ] **Step 3: Update and run tests for `LectureContentEditor` and `JsonInputCard`**

Run: `cd frontend && npx vitest run src/components/common/JsonInputCard.test.tsx src/components/lecture/creator/LectureContentEditor.test.tsx`
Expected: PASS

- [ ] **Step 4: Run TypeScript verification**

Run: `cd frontend && npx tsc --noEmit`
Expected: PASS (0 errors)

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/common/JsonInputCard.tsx frontend/src/components/lecture/creator/LectureContentEditor.tsx frontend/src/components/lecture/creator/LectureContentEditor.test.tsx
git commit -m "feat(frontend): integrate AI lecture extraction into LectureContentEditor"
```
