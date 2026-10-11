# Unified JSON Input Card & Delete Lecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract a unified `JsonInputCard` component used across both Question and Lecture creators, and implement a full-stack Delete Lecture feature.

**Architecture:** A reusable UI component `JsonInputCard` handles monospace JSON input, styling, error reporting, and action triggers. `LectureContentEditor` embeds this card directly under Section 2. In the backend, a `DELETE /api/v1/lectures/:id` route connects to `LectureRepository.DeleteLecture`. In the frontend, `LectureCreatorHeader` renders a deletion button and confirmation modal when `isEdit` is true.

**Tech Stack:** Next.js, React 19, TypeScript, Tailwind CSS, Lucide React, Vitest, Go, Gin, GORM.

## Global Constraints
- Immutability: Always return new copies of state in React.
- TDD: Test before code, 100% test pass before moving to the next task.
- Zero placeholder code: Full implementations only.

---

### Task 1: Reusable `JsonInputCard` Component

**Files:**
- Create: `frontend/src/components/common/JsonInputCard.tsx`
- Test: `frontend/src/components/common/JsonInputCard.test.tsx`

**Interfaces:**
- Produces:
  ```tsx
  export interface JsonInputCardProps {
    title?: string;
    badge?: string;
    placeholder?: string;
    buttonText?: string;
    onProcess: (jsonString: string) => void;
    disabled?: boolean;
    initialValue?: string;
  }
  export default function JsonInputCard(props: JsonInputCardProps): JSX.Element
  ```

- [ ] **Step 1: Write the failing unit test**

Create `frontend/src/components/common/JsonInputCard.test.tsx`:
```tsx
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import JsonInputCard from './JsonInputCard'

describe('JsonInputCard', () => {
  it('renders title, badge, textarea and process button', () => {
    const handleProcess = vi.fn()
    render(
      <JsonInputCard
        title="Nhập nhanh bằng JSON"
        badge="Thông minh"
        buttonText="Xử lý JSON"
        onProcess={handleProcess}
      />
    )

    expect(screen.getByText('Nhập nhanh bằng JSON')).toBeInTheDocument()
    expect(screen.getByText('Thông minh')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Xử lý JSON/i })).toBeInTheDocument()
  })

  it('shows error when submitting empty input', () => {
    const handleProcess = vi.fn()
    render(<JsonInputCard onProcess={handleProcess} />)

    fireEvent.click(screen.getByRole('button', { name: /Xử lý JSON/i }))
    expect(screen.getByText('Vui lòng nhập JSON')).toBeInTheDocument()
    expect(handleProcess).not.toHaveBeenCalled()
  })

  it('calls onProcess with text content on valid input', () => {
    const handleProcess = vi.fn()
    render(<JsonInputCard onProcess={handleProcess} />)

    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, { target: { value: '{"test": 123}' } })
    fireEvent.click(screen.getByRole('button', { name: /Xử lý JSON/i }))

    expect(handleProcess).toHaveBeenCalledWith('{"test": 123}')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/common/JsonInputCard.test.tsx` in `frontend/`  
Expected: FAIL (Cannot find module `./JsonInputCard`)

- [ ] **Step 3: Implement `JsonInputCard`**

