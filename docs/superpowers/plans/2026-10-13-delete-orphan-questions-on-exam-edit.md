# Delete Orphan Questions on Exam Edit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** In the exam editing screen (`/dashboard/exams/create?id=...`), when a teacher removes or swaps multiple questions and clicks "Lưu đề thi", check whether any removed questions are orphaned (no longer referenced by any other exam or practice test in the database). If orphan questions exist, display a confirmation dialog showing a checklist of those orphan questions (all checked by default), allowing the teacher to selectively delete them from the question bank or retain all of them.

**Architecture:** 
1. **Backend:**
   - Add `POST /api/v1/exams/:id/check-orphans` endpoint to check which question IDs in a given list are no longer referenced by any other exam in PostgreSQL.
   - Enhance `PUT /api/v1/exams/:id` (`UpdateExam`) to accept an optional `deleteOrphanQuestionIds []string` field in the payload. During exam update, if specified, soft-delete those confirmed orphan questions from the `questions` table within a DB transaction.
2. **Frontend:**
   - Create `ConfirmDeleteOrphanModal` component with checklist UI:
     - Checkbox for each orphan question (default checked).
     - Select All / Deselect All helper.
     - "Xóa câu hỏi đã chọn khỏi ngân hàng" button (disabled if 0 checked).
     - "Giữ lại toàn bộ trong ngân hàng" button (saves exam, keeps all questions).
     - "Hủy" button (dismisses modal, returns to editor).
   - Update `/dashboard/exams/create/page.tsx`:
     - Track `initialQuestionIds` when editing an exam.
     - In `handleSave`: compute all removed question IDs (`initialQuestionIds` minus current exam question IDs). If in edit mode and questions were removed, query `check-orphans`.
     - If orphans found, show modal and act according to user choice.

**Tech Stack:** Go (Gin, GORM, PostgreSQL pq.StringArray), TypeScript, React 19, Next.js 16 (App Router), Tailwind CSS, Vitest.

---

### Task 1: Backend - Add Check Orphans Endpoint & Enhance UpdateExam

**Files:**
- Modify: `backend/internal/handlers/exam_handler.go`
- Modify: `backend/internal/routes/routes.go`
- Create/Modify: `backend/internal/handlers/exam_handler_test.go`

- [x] **Step 1: Write backend tests for check-orphans and UpdateExam with orphan deletion**

Write unit tests verifying:
- `CheckOrphanQuestions` returns only question IDs that are not present in any other exam (`id != currentExamID`).
- `UpdateExam` with `deleteOrphanQuestionIds` deletes those selected questions from `models.Question` while preserving non-orphan questions.

- [x] **Step 2: Implement `CheckOrphanQuestions` and update `UpdateExam` in `exam_handler.go`**

```go
type CheckOrphansPayload struct {
	QuestionIDs []string `json:"questionIds" binding:"required"`
}

type OrphanQuestionInfo struct {
	ID       string `json:"id"`
	BookName string `json:"bookName"`
	Content  string `json:"content"`
}

// CheckOrphanQuestions checks which of the provided question IDs are not in any other exam
func CheckOrphanQuestions(c *gin.Context) {
	examID := c.Param("id")
	var payload CheckOrphansPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if len(payload.QuestionIDs) == 0 {
		c.JSON(http.StatusOK, gin.H{"orphanQuestions": []OrphanQuestionInfo{}})
		return
	}

	var orphans []OrphanQuestionInfo
	for _, qID := range payload.QuestionIDs {
		var otherCount int64
		// Check if qID is in question_ids of any other exam
		if err := config.DB.Model(&models.Exam{}).
			Where("id != ? AND ? = ANY(question_ids)", examID, qID).
			Count(&otherCount).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		if otherCount == 0 {
			var q models.Question
			if err := config.DB.Select("id, book_name, content").Where("id = ?", qID).First(&q).Error; err == nil {
				orphans = append(orphans, OrphanQuestionInfo{
					ID:       q.ID.String(),
					BookName: q.BookName,
					Content:  q.Content,
				})
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{"orphanQuestions": orphans})
}
```

In `UpdateExam`:
Allow payload with `deleteOrphanQuestionIds []string`. If provided, within `config.DB.Transaction`:
1. Save `existingExam`.
2. For each `qID` in `deleteOrphanQuestionIds`: verify `qID` is not in `existingExam.QuestionIDs` and not in any other exam, then call `tx.Delete(&models.Question{}, "id = ?", qID)`.

- [x] **Step 3: Register route in `backend/internal/routes/routes.go`**

Register `admin.POST("/exams/:id/check-orphans", handlers.CheckOrphanQuestions)`.

