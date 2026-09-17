# Exam Edit & Question Swap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow teachers to edit existing exams (updating metadata and question lists directly in DB) and swap individual questions within an exam by picking new questions from the question bank.

**Architecture:** Add `PUT /api/v1/exams/:id` in Go backend for updating existing exams. Upgrade frontend Next.js pages: add Edit action in `ExamTable.tsx`, handle pre-filling and PUT request in `/dashboard/exams/create`, add "Swap Question" button in `QuestionCard.tsx`, and add a question replacement mode with banner and selection button in `/dashboard/questions`.

**Tech Stack:** Go (Gin, GORM), TypeScript, React, Next.js App Router, Tailwind CSS, Lucide Icons.

## Global Constraints
- **Backend Port:** `http://localhost:8080/api/v1`
- **Frontend Port:** `http://localhost:3000`
- **Immutability:** Always create new copies when updating state arrays in React.
- **Route Isolation:** All routes remain under `/dashboard/exams` and `/dashboard/questions`.

---

### Task 1: Backend - Implement `UpdateExam` API Handler & Route

**Files:**
- Modify: `backend/internal/handlers/exam_handler.go`
- Modify: `backend/internal/routes/routes.go`
- Test: `backend/internal/handlers/exam_handler_test.go` (or run backend tests)

**Interfaces:**
- Consumes: GORM DB connection from `config.DB`
- Produces: `admin.PUT("/exams/:id", handlers.UpdateExam)` endpoint

- [ ] **Step 1: Add UpdateExam handler in `backend/internal/handlers/exam_handler.go`**

```go
func UpdateExam(c *gin.Context) {
	id := c.Param("id")

	var existingExam models.Exam
	if err := config.DB.Where("id = ?", id).First(&existingExam).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Exam not found"})
		return
	}

	var payload models.Exam
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	existingExam.Title = payload.Title
	existingExam.ExamCode = payload.ExamCode
	existingExam.Grade = payload.Grade
	existingExam.Duration = payload.Duration
	existingExam.Cate = payload.Cate
	existingExam.Type = payload.Type
	existingExam.DiffScore = payload.DiffScore
	existingExam.QuestionIds = payload.QuestionIds
	existingExam.LectureID = payload.LectureID

	if err := config.DB.Save(&existingExam).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update exam: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, existingExam)
}
```

- [ ] **Step 2: Register PUT route in `backend/internal/routes/routes.go`**

In `backend/internal/routes/routes.go`, add inside the admin group:
```go
// Exams admin
admin.POST("/exams", handlers.CreateExam)
admin.PUT("/exams/:id", handlers.UpdateExam)
admin.DELETE("/exams/:id", handlers.DeleteExam)
```

- [ ] **Step 3: Test backend route compilation & execution**

Run command in `backend`:
`go test ./...`
Expected: PASS

- [ ] **Step 4: Commit backend changes**

```bash
git add backend/internal/handlers/exam_handler.go backend/internal/routes/routes.go
git commit -m "feat(backend): add UpdateExam endpoint for updating exams by ID"
```

---

### Task 2: Frontend API Layer & ExamTable Edit Button

**Files:**
- Modify: `frontend/src/lib/api.ts`
- Modify: `frontend/src/components/exams/ExamTable.tsx`

**Interfaces:**
- Consumes: Backend `PUT /api/v1/exams/:id`
- Produces: `updateExam(id, payload)` helper and Edit button on `/dashboard/exams` table

- [ ] **Step 1: Add `updateExam` in `frontend/src/lib/api.ts`**