Create `frontend/src/components/common/JsonInputCard.tsx`:
```tsx
import React, { useState } from 'react'
import { Code2, Settings2 } from 'lucide-react'

export interface JsonInputCardProps {
  title?: string;
  badge?: string;
  placeholder?: string;
  buttonText?: string;
  onProcess: (jsonString: string) => void;
  disabled?: boolean;
  initialValue?: string;
}

export default function JsonInputCard({
  title = 'Nhập nhanh bằng JSON',
  badge = 'Thông minh',
  placeholder = '',
  buttonText = 'Xử lý JSON',
  onProcess,
  disabled = false,
  initialValue = ''
}: JsonInputCardProps) {
  const [jsonInput, setJsonInput] = useState(initialValue)
  const [error, setError] = useState<string | null>(null)

  const handleProcess = () => {
    setError(null)
    if (!jsonInput.trim()) {
      setError('Vui lòng nhập JSON')
      return
    }
    try {
      onProcess(jsonInput)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Có lỗi khi xử lý JSON'
      setError(msg)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 relative shadow-primary/5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Code2 className="text-primary w-5 h-5" />
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-tight">{title}</h2>
          {badge && (
            <span className="px-1.5 py-0.5 bg-blue-100 text-primary text-[9px] font-bold rounded uppercase">
              {badge}
            </span>
          )}
        </div>
      </div>
      <div className="space-y-4">
        <textarea
          disabled={disabled}
          className={`w-full min-h-[140px] bg-slate-50 border-slate-200 rounded-xl p-4 focus:ring-primary focus:border-primary text-xs font-mono placeholder:text-slate-400 disabled:opacity-50 ${
            error ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : ''
          }`}
          placeholder={placeholder}
          value={jsonInput}
          onChange={(e) => {
            setJsonInput(e.target.value)
            if (error) setError(null)
          }}
        />
        {error && <p className="text-red-500 text-xs font-bold px-1">{error}</p>}
        <div className="flex justify-end">
          <button
            type="button"
            disabled={disabled}
            className="bg-primary hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-primary/30 disabled:opacity-50"
            onClick={handleProcess}
          >
            <Settings2 className="w-4 h-4" />
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/common/JsonInputCard.test.tsx` in `frontend/`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/common/JsonInputCard.tsx frontend/src/components/common/JsonInputCard.test.tsx
git commit -m "feat(ui): add reusable JsonInputCard component"
```

---

### Task 2: Embed `JsonInputCard` in `LectureContentEditor`

**Files:**
- Modify: `frontend/src/components/lecture/creator/LectureContentEditor.tsx`
- Test: `frontend/src/components/lecture/creator/LectureContentEditor.test.tsx`

**Interfaces:**
- Consumes: `JsonInputCard` from `@/components/common/JsonInputCard`, `parseLectureJson` from `./utils/lectureJsonParser`

- [ ] **Step 1: Update `LectureContentEditor.test.tsx` to test embedded `JsonInputCard`**

Update `frontend/src/components/lecture/creator/LectureContentEditor.test.tsx`:
```tsx
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import LectureContentEditor from './LectureContentEditor'
import { LectureCreatorProvider } from './LectureCreatorContext'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe('LectureContentEditor', () => {
  it('renders section title and embedded JsonInputCard', () => {
    render(
      <LectureCreatorProvider>
        <LectureContentEditor />
      </LectureCreatorProvider>
    )

    expect(screen.getByText('2. Phân tích bài tập mẫu')).toBeInTheDocument()
    expect(screen.getByText('Nhập nhanh bằng JSON')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Xử lý JSON/i })).toBeInTheDocument()
  })

  it('parses JSON input and updates lecture dangToanList', () => {
    render(
      <LectureCreatorProvider>
        <LectureContentEditor />
      </LectureCreatorProvider>
    )

    const textarea = screen.getByRole('textbox')
    const sampleJson = JSON.stringify([
      {
        mathType: 'Dạng 1. Đơn thức thử nghiệm',
        Solution: 'Lý thuyết đơn thức',
        exams: [{ problem: 'Ví dụ 1' }]
      }
    ])

    fireEvent.change(textarea, { target: { value: sampleJson } })
    fireEvent.click(screen.getByRole('button', { name: /Xử lý JSON/i }))

    expect(screen.getByDisplayValue('Dạng 1. Đơn thức thử nghiệm')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to observe behavior**

Run: `npx vitest run src/components/lecture/creator/LectureContentEditor.test.tsx` in `frontend/`  
Expected: FAIL (or missing card)

- [ ] **Step 3: Update `LectureContentEditor.tsx`**

Replace the modal and popup button in `LectureContentEditor.tsx` with `<JsonInputCard ... />` placed directly under `2. Phân tích bài tập mẫu`:
```tsx
'use client'
import React from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import DangToanCard from './DangToanCard'
import LectureMediaCard from './LectureMediaCard'
import { useLectureCreator } from './LectureCreatorContext'
import { parseLectureJson } from './utils/lectureJsonParser'
import JsonInputCard from '@/components/common/JsonInputCard'

const LECTURE_JSON_HINT = `[
  {
    "mathType": "Dạng 1. Nhận biết đơn thức",
    "methods": [
      {
        "Solution": "Đơn thức là biểu thức đại số...",
        "exams": [
          {
            "problem": "Ví dụ 1...",
            "steps": [
              { "step": 1, "title": "Bước 1", "content": "...", "formula": "x = 1" }
            ],
            "conclusion": "..."
          }
        ]
      }
    ]
  }
]`

export default function LectureContentEditor() {
  const { 
    contentType, 
    dangToanList, 
    setDangToanList,
    removeDangToan 
  } = useLectureCreator()

  const handleProcessJson = (jsonString: string) => {
    const parsedList = parseLectureJson(jsonString)
    setDangToanList(parsedList)
    toast.success(`Đã nhập thành công ${parsedList.length} dạng toán!`)
  }

  const addDangToan = () => {
    setDangToanList([
      ...dangToanList, 
      { 
        id: Math.random().toString(36).substr(2, 9), 
        dangToanName: '', 
        methods: [
          { id: Math.random().toString(36).substr(2, 9), methodName: '', methodContent: '', exercise: null, problemImage: null, solutionImage: null }
        ] 
      }
    ])
  }

  const updateDangToan = (id: string, updatedDt: any) => {
    setDangToanList(dangToanList.map(dt => dt.id === id ? updatedDt : dt))
  }

  return (
    <div className="space-y-6">
      <div className={`space-y-6 transition-opacity duration-300 ${
        contentType === 'practice' ? 'opacity-35 pointer-events-none select-none filter grayscale-[30%]' : ''
      }`}>
        <LectureMediaCard />

        <div className="mb-2">
          <h2 className="text-xl font-bold text-slate-800">2. Phân tích bài tập mẫu</h2>
        </div>

        <JsonInputCard
          title="Nhập nhanh bằng JSON"
          badge="Thông minh"
          placeholder={LECTURE_JSON_HINT}
          buttonText="Xử lý JSON"
          onProcess={handleProcessJson}
          disabled={contentType === 'practice'}
        />

        {dangToanList.map((dt, index) => (
          <DangToanCard
            key={dt.id}
            dangToan={dt}
            index={index}
            onChange={(updatedDt) => updateDangToan(dt.id, updatedDt)}
            onRemove={dangToanList.length > 1 ? () => removeDangToan(dt.id) : undefined}
          />
        ))}

        <div className="flex justify-center mt-6">
          <button
            onClick={addDangToan}
            disabled={contentType === 'practice'}
            className="px-6 py-3 bg-white rounded-full shadow-[0_4px_20px_rgb(0,0,0,0.08)] flex items-center justify-center hover:shadow-[0_4px_25px_rgb(0,0,0,0.12)] hover:-translate-y-0.5 transition-all duration-200 border border-slate-50 gap-2 font-bold text-primary disabled:opacity-50"
            title="Thêm Dạng Toán mới"
          >
            <Plus className="w-5 h-5 stroke-[3]" /> Thêm Dạng Toán Mới
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/lecture/creator/LectureContentEditor.test.tsx` in `frontend/`  
Expected: PASS (2/2 tests)

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/lecture/creator/LectureContentEditor.tsx frontend/src/components/lecture/creator/LectureContentEditor.test.tsx
git commit -m "feat(lecture): embed JsonInputCard under Section 2 and remove modal"
```

---

### Task 3: Refactor `JsonInputSection` in Question Creator

**Files:**
- Modify: `frontend/src/components/questions/creator/JsonInputSection.tsx`
- Test: `frontend/src/components/questions/creator/JsonInputSection.test.tsx`

**Interfaces:**
- Consumes: `JsonInputCard` from `@/components/common/JsonInputCard`

- [ ] **Step 1: Check existing test**

Run: `npx vitest run src/components/questions/creator/JsonInputSection.test.tsx` in `frontend/`  
Expected: PASS

- [ ] **Step 2: Refactor `JsonInputSection.tsx` to use `JsonInputCard`**

Update `frontend/src/components/questions/creator/JsonInputSection.tsx` to replace the inner card DOM with `<JsonInputCard ... />` while preserving `processQuestionJson` block conversion logic:
```tsx
import React from 'react'
import { QuestionBlock, Question } from '../../../types/question'
import JsonInputCard from '@/components/common/JsonInputCard'

interface JsonInputSectionProps {
  onProcessJson?: (blocks: QuestionBlock[]) => void;
  currentGlobalIndex?: number;
  totalQuestions?: number;
  currentQuestion?: Question | null;
  onNext?: () => void;
  onPrev?: () => void;
}

const QUESTION_JSON_HINT = `[{
  "shared_content": "Nội dung dẫn chung",
  "questions": [{
    "type_question": "group" hoặc "single",
    "content": "Nội dung câu hỏi",
    "type": "Trắc nghiệm" hoặc "Tự luận",
    "options": ["A", "B", "C", "D"],
    "correct_answer": "đáp án đúng",
    "solution_guide": {
      "problem": "Nội dung đề bài",
      "steps": [
        {
          "step": 1,
          "title": "Bước 1",
          "content": "Nội dung diễn giải",
          "formula": "x = 1"
        }
      ],
      "conclusion": "Kết luận",
      "tips": "Mẹo"
    }
  }]
}]`;

export default function JsonInputSection({
  onProcessJson = () => {}
}: JsonInputSectionProps) {
  const handleProcess = (jsonInput: string) => {
    const parsed = JSON.parse(jsonInput) as QuestionBlock[];
    if (!Array.isArray(parsed)) {
      throw new Error('Dữ liệu phải là mảng (array)');
    }
    
    const processedBlocks = parsed.map(block => {
      const isGroup = block.questions.length > 1 || block.questions.some(q => q.type_question?.toString().toLowerCase() === 'group');
      return {
        ...block,
        is_group: isGroup,
        questions: block.questions.map(q => {
          const processedQ = { ...q };

          if (processedQ.solution_guide && typeof processedQ.solution_guide === 'object') {
            const parsedGuide = processedQ.solution_guide as any;
            let html = `<div class="exercise-content bg-transparent p-4">`
            
            if (parsedGuide.problem) {
               html += `<div class="bg-slate-50 p-5 rounded-lg border border-slate-200 mb-8">
                  <p class="italic text-slate-700 !m-0">${parsedGuide.problem}</p>
                </div>`
            }

            const stepsData = parsedGuide.steps || parsedGuide.Steps;
            const hasTimeline = (stepsData && Array.isArray(stepsData) && stepsData.length > 0) || parsedGuide.conclusion || parsedGuide.tips;

            if (hasTimeline) {
              html += `<div class="space-y-0">`
              
              let timelineItems: any[] = [];
              if (stepsData && Array.isArray(stepsData)) {
                  stepsData.forEach((step: any, idx: number) => {
                      timelineItems.push({
                          type: 'step',
                          idx: step.step || idx + 1,
                          title: step.title,
                          content: step.content,
                          formula: step.formula
                      });
                  });
              }
              if (parsedGuide.conclusion) {
                  timelineItems.push({
                      type: 'conclusion',
                      content: parsedGuide.conclusion
                  });
              }
              if (parsedGuide.tips) {
                  timelineItems.push({
                      type: 'tips',
                      content: parsedGuide.tips
                  });
              }

              timelineItems.forEach((item: any, i: number) => {
                  const isLast = i === timelineItems.length - 1;
                  
                  html += `<div class="flex gap-4">
                      <div class="flex-none flex flex-col items-center">`
                      
                  if (item.type === 'step') {
                      html += `<p class="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm !m-0">${item.idx}</p>`
                  } else if (item.type === 'conclusion') {
                      html += `<p class="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-sm !m-0">✓</p>`
                  } else if (item.type === 'tips') {
                      html += `<p class="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-sm !m-0">💡</p>`
                  }

                  if (!isLast) {
                      html += `<div class="w-0.5 h-full bg-slate-200 my-1"></div>`
                  }
                  
                  html += `</div>
                      <div class="${isLast ? '' : 'pb-8'} flex-1 pt-1">`
                      
                  if (item.type === 'step') {
                      if (item.title) {
                          html += `<h4 class="font-bold text-slate-900 !m-0">${item.title}</h4>`
                      }
                      if (item.content) {
                          html += `<p class="text-slate-600 mt-1 !mb-0">${item.content}</p>`
                      }
                      if (item.formula) {
                          html += `<p class="mt-3 text-blue-600 font-bold !m-0">${item.formula.includes('$') ? item.formula : '$$' + item.formula + '$$'}</p>`
                      }
                  } else if (item.type === 'conclusion') {
                      html += `<h4 class="font-bold text-slate-900 !m-0">Kết luận</h4>
                               <p class="text-slate-600 mt-1 !mb-0">${item.content}</p>`
                  } else if (item.type === 'tips') {
                      html += `<h4 class="font-bold text-slate-900 !m-0">Gợi ý</h4>
                               <p class="text-slate-600 mt-1 !mb-0">${item.content}</p>`
                  }

                  html += `</div></div>`
              });

              html += `</div>`
            }

            html += `</div>`
            processedQ.solution_guide = html;
          }

          return processedQ;
        })
      };
    });

    onProcessJson(processedBlocks);
  };

  return (
    <section className="space-y-4">
      <JsonInputCard
        title="Nhập nhanh bằng JSON"
        badge="Thông minh"
        placeholder={QUESTION_JSON_HINT}
        buttonText="Xử lý JSON"
        onProcess={handleProcess}
      />
    </section>
  )
}
```

- [ ] **Step 3: Run test to verify it passes**

Run: `npx vitest run src/components/questions/creator/JsonInputSection.test.tsx` in `frontend/`  
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/questions/creator/JsonInputSection.tsx
git commit -m "refactor(questions): reuse JsonInputCard inside JsonInputSection"
```

---

### Task 4: Backend `DELETE /api/v1/lectures/:id`

**Files:**
- Modify: `backend/internal/repository/lecture_repo.go`
- Modify: `backend/internal/services/lecture_service.go`
- Modify: `backend/internal/services/lecture_service_test.go`
- Modify: `backend/internal/controllers/lecture_controller.go`
- Modify: `backend/internal/routes/routes.go`

**Interfaces:**
- `LectureRepository.DeleteLecture(ctx context.Context, id string) error`
- `LectureService.DeleteLecture(ctx context.Context, id string) error`
- `LectureController.DeleteLecture(c *gin.Context)`
- `DELETE /api/v1/lectures/:id`

- [ ] **Step 1: Write the failing unit test for `DeleteLecture` in service**

In `backend/internal/services/lecture_service_test.go`:
Add `DeleteLecture` to `mockLectureRepository`:
```go
func (m *mockLectureRepository) DeleteLecture(ctx context.Context, id string) error {
	if m.err != nil {
		return m.err
	}
	return nil
}
```
Add unit test:
```go
func TestLectureService_DeleteLecture(t *testing.T) {
	t.Run("success", func(t *testing.T) {
		mockRepo := &mockLectureRepository{}
		svc := NewLectureService(mockRepo)

		err := svc.DeleteLecture(context.Background(), uuid.New().String())
		assert.NoError(t, err)
	})

	t.Run("invalid uuid", func(t *testing.T) {
		mockRepo := &mockLectureRepository{}
		svc := NewLectureService(mockRepo)

		err := svc.DeleteLecture(context.Background(), "invalid-uuid")
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "invalid lecture id")
	})
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `go test -v ./internal/services -run TestLectureService_DeleteLecture` in `backend/`  
Expected: FAIL (type LectureService has no field or method DeleteLecture)

- [ ] **Step 3: Implement DeleteLecture in Repository, Service, Controller, and Routes**

1. In `backend/internal/repository/lecture_repo.go`:
Add method to interface:
```go
DeleteLecture(ctx context.Context, id string) error
```
Implement on `lectureRepository`:
```go
func (r *lectureRepository) DeleteLecture(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		return tx.Where("id = ?", id).Delete(&models.Lecture{}).Error
	})
}
```

2. In `backend/internal/services/lecture_service.go`:
Add to `LectureService` interface:
```go
DeleteLecture(ctx context.Context, id string) error
```
Implement on `lectureService`:
```go
func (s *lectureService) DeleteLecture(ctx context.Context, id string) error {
	if _, err := uuid.Parse(id); err != nil {
		return errors.New("invalid lecture id")
	}
	return s.repo.DeleteLecture(ctx, id)
}
```

3. In `backend/internal/controllers/lecture_controller.go`:
Add controller handler:
```go
func (ctrl *LectureController) DeleteLecture(c *gin.Context) {
	id := c.Param("id")
	if err := ctrl.service.DeleteLecture(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Lecture deleted successfully",
	})
}
```

4. In `backend/internal/routes/routes.go`:
Under `admin` group:
```go
admin.DELETE("/lectures/:id", lectureController.DeleteLecture)
```

- [ ] **Step 4: Run backend unit test to verify it passes**

Run: `go test -v ./internal/services -run TestLectureService_DeleteLecture` in `backend/`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/internal/repository/lecture_repo.go backend/internal/services/lecture_service.go backend/internal/services/lecture_service_test.go backend/internal/controllers/lecture_controller.go backend/internal/routes/routes.go
git commit -m "feat(api): add DELETE /api/v1/lectures/:id endpoint"
```

