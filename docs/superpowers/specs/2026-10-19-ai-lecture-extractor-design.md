# Design Specification: AI Lecture Math-Type & Step-by-Step Example Extractor

## 1. Intent & Context
Currently, on the lecture creation and edit page (`/dashboard/lectures/create`), section "2. Phân tích bài tập mẫu" uses `JsonInputCard` to import structured Dạng toán (Math Types), Phương pháp giải (Methods), and Bài tập ví dụ mẫu (Example problems with step-by-step solutions). Teachers either write these manually in the UI or construct complex JSON.
This design introduces an AI-powered lecture extraction pipeline using Google Gemini Vision. Teachers can upload multi-page photos/scans of lecture materials, textbook sections, or curriculum handouts. The AI automatically digitizes Math Types, methods, and example problems. If an example problem in the scanned document does not contain an existing solution, Gemini automatically solves it step-by-step with clear explanations, LaTeX formulas, and conclusions.

---

## 2. Goals, Non-Goals & Anti-Goals

### Goals
1. **Contextual Action Button in `JsonInputCard`:**
   - In `LectureContentEditor.tsx` ("2. Phân tích bài tập mẫu"), the `JsonInputCard` toolbar renders a dedicated action button:
     `[ ⬆ Tải ảnh Dạng toán/ Ví dụ mẫu ]` placed immediately next to `[ ✨ Định dạng ]`.
   - Header remains clean and focused solely on "Lưu bài giảng". No extra cluttering banners.
2. **Multi-Image Lecture Upload Modal (`AiLectureExtractModal`):**
   - Teachers can drag-and-drop or select multiple photos (up to 10 images, max 25MB total).
   - Visual thumbnails with page numbers (Trang 1, Trang 2...), file sizes, and remove buttons.
   - Animated progress indicator with live status feedback.
3. **Structured Gemini Vision Extraction (`/api/v1/lectures/extract-ai`):**
   - Formats output conforming directly to the `RawMathTypeItem[]` schema accepted by `parseLectureJson`:
     - `mathType`: Name of the math type (e.g., "Dạng 1. Nhận biết đơn thức").
     - `methods`: Array of methods, each containing:
       - `methodName`: Name of the method.
       - `solution`: Method explanation / theory / guidelines.
       - `problems`: Array of example problems.
         - `problem`: Example statement.
         - `steps`: Step-by-step timeline array `[{ step: 1, title: 'Bước 1', content: '...', formula: '...' }]`.
         - `conclusion`: Final answer / conclusion.
         - `tips`: Helpful hints (optional).
4. **Autonomous Step-by-Step Solving by Gemini:**
   - Strict prompt rule: If an example problem in the scanned material does NOT have a solution, Gemini MUST solve it thoroughly step-by-step with formulas and clear mathematical reasoning.
5. **High-Resolution Diagram Cropping:**
   - Any geometry diagrams or Oxy graphs detected by Gemini with bounding boxes `[ymin, xmin, ymax, xmax]` are cropped by `utils.CropDiagram` and saved to `./uploads/temp/<uuid>.jpg`.
   - Injected directly into the problem or solution HTML.
   - When the lecture is saved, the existing `processHtmlImages` in `lecture_service.go` automatically migrates `/uploads/temp/` images to permanent storage `/uploads/lectures/{grade}/...`.
6. **Automatic Population & Immediate Preview:**
   - On extraction success, the formatted JSON string is loaded into the `JsonInputCard` textarea, and `parseLectureJson` is invoked to immediately populate `dangToanList`, rendering the interactive visual cards for the teacher to review and edit.

### Non-Goals
- Altering the "1. Giải thích khái niệm" section (per user confirmation, this extraction targets Dạng toán & Bài tập mẫu in Section 2).
- Installing third-party PDF rendering libraries (as agreed, users provide screenshot/photo images).