- [x] **Step 4: Run backend tests and verify all pass**

Run `go test ./internal/handlers/...` in `backend/`.

---

### Task 2: Frontend - Implement `ConfirmDeleteOrphanModal` Component

**Files:**
- Create: `frontend/src/components/exams/ConfirmDeleteOrphanModal.tsx`
- Create: `frontend/src/components/exams/ConfirmDeleteOrphanModal.test.tsx`

- [x] **Step 1: Write test for `ConfirmDeleteOrphanModal`**

Test scenarios:
- Renders list of orphan questions with checkboxes (all checked by default).
- Toggling a checkbox updates the selected list and badge count.
- Select All / Deselect All works as expected.
- Calls `onConfirmDelete(selectedIds)` when clicking "Xóa [n] câu đã chọn".
- Calls `onKeepInBank()` when clicking "Giữ lại toàn bộ trong ngân hàng".
- Calls `onCancel()` when clicking "Hủy" or backdrop.

- [x] **Step 2: Implement `ConfirmDeleteOrphanModal`**

UI features:
- Modal backdrop with clean card layout.
- Warning banner: "Phát hiện câu hỏi không còn thuộc bất kỳ đề thi nào khác".
- Scrollable checklist with question titles / previews.
- Action buttons:
  - Red button: "Xóa [n] câu đã chọn khỏi ngân hàng"
  - Outline button: "Giữ lại toàn bộ trong ngân hàng"
  - Ghost/Neutral button: "Hủy"

- [x] **Step 3: Run Vitest and verify component tests pass**

Run `npm test -- ConfirmDeleteOrphanModal` in `frontend/`.

---

### Task 3: Frontend - Integrate Orphan Check & Modal into Exam Edit Page

**Files:**
- Modify: `frontend/src/lib/api.ts` (add `checkOrphanQuestions` and update `updateExam`)
- Modify: `frontend/src/app/(fullscreen)/dashboard/exams/create/page.tsx`
- Modify: `frontend/src/app/(fullscreen)/dashboard/exams/create/page.test.tsx`

- [x] **Step 1: Add API helper functions in `frontend/src/lib/api.ts`**

Add:
- `checkOrphanQuestions(examId: string, questionIds: string[])`: calls `POST /api/v1/exams/${examId}/check-orphans`
- Update `updateExam(id: string, payload: any, deleteOrphanQuestionIds?: string[])`: passes `deleteOrphanQuestionIds` in body.

- [x] **Step 2: Write tests in `page.test.tsx` for exam edit save flow with multiple orphans**

Test:
- When multiple questions are removed and `checkOrphanQuestions` returns orphans, modal opens instead of directly navigating away.
- When teacher confirms deletion of selected IDs, `updateExam` is called with those `deleteOrphanQuestionIds`.
- When teacher clicks "Giữ lại toàn bộ", `updateExam` is called without `deleteOrphanQuestionIds`.

- [x] **Step 3: Integrate check & modal into `frontend/src/app/(fullscreen)/dashboard/exams/create/page.tsx`**

1. Store `initialQuestionIds` state when fetching existing exam:
   ```ts
   const [initialQuestionIds, setInitialQuestionIds] = useState<string[]>([]);
   // on load: setInitialQuestionIds(data.questionIds || []);
   ```
2. State for orphan modal:
   ```ts
   const [orphanQuestions, setOrphanQuestions] = useState<any[]>([]);
   const [showOrphanModal, setShowOrphanModal] = useState(false);
   ```
3. Update `handleSave`:
   - Compute `removedQuestionIds = initialQuestionIds.filter(id => !exam.questions.some(q => q.id === id));`
   - If `examId && removedQuestionIds.length > 0`:
     - Call `checkOrphanQuestions(examId, removedQuestionIds)`.
     - If orphans returned (`orphans.length > 0`): `setOrphanQuestions(orphans); setShowOrphanModal(true); return;`
   - Proceed to save.
4. Implement handlers for modal:
   - `handleConfirmDeleteOrphans(selectedIds: string[])`: calls save with `deleteOrphanQuestionIds: selectedIds`.
   - `handleKeepOrphans`: calls save without `deleteOrphanQuestionIds`.
   - `handleCancelOrphans`: closes modal.

- [x] **Step 4: Run all frontend tests and verify pass**

Run `npm test` in `frontend/`.

---

### Task 4: End-to-End Verification

- [x] **Step 1: Start dev servers (if not already running) and verify HTTP endpoints**
- [x] **Step 2: Test API call with curl to verify `check-orphans` and `UpdateExam` with orphan deletion**
- [x] **Step 3: Verify build / type check (`npm run build` or `next lint`)**