---

### Task 5: Frontend `deleteLecture` API & Creator Header Delete Button

**Files:**
- Modify: `frontend/src/lib/api.ts`
- Modify: `frontend/src/components/lecture/creator/LectureCreatorHeader.tsx`
- Test: `frontend/src/components/lecture/creator/LectureCreatorHeader.test.tsx`

**Interfaces:**
- `deleteLecture(id: string): Promise<boolean>`
- `LectureCreatorHeader`: renders delete button when `isEdit === true`

- [ ] **Step 1: Write test for Delete Button in `LectureCreatorHeader.test.tsx`**

Update `frontend/src/components/lecture/creator/LectureCreatorHeader.test.tsx`:
```tsx
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import LectureCreatorHeader from './LectureCreatorHeader'
import { LectureCreatorProvider } from './LectureCreatorContext'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('@/lib/api', () => ({
  apiFetch: vi.fn(),
  deleteLecture: vi.fn().mockResolvedValue(true),
}))

describe('LectureCreatorHeader', () => {
  it('does not render delete button when creating new lecture', () => {
    render(
      <LectureCreatorProvider>
        <LectureCreatorHeader />
      </LectureCreatorProvider>
    )

    expect(screen.queryByRole('button', { name: /Xóa bài giảng/i })).not.toBeInTheDocument()
    expect(screen.getByText('Soạn bài giảng mới')).toBeInTheDocument()
  })

  it('renders delete button and opens confirmation dialog when editing lecture', () => {
    render(
      <LectureCreatorProvider editId="test-lecture-123">
        <LectureCreatorHeader />
      </LectureCreatorProvider>
    )

    const deleteBtn = screen.getByRole('button', { name: /Xóa bài giảng/i })
    expect(deleteBtn).toBeInTheDocument()

    fireEvent.click(deleteBtn)
    expect(screen.getByText(/Xác nhận xóa bài giảng/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/lecture/creator/LectureCreatorHeader.test.tsx` in `frontend/`  
