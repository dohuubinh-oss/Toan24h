# AI Grading & Teacher Review Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement enhanced AI grading prompts (with LaTeX support, anti-truncation, partial credit rules, anti-hallucination, and metadata IDs), add "Cần duyệt chấm" tab to `/dashboard/appeals`, and enable teacher manual grading mode on `/exam/[id]/result?mode=grade`.

**Architecture:** Backend provides `StatusNeedsReview` submission status, `GET /api/v1/submissions/needs-review` API, and `POST /api/v1/submissions/:id/grade-review` API. Frontend `/dashboard/appeals` displays the review queue and routes teachers to `/exam/[id]/result?mode=grade` where inline scoring and feedback controls submit to the backend API.

**Tech Stack:** Go (Gin, GORM, PostgreSQL), TypeScript, Next.js (App Router), TailwindCSS, Lucide Icons, KaTeX.

## Global Constraints
- Target workspace: `/Users/modeptrai/Desktop/Toan24h`
- All math formulas rendered using `MathText` component.
- All new API routes registered in `backend/internal/routes/routes.go`.
- All backend code must compile with `go build ./...`.

---

### Task 1: Backend Models and APIs for Teacher Review Queue

**Files:**
- Modify: `backend/internal/models/submission.go`
- Modify: `backend/internal/handlers/exam_result_handler.go`
- Modify: `backend/internal/routes/routes.go`

**Interfaces:**
- Consumes: `config.DB`, `models.Submission`
- Produces: `GET /api/v1/submissions/needs-review`, `POST /api/v1/submissions/:id/grade-review`

- [ ] **Step 1: Update `submission.go` with `StatusNeedsReview`**

Add `StatusNeedsReview SubmissionStatus = "needs_review"` to `submission.go`.

- [ ] **Step 2: Add `GetNeedsReviewSubmissions` and `ResolveSubmissionReview` handlers in `exam_result_handler.go`**

Implement `GetNeedsReviewSubmissions` to fetch submissions where `status = 'needs_review'` preloaded with exam and student info.
Implement `ResolveSubmissionReview` to accept `teacherFeedback`, `overallEssayFeedback`, `overallComprehensionFeedback`, updated per-question scores in `answersMap`, set `status = 'graded'`, and send notifications to student.

- [ ] **Step 3: Register routes in `routes.go`**

Register:
- `api.GET("/submissions/needs-review", handlers.GetNeedsReviewSubmissions)`
- `api.POST("/submissions/:id/grade-review", handlers.ResolveSubmissionReview)`

- [ ] **Step 4: Verify backend compilation**

Run: `go build ./...` in `/Users/modeptrai/Desktop/Toan24h/backend`
Expected: Exit code 0.

- [ ] **Step 5: Commit backend changes**

```bash
git add backend/internal/models/submission.go backend/internal/handlers/exam_result_handler.go backend/internal/routes/routes.go
git commit -m "feat(api): add endpoints for teacher review queue and manual grading"
```

---

### Task 2: Frontend API Integration

**Files:**
- Modify: `frontend/src/lib/api.ts`

**Interfaces:**
- Consumes: Backend endpoints `GET /api/v1/submissions/needs-review` and `POST /api/v1/submissions/:id/grade-review`
- Produces: `getNeedsReviewSubmissions()`, `submitTeacherGradingReview(id, payload)`

- [ ] **Step 1: Add API functions in `api.ts`**

Add helper functions:
- `getNeedsReviewSubmissions()`
- `submitTeacherGradingReview(submissionId: string, payload: any)`

- [ ] **Step 2: Commit API integration**

```bash
git add frontend/src/lib/api.ts
git commit -m "feat(frontend): add API functions for teacher review queue and manual grading"
```

---

### Task 3: Appeals Page "Cần duyệt chấm" Tab

**Files:**
- Modify: `frontend/src/app/(main)/dashboard/appeals/page.tsx`

**Interfaces:**
- Consumes: `getNeedsReviewSubmissions()` from `lib/api.ts`
- Produces: 3rd Tab `"reviews"` rendering table of pending review submissions with link to `/exam/[id]/result?mode=grade`

- [ ] **Step 1: Add Tab 3 (`reviews`) and fetch needs-review submissions**

Update state to `activeTab: 'appeals' | 'reports' | 'reviews'`, fetch needs-review items, and render a table showing Exam Name, Student Email/Name, Date, Status badge, and "Chấm bài ngay" button linking to `/exam/${sub.id}/result?mode=grade`.

- [ ] **Step 2: Verify frontend TypeScript build**

Run: `npx tsc --noEmit` in `/Users/modeptrai/Desktop/Toan24h/frontend`
Expected: Exit code 0.

- [ ] **Step 3: Commit Appeals page update**

```bash
git add frontend/src/app/\(main\)/dashboard/appeals/page.tsx
git commit -m "feat(frontend): add Needs Review tab to appeals dashboard page"
```

---

### Task 4: Teacher Grading Mode on Result Page

**Files:**
- Modify: `frontend/src/app/(fullscreen)/exam/[id]/result/page.tsx`

**Interfaces:**
- Consumes: URL query param `mode=grade`, `submitTeacherGradingReview()` API
- Produces: Interactive teacher grading controls, overall feedback inputs, real-time score summation, and "Lưu & Hoàn tất chấm điểm" submission button

- [ ] **Step 1: Detect `mode=grade` and render Teacher Banner**

Read query params (`searchParams.get('mode') === 'grade'`). If true, render a prominent Teacher Grading Banner at the top.

- [ ] **Step 2: Add inline per-question score inputs & feedback textareas**

In `MultipleChoiceQuestion` and `EssayQuestion` wrappers (or directly on result page), render score input (`step=0.25`, `max=maxScore`) and teacher feedback textareas when `mode === 'grade'`.

- [ ] **Step 3: Add Overall Feedback inputs and Footer button**

Render textareas for `overallEssayFeedback` and `overallComprehensionFeedback`. Update footer to display "Lưu & Hoàn tất chấm điểm" button which submits the review payload to `submitTeacherGradingReview` and redirects to `/dashboard/appeals`.

- [ ] **Step 4: Verify frontend TypeScript build**

Run: `npx tsc --noEmit` in `/Users/modeptrai/Desktop/Toan24h/frontend`
Expected: Exit code 0.

- [ ] **Step 5: Commit Result Page Teacher Mode**

```bash
git add frontend/src/app/\(fullscreen\)/exam/\[id\]/result/page.tsx
git commit -m "feat(frontend): add teacher manual grading mode to exam result page"
```
