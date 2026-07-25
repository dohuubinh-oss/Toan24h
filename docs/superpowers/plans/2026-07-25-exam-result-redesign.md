# Exam Result Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Exam Result page to reuse the "Take Exam" UI layout, providing a unified sidebar navigation and main content area for focused question review.

**Architecture:** We will extract the common layout into a new `ExamWorkspaceLayout` wrapper component. We will modify `QuestionMapSidebar`, `MultipleChoiceQuestion`, and `EssayQuestion` to accept a `mode` or `readonly` prop to render grading feedback and disable inputs. Finally, we will refactor the result page to map its data into these new shared components.

**Tech Stack:** React, Next.js (App Router), TailwindCSS, TypeScript.

## Global Constraints
- Do not modify or break the existing `take/page.tsx` functionality.
- Ensure type consistency across components.
- Maintain isolated routing between `take` and `result` pages.

---

### Task 1: Create `ExamWorkspaceLayout` Component

**Files:**
- Create: `frontend/src/components/exam/ExamWorkspaceLayout.tsx`

**Interfaces:**
- Produces: `ExamWorkspaceLayout` React component.

- [ ] **Step 1: Write the component implementation**
Create a new file `frontend/src/components/exam/ExamWorkspaceLayout.tsx`.

```tsx
import React from 'react'

interface ExamWorkspaceLayoutProps {
  sidebarTopContent?: React.ReactNode
  sidebarGrid: React.ReactNode
  mainContent: React.ReactNode
  footerContent?: React.ReactNode
}

export default function ExamWorkspaceLayout({
  sidebarTopContent,
  sidebarGrid,
  mainContent,
  footerContent,
}: ExamWorkspaceLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col md:flex-row relative">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <main className="flex-1 overflow-y-auto pb-32">
          {mainContent}
        </main>
        
        {/* Footer Navigation */}
        <div className="fixed md:absolute bottom-0 left-0 right-0 md:right-80 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-4 shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.05)] z-20">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            {footerContent}
          </div>
        </div>
      </div>

      {/* Right Sidebar Placeholder (hidden on mobile by default unless toggled, but handled by QuestionMapSidebar normally. Here we just provide the container space for desktop) */}
      <aside className="hidden md:block w-80 bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 h-screen overflow-y-auto flex-shrink-0 z-10">
        <div className="p-6 flex flex-col gap-6">
          {sidebarTopContent}
          {sidebarGrid}
        </div>
      </aside>

      {/* Mobile Sidebar (handled internally by QuestionMapSidebar normally, but we need to ensure the grid can render in a drawer if needed, though QuestionMapSidebar has its own mobile toggle) */}
      {/* For this refactor, we assume QuestionMapSidebar handles its own mobile responsiveness like it currently does, so we just wrap it. */}
    </div>
  )
}
```

---

### Task 2: Modify `QuestionMapSidebar` for Result Mode

**Files:**
- Modify: `frontend/src/components/exam/taking/QuestionMapSidebar.tsx`

**Interfaces:**
- Consumes: Existing `QuestionStatus`
- Produces: Updated `QuestionStatus` type (`'done' | 'current' | 'unfinished' | 'correct' | 'incorrect' | 'warning'`), new `mode` prop.

- [ ] **Step 1: Update type definitions and props**
Modify the interfaces at the top of the file.

```tsx
export type QuestionStatus = 'done' | 'current' | 'unfinished' | 'correct' | 'incorrect' | 'warning'

export interface QuestionMapItem {
  id: string
  index: number
  status: QuestionStatus
  isFlagged: boolean
}

interface QuestionMapSidebarProps {
  questions: QuestionMapItem[]
  mode?: 'take' | 'result'
  onSelectQuestion: (id: string) => void
  onSubmit?: () => void
}
```

- [ ] **Step 2: Update color logic in the component**
Inside `QuestionMapSidebar.tsx`, update the `getStatusColor` and `getStatusText` functions (or inline logic) to handle the new statuses. Update the default value of `mode` to `'take'`.

```tsx
export default function QuestionMapSidebar({ questions, onSelectQuestion, onSubmit, mode = 'take' }: QuestionMapSidebarProps) {
  // ... existing state ...

  const getStatusColor = (status: QuestionStatus) => {
    switch (status) {
      case 'current': return 'bg-primary text-white border-primary shadow-md shadow-primary/20'
      case 'done': return 'bg-primary/10 text-primary border-primary/20'
      case 'correct': return 'bg-success text-white border-success shadow-md shadow-success/20'
      case 'incorrect': return 'bg-destructive text-white border-destructive shadow-md shadow-destructive/20'
      case 'warning': return 'bg-warning text-white border-warning shadow-md shadow-warning/20'
      case 'unfinished': 
      default: return 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-primary/30 hover:bg-slate-50'
    }
  }

  // ... replace the grid rendering to use this function ...
  // className={`... ${getStatusColor(q.status)} ...`}
```