```typescript
export async function updateExam(id: string, payload: any): Promise<any> {
  const response = await apiFetch(`/exams/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
  return response
}
```

- [ ] **Step 2: Add Edit button in `ExamTable.tsx`**

In `frontend/src/components/exams/ExamTable.tsx`, update imports to include `Edit2`:
```typescript
import { Calculator, Trash2, Edit2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
```

In the action column cell (`<td className="px-3 py-3 text-right whitespace-nowrap">`):
```tsx
<div className="flex items-center justify-end gap-1">
  <Button 
    variant="ghost" 
    size="icon" 
    className="h-9 w-9 text-slate-400 hover:text-primary hover:bg-primary/10" 
    title="Chỉnh sửa"
    onClick={(e) => {
      e.stopPropagation();
      const qids = (exam.questionIds || []).join(',');
      router.push(`/dashboard/exams/create?id=${exam.id}&qids=${qids}`);
    }}
  >
    <Edit2 className="w-4 h-4" />
  </Button>
  <Button 
    variant="ghost" 
    size="icon" 
    className="h-9 w-9 text-slate-400 hover:text-red-500 hover:bg-red-50" 
    title="Xóa"
    onClick={(e) => {
      e.stopPropagation();
      if (onDelete) onDelete(exam.id);
    }}
  >
    <Trash2 className="w-4 h-4" />
  </Button>
</div>
```

- [ ] **Step 3: Verify frontend type check**

Run in `frontend`:
`npm run build` or `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 4: Commit frontend table changes**

```bash
git add frontend/src/lib/api.ts frontend/src/components/exams/ExamTable.tsx
git commit -m "feat(frontend): add updateExam API call and Edit button in ExamTable"
```

---

### Task 3: Exam Create/Edit Page Support for Pre-filling and Updating Existing Exams

**Files:**
- Modify: `frontend/src/app/(fullscreen)/dashboard/exams/create/page.tsx`

**Interfaces:**
- Consumes: `getExamById` and `updateExam` from `@/lib/api`
- Produces: Pre-filled form state and conditional PUT request execution when `id` URL parameter exists.

- [ ] **Step 1: Update `create/page.tsx` to handle `id` parameter**

In `frontend/src/app/(fullscreen)/dashboard/exams/create/page.tsx`:
```typescript
const examId = searchParams.get('id');

useEffect(() => {
  if (examId) {
    import('@/lib/api').then(({ getExamById, getQuestions }) => {
      getExamById(examId).then(existingExam => {
        if (existingExam) {
          const ids = existingExam.questionIds || [];
          setExam(prev => ({
            ...prev,
            title: existingExam.title || '',
            examCode: existingExam.examCode || '',
            grade: existingExam.grade || '',
            duration: existingExam.duration || 0,
            cate: existingExam.cate || 'exam',
            type: existingExam.type || '',
            lectureId: existingExam.lectureId || undefined
          }));

          if (ids.length > 0) {
            getQuestions(1, 1000, { ids }).then(res => {
              if (res.data) {
                setExam(prev => ({ ...prev, questions: res.data }));
              }
            });
          }
        }
      });
    });
  } else {
    const qidsParam = searchParams.get('qids');
    if (qidsParam) {
      const ids = qidsParam.split(',').filter(Boolean);
      if (ids.length > 0) {
        import('@/lib/api').then(({ getQuestions }) => {
          getQuestions(1, 1000, { ids }).then(res => {
            if (res.data) {
              setExam(prev => ({ ...prev, questions: res.data }));
            }
          }).catch(err => console.error("Failed to fetch questions for exam:", err));
        });
      }
    }
  }
}, [searchParams, examId]);
```

- [ ] **Step 2: Update `handleSave` to use `updateExam` when `examId` is present**

```typescript
const handleSave = async () => {
  const newErrors = validateExamConfig(exam);
  if (Object.keys(newErrors).length > 0) {
    setErrors(newErrors);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  if (exam.questions.length === 0) {
    toast.error('Vui lòng chọn ít nhất 1 câu hỏi để tạo đề thi!');
    return;
  }

  const { diffScore } = calculateExamDifficulty(exam.questions);
  const questionIds = exam.questions.map(q => q.id).filter(Boolean);

  const payload = {
    title: exam.title,
    examCode: exam.examCode,
    cate: exam.cate,
    type: exam.type,
    grade: exam.grade,
    duration: exam.duration,
    diffScore: diffScore,
    questionIds: questionIds,
    lectureId: exam.lectureId,
  };

  setIsSaving(true);
  try {
    if (examId) {
      const { updateExam } = await import('@/lib/api');
      await updateExam(examId, payload);
      toast.success('Cập nhật đề thi thành công!');
    } else {
      await apiFetch('/exams', { method: 'POST', body: JSON.stringify(payload) })
      toast.success('Tạo đề thi mới thành công!');
    }
    router.push('/dashboard/exams');
  } catch (err) {
    console.error('Lưu đề thi thất bại:', err);
    toast.error('Lưu đề thi thất bại. Vui lòng thử lại.');
  } finally {
    setIsSaving(false);
  }
}
```

- [ ] **Step 3: Check build & types**

Run in `frontend`:
`npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 4: Commit create/edit page changes**

```bash
git add frontend/src/app/\(fullscreen\)/dashboard/exams/create/page.tsx
git commit -m "feat(frontend): support editing existing exam and saving changes via PUT"
```

---

### Task 4: Question Swap Button Integration on Exam Question Cards

**Files:**
- Modify: `frontend/src/components/questions/QuestionCard.tsx`
- Modify: `frontend/src/components/exams/ExamQuestionList.tsx`
- Modify: `frontend/src/app/(fullscreen)/dashboard/exams/create/page.tsx`

**Interfaces:**
- Consumes: QuestionCard prop `onSwap?: () => void`
- Produces: Action to route user to `/dashboard/questions` in swap mode.

- [ ] **Step 1: Add `onSwap` prop to `QuestionCard.tsx`**

In `QuestionCardProps`:
```typescript
export interface QuestionCardProps {
  id: string;
  grade: number | string;
  topic: string;
  difficulty: string;
  isSelected?: boolean;
  onToggle?: () => void;
  children?: React.ReactNode;
  index?: number;
  typeQuestion?: 'group' | 'single' | string;
  type?: 'Trắc nghiệm' | 'Tự luận' | string;
  onEdit?: () => void;
  onDelete?: () => void;
  onSwap?: () => void;
}
```

In `QuestionCard` component JSX:
```tsx
<div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
  {onSwap && (
    <Button variant="ghost" size="icon" className="w-10 h-10 text-slate-400 hover:text-amber-500 hover:bg-amber-50" title="Đổi câu hỏi" onClick={onSwap}>
      <RefreshCw className="w-5 h-5" />
    </Button>
  )}
  {onEdit && (
    <Button variant="ghost" size="icon" className="w-10 h-10 text-slate-400 hover:text-primary hover:bg-primary/10" title="Chỉnh sửa" onClick={onEdit}>
      <Edit2 className="w-5 h-5" />
    </Button>
  )}
  {onDelete && (
    <Button variant="ghost" size="icon" className="w-10 h-10 text-slate-400 hover:text-red-500 hover:bg-red-500/10" title="Xóa" onClick={onDelete}>
      <Trash2 className="w-5 h-5" />
    </Button>
  )}
</div>
```

- [ ] **Step 2: Pass `onSwapQuestion` in `ExamQuestionList.tsx`**

In `ExamQuestionListProps`:
```typescript
interface ExamQuestionListProps {
  questions: Question[];
  onRemoveQuestion?: (id: string) => void;
  onSwapQuestion?: (id: string) => void;
}
```
Pass `onSwap={onSwapQuestion ? () => onSwapQuestion(q.id) : undefined}` to `QuestionCard` instances in MCQ and Essay lists.

- [ ] **Step 3: Handle `handleSwapQuestion` in `create/page.tsx`**

```typescript
const handleSwapQuestion = useCallback((targetQId: string) => {
  const currentQids = exam.questions.map(q => q.id).filter(Boolean);
  const params = new URLSearchParams();
  params.set('swapFrom', targetQId);
  if (currentQids.length > 0) {
    params.set('qids', currentQids.join(','));
  }
  if (examId) {
    params.set('id', examId);
  }
  router.push(`/dashboard/questions?${params.toString()}`);
}, [exam.questions, examId, router]);
```
Pass `onSwapQuestion={handleSwapQuestion}` to `<ExamQuestionList />`.

- [ ] **Step 4: Commit question swap UI button**

```bash
git add frontend/src/components/questions/QuestionCard.tsx frontend/src/components/exams/ExamQuestionList.tsx frontend/src/app/\(fullscreen\)/dashboard/exams/create/page.tsx
git commit -m "feat(frontend): add Swap Question button on Exam Question Cards"
```

---

### Task 5: Question Bank Replacement Mode (`/dashboard/questions`)

**Files:**
- Modify: `frontend/src/app/(main)/dashboard/questions/page.tsx`

**Interfaces:**
- Consumes: URL params `swapFrom`, `qids`, `id`
- Produces: Banner notice and "Select to Swap" button on question cards to finalize replacement.

- [ ] **Step 1: Check `swapFrom` parameter in `QuestionsPageContent`**

In `frontend/src/app/(main)/dashboard/questions/page.tsx`:
```typescript
const swapFrom = searchParams.get('swapFrom');
const qidsParam = searchParams.get('qids');
const examIdParam = searchParams.get('id');

const handleSelectReplacement = (newQuestionId: string) => {
  const currentQids = qidsParam ? qidsParam.split(',').filter(Boolean) : [];
  const updatedQids = currentQids.map(qid => qid === swapFrom ? newQuestionId : qid);
  // If swapFrom wasn't in list, append
  if (!currentQids.includes(swapFrom || '')) {
    updatedQids.push(newQuestionId);
  }
  
  const params = new URLSearchParams();
  if (updatedQids.length > 0) {
    params.set('qids', updatedQids.join(','));
  }
  if (examIdParam) {
    params.set('id', examIdParam);
  }
  router.push(`/dashboard/exams/create?${params.toString()}`);
};
```

- [ ] **Step 2: Render Swap Banner if `swapFrom` is present**

At the top of `QuestionsPageContent`:
```tsx
{swapFrom && (
  <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl flex items-center justify-between gap-4 mb-4">
    <div>
      <p className="font-bold text-amber-900 text-sm">Đang chọn câu hỏi thay thế</p>
      <p className="text-xs text-amber-700">Vui lòng chọn 1 câu hỏi bên dưới để thay thế cho câu hỏi ID: <code className="font-mono bg-amber-100 px-1 py-0.5 rounded text-amber-900">{swapFrom}</code></p>
    </div>
    <button 
      onClick={() => {
        const params = new URLSearchParams();
        if (qidsParam) params.set('qids', qidsParam);
        if (examIdParam) params.set('id', examIdParam);
        router.push(`/dashboard/exams/create?${params.toString()}`);
      }}
      className="px-3 py-1.5 bg-amber-200 hover:bg-amber-300 text-amber-900 font-bold text-xs rounded-lg transition-colors"
    >
      Hủy đổi
    </button>
  </div>
)}
```

- [ ] **Step 3: Add "Chọn câu này" button on Question Cards during Swap mode**

Inside `questions.map((q) => ...)`:
```tsx
<QuestionCard
  key={q.id}
  id={q.id || ""}
  isSelected={selectedIds.includes(q.id || "")}
  onToggle={() => { ... }}
  onEdit={() => router.push(`/dashboard/questions/create?id=${q.id}`)}
  onDelete={() => setDeleteId(q.id || null)}
  ...
>
  {swapFrom && (
    <div className="mt-3 pt-3 border-t border-slate-100 flex justify-end">
      <button
        onClick={() => q.id && handleSelectReplacement(q.id)}
        disabled={qidsParam?.split(',').includes(q.id || '')}
        className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
          qidsParam?.split(',').includes(q.id || '')
            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
            : 'bg-primary text-white hover:bg-primary/90 shadow-sm'
        }`}
      >
        {qidsParam?.split(',').includes(q.id || '') ? 'Đã có trong đề' : 'Chọn thay thế câu này'}
      </button>
    </div>
  )}
  <ContentQuestion ... />
</QuestionCard>
```

- [ ] **Step 4: Verify type safety & build**

Run in `frontend`:
`npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 5: Commit question bank swap mode**

```bash
git add frontend/src/app/\(main\)/dashboard/questions/page.tsx
git commit -m "feat(frontend): implement replacement mode banner and button on questions bank page"
```

---

## Plan Review Checklist
- [x] All file paths verified against codebase
- [x] Backend handler and route registered
- [x] Frontend API helper `updateExam` created
- [x] Frontend Edit button added to ExamTable
- [x] Exam create/edit page supports loading existing exam data & calling PUT on save
- [x] QuestionCard component includes Swap action button
- [x] Questions bank handles `swapFrom` parameter with banner & item replacement logic
