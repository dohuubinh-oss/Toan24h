# Design: Unified JSON Input Card Component & Delete Lecture Feature

**Date:** 2026-10-10  
**Status:** Approved  
**Scope:** Frontend & Backend (`frontend`, `backend`)

---

## 1. Overview & Objectives

### 1.1 Problems
1. **Inconsistent JSON Import UI**: The question creator uses an inline card (`JsonInputSection`) with a distinct modern styling (icon, "THÔNG MINH" badge, monospace textarea, error box, "Xử lý JSON" action button). Meanwhile, the lecture creator currently has a button that opens a modal popup. This creates UI inconsistency and code duplication.
2. **Missing Lecture Deletion**: When an administrator or teacher is editing an existing lecture (`/dashboard/lectures/create?editId=...`), there is no way to delete the lecture directly from the editor header. Furthermore, the backend is missing a `DELETE /api/v1/lectures/:id` endpoint.

### 1.2 Solutions
1. **Reusable `JsonInputCard`**: Extract a clean, reusable component `JsonInputCard` with the unified UI shell.
   - Use it in `JsonInputSection` (question creator).
   - Use it directly in `LectureContentEditor` (lecture creator) directly underneath the section title `2. Phân tích bài tập mẫu`.
   - Remove the old global modal popup and separate "Nhập JSON" button from `LectureContentEditor`.
2. **Full-stack Delete Lecture Feature**:
   - Backend: Add `DELETE /api/v1/lectures/:id` in `routes.go`, `lecture_controller.go`, `lecture_service.go`, and `lecture_repo.go`.
   - Frontend: Add `deleteLecture(id: string)` in `lib/api.ts`.
   - UI: Add a red "Xóa bài giảng" button in `LectureCreatorHeader.tsx` (visible when `isEdit === true`), with a modal confirmation before deleting.

---

## 2. Component Design & Architecture

### 2.1 Reusable `JsonInputCard` (`frontend/src/components/common/JsonInputCard.tsx`)

A generic UI card for JSON batch importing with clean separation of concerns.

```tsx
export interface JsonInputCardProps {
  title?: string;
  badge?: string;
  placeholder?: string;
  buttonText?: string;
  onProcess: (jsonString: string) => void;
  disabled?: boolean;
}
```

**UI Structure:**
- Container: `bg-white rounded-2xl shadow-sm border border-slate-200 p-5 relative shadow-primary/5`
- Header: `Code2` icon + uppercase Title (e.g., "NHẬP NHANH BẰNG JSON") + "THÔNG MINH" badge.
- Textarea: Monospace font, responsive minimum height, error highlight if invalid.
- Error banner: Red text/border on JSON parse failure.
- Action Button: `Settings2` icon + action button (e.g., "Xử lý JSON").

### 2.2 Integration in `LectureContentEditor.tsx`
- Position: Immediately below `<h2 className="text-xl font-bold text-slate-800">2. Phân tích bài tập mẫu</h2>`.
- Behavior:
  - When user pastes JSON and clicks "Xử lý JSON", invoke `parseLectureJson(jsonString)`.
  - On success: `setDangToanList(parsedList)` and display `toast.success("Đã nhập thành công N dạng toán!")`.
  - On error: display error message inside the card.
  - Disable input if `contentType === 'practice'`.
- Remove: `isJsonModalOpen`, modal overlay, and the old "Nhập JSON" modal markup.

### 2.3 Refactoring in `JsonInputSection.tsx` (Question Creator)
- Refactor the markup in `JsonInputSection.tsx` to render `<JsonInputCard ... />` while preserving question-block transformation logic (`onProcessJson`).

---

## 3. Delete Lecture Feature

### 3.1 Backend Implementation

#### API Route:
- Method: `DELETE`
- URL: `/api/v1/lectures/:id`
- Middleware: `protected` & `admin` (or teacher with proper rights)

#### Repository (`backend/internal/repository/lecture_repo.go`):
```go
DeleteLecture(ctx context.Context, id string) error
```
- Implementation: Deletes lecture from `lectures` table by UUID `id`. GORM handles cascade or soft-delete if configured.

#### Service (`backend/internal/services/lecture_service.go`):
```go
DeleteLecture(ctx context.Context, id string) error
```
- Validates UUID string format.
- Calls repository `DeleteLecture`.

#### Controller (`backend/internal/controllers/lecture_controller.go`):
```go
func (ctrl *LectureController) DeleteLecture(c *gin.Context) {
    id := c.Param("id")
    if err := ctrl.service.DeleteLecture(c.Request.Context(), id); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    c.JSON(http.StatusOK, gin.H{"message": "Lecture deleted successfully"})
}
```

### 3.2 Frontend Implementation

#### API Client (`frontend/src/lib/api.ts`):
```ts
export async function deleteLecture(id: string): Promise<boolean> {
  try {
    await apiFetch(`/lectures/${id}`, { method: 'DELETE' });
    return true;
  } catch (error) {
    console.error(`Failed to delete lecture ${id}:`, error);
    throw error;
  }
}
```

#### Header Component (`LectureCreatorHeader.tsx`):
- When `isEdit && editId` is true, render a red "Xóa bài giảng" button next to "Lưu & Xuất bản":
```tsx
<Button
  variant="danger" // or className="text-red-600 hover:bg-red-50 border border-red-200"
  onClick={() => setIsDeleteModalOpen(true)}
  disabled={isSubmitting || isDeleting}
>
  <Trash2 className="w-4 h-4" />
  Xóa bài giảng
</Button>
```
- Confirmation Modal:
  - Title: "Xác nhận xóa bài giảng"
  - Body: "Bạn có chắc chắn muốn xóa bài giảng này không? Hành động này không thể hoàn tác."
  - Cancel & Delete buttons.
  - On confirm: invoke `deleteLecture(editId)`. On success: toast notification + `router.push('/dashboard/lectures')`.

---

## 4. Testing Strategy

1. **Backend Tests:**
   - Add unit test for `DeleteLecture` in `backend/internal/services/lecture_service_test.go`.
2. **Frontend Tests:**
   - Unit test `JsonInputCard.test.tsx`: Verify rendering title, badge, textarea, error display, and `onProcess` callback.
   - Unit test `LectureContentEditor.test.tsx`: Verify `JsonInputCard` is rendered under Section 2, and parsing updates `dangToanList`.
   - Unit test `JsonInputSection.test.tsx`: Verify question creator integration remains intact.
   - Unit test `LectureCreatorHeader.test.tsx`: Verify "Xóa bài giảng" button is displayed when `isEdit` is true, opening confirmation dialog and calling `deleteLecture`.