Expected: FAIL (Cannot find role button with name /Xóa bài giảng/i)

- [ ] **Step 3: Add `deleteLecture` in `frontend/src/lib/api.ts` and update `LectureCreatorHeader.tsx`**

1. In `frontend/src/lib/api.ts`:
```ts
export async function deleteLecture(id: string): Promise<boolean> {
  try {
    await apiFetch(`/lectures/${id}`, {
      method: 'DELETE',
    });
    return true;
  } catch (error) {
    console.error(`Failed to delete lecture ${id}:`, error);
    throw error;
  }
}
```

2. In `frontend/src/components/lecture/creator/LectureCreatorHeader.tsx`:
```tsx
'use client'
import React, { useState } from 'react'
import { ArrowLeft, FileText, Save, Loader2, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { useLectureCreator } from './LectureCreatorContext'
import { deleteLecture } from '@/lib/api'

export default function LectureCreatorHeader() {
  const router = useRouter()
  const { validateAndSubmit, isSubmitting, isEdit, editId } = useLectureCreator()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)

  const handleDelete = async () => {
    if (!editId) return
    setIsDeleting(true)
    try {
      await deleteLecture(editId)
      toast.success('Đã xóa bài giảng thành công!')
      setShowConfirmDelete(false)
      setTimeout(() => {
        router.push('/dashboard/lectures')
      }, 500)
    } catch (err: any) {
      toast.error(`Xóa bài giảng thất bại: ${err.message}`)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 w-full">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/lectures" className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-slate-800">
                {isEdit ? 'Chỉnh sửa bài giảng' : 'Soạn bài giảng mới'}
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {isEdit && editId && (
              <Button
                variant="outline"
                className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 flex items-center gap-2"
                onClick={() => setShowConfirmDelete(true)}
                disabled={isSubmitting || isDeleting}
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Xóa bài giảng
              </Button>
            )}

            <Button variant="secondary" className="hidden md:flex items-center gap-2" disabled={isSubmitting || isDeleting}>
              <FileText className="w-4 h-4" />
              Tải file PDF đính kèm
            </Button>
            
            <Button 
              className="px-6 flex items-center gap-2 shadow-sm shadow-primary/20"
              onClick={validateAndSubmit}
              disabled={isSubmitting || isDeleting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {isEdit ? 'Cập nhật bài giảng' : 'Lưu & Xuất bản'}
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Confirmation Modal */}
      {showConfirmDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl border border-slate-100 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Xác nhận xóa bài giảng</h3>
            <p className="text-sm text-slate-600">
              Bạn có chắc chắn muốn xóa bài giảng này không? Hành động này sẽ xóa toàn bộ nội dung và không thể hoàn tác.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="ghost"
                onClick={() => setShowConfirmDelete(false)}
                disabled={isDeleting}
              >
                Hủy
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Xác nhận xóa'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/lecture/creator/LectureCreatorHeader.test.tsx` in `frontend/`  
Expected: PASS (2/2 tests)

- [ ] **Step 5: Run full test suite for creators**

Run: `npx vitest run src/components/common/ src/components/lecture/creator/ src/components/questions/creator/` in `frontend/`  
Expected: All tests pass

- [ ] **Step 6: Commit**

```bash
git add frontend/src/lib/api.ts frontend/src/components/lecture/creator/LectureCreatorHeader.tsx frontend/src/components/lecture/creator/LectureCreatorHeader.test.tsx
git commit -m "feat(lecture): add delete lecture button with confirmation modal in editor header"
```
