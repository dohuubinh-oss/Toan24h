# Design Specification: AI Multi-Image Question Extractor & Google Drive Source Linking

## 1. Intent & Context
Currently, teachers on `toan6789.vn` must either manually type each math question, formula, and step-by-step solution, or manually format complex JSON strings to paste into the creator interface. This design introduces an AI-powered extraction pipeline using Google Gemini Vision to automatically extract multiple math questions from uploaded exam paper photos (multi-image), cleanly format formulas to LaTeX, convert variation tables to HTML/LaTeX, auto-crop geometry/graph diagrams, and link the original source Google Drive document via a newly designated `gg_drive` field.

---

## 2. Goals, Non-Goals & Anti-Goals

### Goals
1. **Multi-Image Upload in Question Creator:** Teachers can select or drop multiple image files (e.g., Page 1, Page 2 of a test paper) in `dashboard/questions/create`.
2. **AI-Powered Structured Extraction (Gemini Vision):**
   - Extract single and group questions in the existing `QuestionBlock[]` JSON format.
   - Standardize mathematical formulas into LaTeX syntax (`$...$` inline, `$$...$$` display).
   - Convert variation/sign tables into editable HTML/LaTeX tables.
   - Detect bounding box coordinates (`[ymin, xmin, ymax, xmax]`) for geometry figures and function graphs.
3. **Automated Server-Side Diagram Cropping:**
   - Backend Go service slices diagram regions from the corresponding source image.
   - Saves cropped images to `backend/uploads/extracted_diagrams/`.
   - Injects `<img src="/uploads/extracted_diagrams/..." />` into the question content.
4. **Field Renaming: `book_name` -> `gg_drive`:**
   - Rename database column and GORM struct field from `book_name` to `gg_drive` (type `TEXT` to accommodate full URLs).
   - In frontend sidebar, update label to **Link Drive** with an input field and a clickable `ExternalLink` icon button to open the Drive file in a new tab.
   - Synchronize `gg_drive` across all questions in the active blocks.
5. **Direct Form Population:** Extracted question blocks are set directly into the `questionBlocks` state, allowing immediate editing, preview, and saving.

### Non-Goals
- Direct Google Drive API integration or OAuth file picking (the user explicitly prefers managing Drive manually and pasting the link).
- Parsing DOCX/PDF files directly (focus is on photos/scans of test papers as decided).

### Anti-Goals
- Do not overwrite or lose existing drafted questions without user confirmation.
- Do not produce broken or unrenderable image URLs.

---

## 3. Architecture & Data Flow

```
+-----------------------------------------------------------------------------------------+
| Frontend (dashboard/questions/create)                                                   |
| - Drag & drop / select multiple images                                                  |
| - Input "Link Drive" (gg_drive)                                                         |
| - POST multipart/form-data to /api/v1/questions/extract-ai                              |
+-----------------------------------------------------------------------------------------+
                                           |
                                           v
+-----------------------------------------------------------------------------------------+
| Backend Go (API: /questions/extract-ai)                                                 |
| 1. Read uploaded image files into memory                                                |
| 2. Call Gemini Vision API with structured JSON Schema prompt                            |
| 3. Parse Gemini output: questions, options, solution guides, diagram bounding boxes     |
| 4. Crop diagram bounding boxes using Go `image` / `image/jpeg` / `image/png`            |
| 5. Save cropped images to `backend/uploads/extracted_diagrams/`                         |
| 6. Replace diagram tokens with `<img src="/uploads/extracted_diagrams/..." />`          |
| 7. Return JSON response matching `QuestionBlock[]` schema                               |
+-----------------------------------------------------------------------------------------+
                                           |
                                           v
+-----------------------------------------------------------------------------------------+
| Frontend State Update                                                                   |
| - setQuestionBlocks(extractedBlocks)                                                    |
| - Populate gg_drive on all questions                                                    |
| - Render in RichTextEditor & Sidebar for teacher review and final save                  |
+-----------------------------------------------------------------------------------------+
```

---

## 4. Detailed Component Specifications

### 4.1. Database & Model Changes (`book_name` -> `gg_drive`)
- **PostgreSQL Database:**
  - Rename column `book_name` to `gg_drive` in table `questions`:
    `ALTER TABLE questions RENAME COLUMN book_name TO gg_drive;`
    `ALTER TABLE questions ALTER COLUMN gg_drive TYPE TEXT;`
- **Backend Model (`backend/internal/models/question.go`):**
  - Replace `BookName` with `GgDrive`:
    ```go
    GgDrive string `gorm:"type:text;column:gg_drive" json:"gg_drive"`
    ```
  - For backward compatibility in API responses, tag with `json:"gg_drive,omitempty"` (and keep `bookName` alias in JSON marshaling if needed by existing clients).
- **Frontend Model (`frontend/src/types/question.ts`):**
  - Update `book_name?: string` to `gg_drive?: string`.
- **Frontend UI (`QuestionSettingsSidebar.tsx`):**
  - Update label: **Link Drive**.
  - Input field binds to `currentQuestion?.gg_drive`.
  - When a valid URL is typed (`http://` or `https://`), display an external link button allowing teachers to open the Drive link in a new tab.

### 4.2. Gemini AI Prompt & Extraction Contract
- **Prompt Specification:**
  - Instruct Gemini to act as a Vietnamese Mathematics Editor.
  - Analyze all provided exam images in order.
  - Return JSON strictly following the `QuestionBlock[]` structure.
  - Format all formulas in LaTeX (`$...$`).
  - Convert variation and sign tables into clean HTML/Markdown tables.
  - For diagrams, return:
    ```json
    "diagrams": [
      {
        "image_index": 0,
        "box_2d": [ymin, xmin, ymax, xmax],
        "placeholder": "[DIAGRAM_0_1]"
      }
    ]
    ```
- **Backend Diagram Cropper:**
  - For each detected diagram in `box_2d` (normalized 0-1000 or 0-1 coordinate space), compute pixel bounds.
  - Crop sub-image, encode as JPEG/PNG, write to disk with a UUID filename.
  - Replace `[DIAGRAM_X_Y]` in the question content with `<img src="/uploads/extracted_diagrams/<filename>" alt="Hình vẽ" class="max-w-md mx-auto my-2 rounded-lg border border-slate-200" />`.

### 4.3. Question Creator UI Integration (`frontend/src/app/(fullscreen)/dashboard/questions/create/page.tsx`)
- Add an "AI Bóc tách đề thi từ ảnh" button in the creator toolbar / `JsonInputSection`.
- Open a sleek modal:
  - Drag & drop zone for multiple images.
  - Thumbnail preview grid with remove buttons.
  - Optional field: "Link Google Drive tài liệu gốc" (auto-filled into `gg_drive`).
  - "Bắt đầu bóc tách" action button with loading spinner & step-by-step progress indicator.
  - On success, populate `questionBlocks`, show success toast, and close modal.

---

## 5. What's Left to the Builder
- Precise prompt tuning for Gemini 1.5/2.0 Flash to ensure strict JSON adherence.
- Safe GORM migration script ensuring existing `book_name` data is migrated without downtime.
- Unit tests for:
  - Diagram cropping helper.
  - AI extraction handler.
  - Frontend sidebar `gg_drive` link component and AI upload modal.