- [ ] **Step 3: Conditionally render the submit button**
In the render function of `QuestionMapSidebar`, conditionally hide the submit button if `mode === 'result'` or `!onSubmit`.

```tsx
          {/* Action Buttons */}
          {mode === 'take' && onSubmit && (
            <div className="pt-4 mt-2 border-t border-slate-200 dark:border-slate-700">
              <button 
                onClick={onSubmit}
                className="w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-2"
              >
                <CheckCheck className="w-5 h-5" />
                Nộp bài
              </button>
            </div>
          )}
```

---

### Task 3: Modify `MultipleChoiceQuestion` for Readonly Mode

**Files:**
- Modify: `frontend/src/components/exam/taking/MultipleChoiceQuestion.tsx`

**Interfaces:**
- Produces: Updated component accepting `readonly`, `correctOptionId`, and `aiExplanation`.

- [ ] **Step 1: Update props interface**
```tsx
interface MultipleChoiceQuestionProps {
  questionId: string // Change to string to match other parts if needed, or keep number if it was number
  index: number
  topic?: string
  content: string
  options: MultipleChoiceOption[]
  selectedOptionId: string | null
  correctOptionId?: string | null
  aiExplanation?: string
  readonly?: boolean
  selectedExplanation?: string
  isHintOpen: boolean
  isFlagged: boolean
  examType?: string
  onSelectOption?: (optionId: string, explanation?: string) => void
  onToggleHint?: () => void
  onToggleFlag?: () => void
}
```

- [ ] **Step 2: Update rendering logic**
Disable inputs if `readonly` is true. Change the styling of options if `readonly` is true based on whether they match `correctOptionId` or `selectedOptionId` (highlight correct in green, wrong selection in red). Show `aiExplanation` box at the bottom if `readonly` is true.

```tsx
// Inside option map:
const isSelected = selectedOptionId === option.id
const isCorrect = readonly && correctOptionId === option.id
const isWrongSelection = readonly && isSelected && correctOptionId !== option.id

let optionClass = "border-slate-200 ..."
if (readonly) {
  if (isCorrect) optionClass = "border-success bg-success/10 text-success"
  else if (isWrongSelection) optionClass = "border-destructive bg-destructive/10 text-destructive"
  else optionClass = "border-slate-200 opacity-50"
} else if (isSelected) {
  optionClass = "border-primary bg-primary/5 text-primary"
}
```

---

### Task 4: Modify `EssayQuestion` for Readonly Mode

**Files:**
- Modify: `frontend/src/components/exam/taking/EssayQuestion.tsx`

**Interfaces:**
- Produces: Updated component accepting `readonly` and grading feedback.

- [ ] **Step 1: Update props interface**
Add `readonly?: boolean`, `aiFeedback?: any`, `score?: number`, `maxScore?: number`.

- [ ] **Step 2: Update rendering logic**
Hide file upload controls if `readonly` is true. Display the submitted image(s) or text. Render an AI Feedback box below the question showing `score`, `maxScore`, and `aiFeedback`. Add a dummy "Kháng cáo" button inside this feedback box.

---

### Task 5: Refactor `Result Page`

**Files:**
- Modify: `frontend/src/app/(fullscreen)/exam/[id]/result/page.tsx`

**Interfaces:**
- Consumes: `ExamWorkspaceLayout`, updated components.

- [ ] **Step 1: Replace old layout with `ExamWorkspaceLayout`**
Import the layout and updated components. Maintain `currentQuestionIndex` state. Map `resultData.Details` into an array of question objects to feed into `QuestionMapSidebar` and the active question area.

- [ ] **Step 2: Implement Previous/Next Handlers**
```tsx
const handlePrev = () => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))
const handleNext = () => setCurrentQuestionIndex(prev => Math.min(totalQuestions - 1, prev + 1))
```

- [ ] **Step 3: Render logic**
Render `QuestionMapSidebar` passing `mode="result"` and calculating `status` ('correct', 'incorrect', 'warning') based on scores. Render the active question (MCQ or Essay) with `readonly=true` and passing the AI explanation / correct answer.