### Anti-Goals
- Do not overwrite existing drafted Dạng toán without appending or giving clear confirmation.
- Do not generate invalid or unescaped LaTeX formulas that fail KaTeX rendering.

---

## 3. Architecture & Data Flow

```
+-----------------------------------------------------------------------------------------+
| Frontend (LectureContentEditor.tsx)                                                     |
| - Teacher clicks [ ⬆ Tải ảnh Dạng toán/ Ví dụ mẫu ]                                     |
| - AiLectureExtractModal opens -> Select multiple exam/lecture images                    |
| - Submits FormData to /api/v1/lectures/extract-ai                                       |
+-----------------------------------------------------------------------------------------+
                                           |
                                           v
+-----------------------------------------------------------------------------------------+
| Backend Go (API: /lectures/extract-ai)                                                   |
| 1. Read uploaded image files (max 10 files, max 25MB)                                   |
| 2. Call Gemini Vision API with structured Lecture JSON prompt                           |
|    - Standardize formulas to LaTeX ($...$, $$...$$)                                     |
|    - Convert tables to HTML (<table>...</table>)                                        |
|    - Solve missing example solutions step-by-step                                       |
|    - Detect bounding boxes [ymin, xmin, ymax, xmax] for diagrams / graphs               |
| 3. Crop diagrams into ./uploads/temp/<uuid>.jpg using utils.CropDiagram                 |
| 4. Replace diagram placeholders with <img src="/uploads/temp/..." />                   |
| 5. Return JSON: { status: "success", data: RawMathTypeItem[] }                          |
+-----------------------------------------------------------------------------------------+
                                           |
                                           v
+-----------------------------------------------------------------------------------------+
| Frontend (LectureContentEditor.tsx)                                                     |
| 1. Receive JSON array                                                                   |
| 2. Format JSON string and put into JsonInputCard                                        |
| 3. Invoke parseLectureJson() -> setDangToanList(parsedList)                             |
| 4. Interactive cards appear immediately in Section 2                                    |
| 5. On "Lưu bài giảng", lecture_service moves /uploads/temp/ to /uploads/lectures/{grade}|
+-----------------------------------------------------------------------------------------+
```

---

## 4. API Specification

- **Endpoint:** `POST /api/v1/lectures/extract-ai`
- **Auth:** Protected, `RoleMiddleware("admin", "teacher")`
- **Request:** `multipart/form-data`
  - `files`: File[] (1 to 10 images)
- **Response Format:**
  ```json
  {
    "status": "success",
    "data": [
      {
        "mathType": "Dạng 1. Nhận biết đơn thức",
        "methods": [
          {
            "methodName": "Phương pháp giải",
            "solution": "Đơn thức là biểu thức đại số chỉ gồm một số, một biến...",
            "problems": [
              {
                "problem": "Ví dụ 1: Trong các biểu thức sau, biểu thức nào là đơn thức?",
                "steps": [
                  {
                    "step": 1,
                    "title": "Nhận xét định nghĩa",
                    "content": "Xét biểu thức $A = 2x^2y$.",
                    "formula": "$A = 2x^2y$"
                  },
                  {
                    "step": 2,
                    "title": "Kết luận",
                    "content": "Biểu thức này là tích giữa số và các biến nên là đơn thức.",
                    "formula": null
                  }
                ],
                "conclusion": "Vậy $2x^2y$ là đơn thức."
              }
            ]
          }
        ]
      }
    ]
  }
  ```

---

## 5. Testing Plan
1. **Backend Unit Tests:**
   - `lecture_extractor_test.go`: Test JSON cleaning, diagram cropping placeholder replacements into methods and problems.
   - Test route authentication & payload validation.
2. **Frontend Unit Tests:**
   - `AiLectureExtractModal.test.tsx`: Test multi-file selection, remove button, API call, loading states, and callback handling.
   - `LectureContentEditor.test.tsx`: Test `onAiExtract` prop in `JsonInputCard`, opening modal, and populating `dangToanList`.
