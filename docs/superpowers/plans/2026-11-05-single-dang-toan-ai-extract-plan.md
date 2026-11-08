# Single Dạng Toán AI Extract & Edit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an edit action button to each `DangToanCard` that opens an AI image extraction modal and updates only that specific Dạng toán's content without affecting others in `dangToanList`.

**Architecture:** 
1. Enhance `lectureJsonParser.ts` to accept both single-object and array JSON structures.
2. Extend `AiLectureExtractModal.tsx` to support optional `title` and `description` props.
3. Integrate an edit button (`Pencil` icon) next to the delete button in `DangToanCard.tsx`, which triggers `AiLectureExtractModal` with localized title and handles updating only that component via its `onChange` callback.

**Tech Stack:** Next.js (React 19 / App Router), TypeScript, Vitest, React Testing Library, Lucide Icons, Tailwind CSS.

---

### Task 1: Update `lectureJsonParser` to Support Single Object & Write Tests
- [x] Write unit test in `frontend/src/components/lecture/creator/utils/lectureJsonParser.test.ts` for single-object input `{ mathType: "...", methods: [...] }`.
- [x] Run test to verify failure or expected behavior.
- [x] Update `parseLectureJson` in `frontend/src/components/lecture/creator/utils/lectureJsonParser.ts` to wrap single object in an array.
- [x] Re-run tests to confirm all pass.

### Task 2: Enhance `AiLectureExtractModal` with Custom `title` & `description`
- [x] Add unit test in `frontend/src/components/lecture/creator/AiLectureExtractModal.test.tsx` verifying custom `title` and `description` rendering.
- [x] Update `AiLectureExtractModal.tsx` to accept optional `title` and `description` in `AiLectureExtractModalProps`.
- [x] Run tests to confirm passing.

### Task 3: TDD & Implement Edit Button in `DangToanCard`
- [x] Create `frontend/src/components/lecture/creator/DangToanCard.test.tsx` with tests for:
  - Rendering the edit button next to the remove button with correct title/accessible label.
  - Opening the AI extraction modal when clicking the edit button.
  - Calling `onChange` with the new data while preserving existing `id` when extraction succeeds.
  - Proper toast notification on success/error.
- [x] Update `DangToanCard.tsx`:
  - Add `Pencil` icon next to `Trash2` in card header.
  - Add state `isAiModalOpen`.
  - Add `handleAiExtracted` that parses extracted JSON and calls `onChange({ ...parsed[0], id: dangToan.id })`.
  - Render `AiLectureExtractModal`.
- [x] Run `DangToanCard.test.tsx` to verify all tests pass.

### Task 4: Full Verification
- [x] Run all frontend tests (`vitest run` - 111 test files, 535 tests passed).
- [x] Verify no regressions in existing lecture creator tests.
