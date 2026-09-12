# Design Document: AI Grading Enhancement & Teacher Review Workflow

**Date:** 2026-09-12  
**Status:** Approved by User  

---

## 1. Overview & Objectives

This design document outlines the technical architecture, prompt upgrades, and user experience for the Toan24h AI Grading & Teacher Manual Grading Review system.

Key goals:
1. **Enhanced Prompts:** Standardize Prompt 1 (Batch Essay Grading) and Prompt 2 (Batch MC Reasoning Evaluation) with 100% LaTeX preservation, anti-truncation (max 2 sentences/feedback), partial credit rules (0.25 increments), anti-hallucination (strict adherence to `correctAnswer`), and metadata IDs (`submissionId`, `examId`, `studentId`).
2. **Tab "Cần duyệt chấm" (Needs Review):** Add a 3rd tab on `/dashboard/appeals` to list submissions where `status === "needs_review"`.
3. **Reusable Teacher Grading Mode on Result Page:** Instead of creating a standalone modal, enhance `/exam/[id]/result?mode=grade` so teachers can view the exact student exam result view, edit scores per question, write feedback, enter overall feedback, and click "Lưu & Hoàn tất chấm điểm" to complete grading.

---

## 2. System Architecture & Component Design

```
+-----------------------------------------------------------------------------------+
|                            Teacher / Admin Workflows                              |
+----------------------------------------+------------------------------------------+
                                         |
                                         v
                      +--------------------------------------+
                      |    /dashboard/appeals Page           |
                      |  - Tab 1: Kháng cáo                  |
                      |  - Tab 2: Báo cáo lỗi                |
                      |  - Tab 3: Cần duyệt chấm             |
                      +------------------+-------------------+
                                         | Click "Chấm ngay"
                                         v
                      +--------------------------------------+
                      |  /exam/[id]/result?mode=grade        |
                      |  - Banner: Chế độ chấm của Giáo viên |
                      |  - Interactive score & feedback per Q|
                      |  - Overall Feedback Editors          |
                      |  - Button: "Lưu & Hoàn tất chấm"     |
                      +------------------+-------------------+
                                         | POST /api/v1/submissions/:id/grade-review
                                         v
                      +--------------------------------------+
                      |  Backend DB Update & Notification    |
                      |  - Status set to 'graded'            |
                      |  - Send In-app & Telegram Notify     |
                      +--------------------------------------+
```

---

## 3. Backend Changes (Go Backend)

### A. Model `backend/internal/models/submission.go`
- Define enum value `StatusNeedsReview SubmissionStatus = "needs_review"`.
- Ensure `Submission` has `OverallEssayFeedback` and `OverallComprehensionFeedback`.
- Ensure `QuestionAnswer` has `DeductionReason`, `ComprehensionLevel`, `IsRandomGuess`.

### B. Service `backend/internal/services/ai_grader.go`
- Update Prompt 1 (`GradeEssayBatchWithGemini`) with LaTeX, anti-truncation, anti-hallucination, and Metadata IDs.
- Update Prompt 2 (`EvaluateReasoningBatchWithGemini`) with reasoning assessment, `isRandomGuess`, `comprehensionLevel`, anti-truncation, and Metadata IDs.

### C. Handlers & Routes (`backend/internal/handlers/exam_result_handler.go`, `routes.go`)
- **`GET /api/v1/submissions/needs-review`**: Returns array of submissions with `status = 'needs_review'` joined with student and exam info.
- **`POST /api/v1/submissions/:id/grade-review`**: Accepts payload containing updated `answersMap`, `totalScore`, `overallEssayFeedback`, `overallComprehensionFeedback`, updates DB, sets `status = 'graded'`, and creates notifications for student.

---

## 4. Frontend Changes (Next.js)

### A. API Service `frontend/src/lib/api.ts`
- `getNeedsReviewSubmissions()`: Calls `GET /api/v1/submissions/needs-review`.
- `submitTeacherGradingReview(submissionId, payload)`: Calls `POST /api/v1/submissions/:id/grade-review`.

### B. Appeals Page `frontend/src/app/(main)/dashboard/appeals/page.tsx`
- Add Tab 3: **Cần duyệt chấm** (`reviews`).
- Render table listing pending review submissions with student name, exam name, date, and link button to `/exam/[submissionId]/result?mode=grade`.

### C. Exam Result Page `frontend/src/app/(fullscreen)/exam/[id]/result/page.tsx`
- Detect `mode === 'grade'` query parameter.
- Show Teacher Banner at top.
- Display score input fields (step 0.25, min 0, max `maxScore`) and feedback textareas for each question.
- Display overall feedback textareas.
- Display "Lưu & Hoàn tất chấm điểm" button in footer, sending review payload to API and redirecting back to `/dashboard/appeals`.

---

## 5. Self-Review & Verification

- **Placeholder Scan:** No TBDs or vague specs.
- **Consistency:** Backend API payload matches frontend API calls and data models.
- **Scope Check:** Well-bounded and isolated feature additions.
