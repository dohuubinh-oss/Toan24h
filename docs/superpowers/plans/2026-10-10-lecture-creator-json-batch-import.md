# Lecture Creator JSON Batch Import Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Chuyển đổi cơ chế nhập JSON từ cấp từng bài tập mẫu sang cấp toàn cục trên trang `/dashboard/lectures/create`, tự động bóc tách mảng JSON gồm nhiều Dạng toán & ví dụ thành state hoàn chỉnh.

**Architecture:** Tạo module tách riêng `lectureJsonParser.ts` chịu trách nhiệm phân tích cú pháp JSON và sinh mã HTML timeline cho các ví dụ bài tập. Gỡ bỏ nút "Nhập JSON" cục bộ trong `DangToanCard.tsx` và gắn nút "Nhập JSON" toàn cục vào thanh tiêu đề `2. Phân tích bài tập mẫu` trong `LectureContentEditor.tsx`.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Vitest, Tailwind CSS, Lucide React.

## Global Constraints

- Không sửa đổi cấu trúc dữ liệu `DangToanItem`, `MethodItem` trong `LectureCreatorContext.tsx` để bảo đảm tương thích với API backend.
- Đảm bảo công thức Math LaTeX trong các bước giải luôn được bọc trong cặp `$$` nếu chưa có.
- Tuân thủ quy tắc No-Line và hệ thống design tokens hiện có của dự án.

---

### Task 1: Module phân tích cú pháp JSON `lectureJsonParser` (TDD)

**Files:**
- Create: `frontend/src/components/lecture/creator/utils/lectureJsonParser.ts`
- Test: `frontend/src/components/lecture/creator/utils/lectureJsonParser.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export interface RawExamStep {
    step: number;
    title?: string;
    content?: string;
    formula?: string;
  }
  export interface RawExamItem {
    problem?: string;
    conclusion?: string;
    tips?: string;
    steps?: RawExamStep[];
  }
  export interface RawMathTypeItem {
    mathType: string;
    Solution?: string;
    exams?: RawExamItem[];
  }
  export function buildExerciseHtmlFromExams(exams: RawExamItem[]): string;
  export function parseLectureJson(jsonString: string): DangToanItem[];
  ```

- [ ] **Step 1: Viết test kiểm tra phân tích cú pháp JSON**

Tạo file `frontend/src/components/lecture/creator/utils/lectureJsonParser.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { parseLectureJson, buildExerciseHtmlFromExams } from './lectureJsonParser'

describe('lectureJsonParser', () => {
  it('throws error for invalid JSON string', () => {
    expect(() => parseLectureJson('invalid json')).toThrow('JSON không hợp lệ')
  })

  it('throws error if JSON is not an array', () => {
    expect(() => parseLectureJson('{"mathType": "Dạng 1"}')).toThrow('Dữ liệu JSON phải là một danh sách (mảng []) các Dạng toán')
  })

  it('parses valid math types and maps to DangToanItem array', () => {
    const sample = JSON.stringify([
      {
        mathType: 'Dạng 1. Nhận biết đơn thức',
        Solution: 'Đơn thức là biểu thức...',
        exams: [
          {
            problem: 'Ví dụ 1',
            conclusion: 'Kết luận 1',
            steps: [
              { step: 1, title: 'Bước 1', content: 'Giải thích', formula: '-x^2y' }
            ]
          }
        ]
      }
    ])

    const result = parseLectureJson(sample)
    expect(result).toHaveLength(1)
    expect(result[0].dangToanName).toBe('Dạng 1. Nhận biết đơn thức')
    expect(result[0].methods).toHaveLength(1)
    expect(result[0].methods[0].methodContent).toBe('Đơn thức là biểu thức...')
    expect(result[0].methods[0].exercise?.content).toContain('Ví dụ 1')
    expect(result[0].methods[0].exercise?.content).toContain('Kết luận 1')
  })

  it('combines multiple exams in a single method exercise content', () => {
    const exams = [
      { problem: 'Ví dụ 1', steps: [{ step: 1, content: 'B1' }] },
      { problem: 'Ví dụ 2', steps: [{ step: 1, content: 'B2' }] }
    ]

    const html = buildExerciseHtmlFromExams(exams)
    expect(html).toContain('Ví dụ 1')
    expect(html).toContain('Ví dụ 2')
    expect(html).toContain('my-8 border-t border-dashed')
  })
})
```

- [ ] **Step 2: Chạy test để xác nhận test thất bại (Red)**

Chạy: `cd frontend && npx vitest run src/components/lecture/creator/utils/lectureJsonParser.test.ts`  
Kỳ vọng: FAIL do chưa tạo file `lectureJsonParser.ts`.

- [ ] **Step 3: Cài đặt logic parser `lectureJsonParser.ts`**

Tạo file `frontend/src/components/lecture/creator/utils/lectureJsonParser.ts`:

```ts
import { DangToanItem } from '../LectureCreatorContext'

export interface RawExamStep {
  step: number;
  title?: string;
  content?: string;
  formula?: string;
}

export interface RawExamItem {
  problem?: string;
  conclusion?: string;
  tips?: string;
  steps?: RawExamStep[];
}

export interface RawMathTypeItem {
  mathType: string;
  Solution?: string;
  exams?: RawExamItem[];
}

export function buildExerciseHtmlFromExams(exams: RawExamItem[]): string {
  if (!exams || exams.length === 0) return ''

  const examBlocks = exams.map((exam) => {
    let blockHtml = ''

    if (exam.problem) {
      blockHtml += `<div class="bg-slate-50 p-5 rounded-lg border border-slate-200 mb-6">
        <p class="italic text-slate-700 m-0">${exam.problem}</p>
      </div>`
    }

    const stepsData = exam.steps || []
    const hasTimeline = stepsData.length > 0 || exam.conclusion || exam.tips

    if (hasTimeline) {
      blockHtml += `<div class="space-y-0">`

      const timelineItems: Array<{
        type: 'step' | 'conclusion' | 'tips';
        idx?: number;
        title?: string;
        content?: string;
        formula?: string;
      }> = []

      stepsData.forEach((st, idx) => {
        timelineItems.push({
          type: 'step',
          idx: st.step || idx + 1,
          title: st.title,
          content: st.content,
          formula: st.formula
        })
      })

      if (exam.conclusion) {
        timelineItems.push({
          type: 'conclusion',
          content: exam.conclusion
        })
      }

      if (exam.tips) {
        timelineItems.push({
          type: 'tips',
          content: exam.tips
        })
      }

      timelineItems.forEach((item, i) => {
        const isLast = i === timelineItems.length - 1

        blockHtml += `<div class="flex gap-4">
          <div class="flex-none flex flex-col items-center">`

        if (item.type === 'step') {
          blockHtml += `<p class="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm m-0">${item.idx}</p>`
        } else if (item.type === 'conclusion') {
          blockHtml += `<p class="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-sm m-0">✓</p>`
        } else if (item.type === 'tips') {
          blockHtml += `<p class="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-sm m-0">💡</p>`
        }

        if (!isLast) {
          blockHtml += `<div class="w-0.5 h-full bg-slate-200 my-1"></div>`
        }

        blockHtml += `</div>
          <div class="${isLast ? '' : 'pb-8'} flex-1 pt-1">`

        if (item.type === 'step') {
          if (item.title) {
            blockHtml += `<h4 class="font-bold text-slate-900 m-0">${item.title}</h4>`
          }
          if (item.content) {
            blockHtml += `<p class="text-slate-600 mt-1 mb-0">${item.content}</p>`
          }
          if (item.formula) {
            const formattedFormula = item.formula.includes('$') ? item.formula : `$$${item.formula}$$`
            blockHtml += `<p class="mt-3 text-blue-600 font-bold m-0">${formattedFormula}</p>`
          }
        } else if (item.type === 'conclusion') {
          blockHtml += `<h4 class="font-bold text-slate-900 m-0">Kết luận</h4>
            <p class="text-slate-600 mt-1 mb-0">${item.content}</p>`
        } else if (item.type === 'tips') {
          blockHtml += `<h4 class="font-bold text-slate-900 m-0">Gợi ý</h4>
            <p class="text-slate-600 mt-1 mb-0">${item.content}</p>`
        }

        blockHtml += `</div></div>`
      })

      blockHtml += `</div>`
    }

    return blockHtml
  })

  return `<div class="exercise-content bg-white p-4">${examBlocks.join(
    '<div class="my-8 border-t border-dashed border-slate-200"></div>'
  )}</div>`
}

export function parseLectureJson(jsonString: string): DangToanItem[] {
  let parsed: unknown
  try {
    parsed = JSON.parse(jsonString)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'JSON không hợp lệ'
    throw new Error(`JSON không hợp lệ: ${message}`)
  }

  if (!Array.isArray(parsed)) {
    throw new Error('Dữ liệu JSON phải là một danh sách (mảng []) các Dạng toán')
  }

  if (parsed.length === 0) {
    throw new Error('Danh sách Dạng toán không được để trống')
  }

  return parsed.map((item: RawMathTypeItem, index: number) => {
    const dangToanId = Math.random().toString(36).substr(2, 9)
    const methodId = Math.random().toString(36).substr(2, 9)

    const exerciseContent = buildExerciseHtmlFromExams(item.exams || [])

    return {
      id: dangToanId,
      dangToanName: item.mathType || `Dạng toán ${index + 1}`,
      methods: [
        {
          id: methodId,
          methodName: '',
          methodContent: item.Solution || '',
          exercise: exerciseContent ? { content: exerciseContent } : null,
          problemImage: null,
          solutionImage: null
        }
      ]
    }
  })
}
```

- [ ] **Step 4: Chạy lại test để xác nhận passed (Green)**

Chạy: `cd frontend && npx vitest run src/components/lecture/creator/utils/lectureJsonParser.test.ts`  
Kỳ vọng: PASS cả 4 test cases.

- [ ] **Step 5: Commit code**

```bash
git add frontend/src/components/lecture/creator/utils/
git commit -m "feat(lecture-creator): add lectureJsonParser utility and tests"
```

---

### Task 2: Dọn dẹp nút JSON cục bộ trong `DangToanCard.tsx`

**Files:**
- Modify: `frontend/src/components/lecture/creator/DangToanCard.tsx`

- [ ] **Step 1: Xóa state modal, hàm `handleSaveJson`, nút Nhập JSON cục bộ và Modal JSX**

Trong `MethodCard` thuộc `DangToanCard.tsx`:
- Xóa các state:
  ```ts
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [jsonInput, setJsonInput] = useState('')
  const [jsonError, setJsonError] = useState('')
  ```
- Xóa hàm `handleSaveJson()`.
- Xóa nút:
  ```tsx
  <div className="flex justify-end mb-3">
    <Button variant="outline" onClick={() => setIsModalOpen(true)}>
      <Code className="w-3 h-3 mr-1.5" />
      Nhập JSON
    </Button>
  </div>
  ```
- Xóa toàn bộ khối `{isModalOpen && (...)}` (lines 257-317).
- Dọn dẹp các imports không còn dùng (`Code` nếu không dùng trong file).

- [ ] **Step 2: Kiểm tra biên dịch TypeScript**

Chạy: `cd frontend && npx tsc --noEmit`  
Kỳ vọng: Không có lỗi type error liên quan đến `DangToanCard.tsx`.

- [ ] **Step 3: Commit code**

```bash
git add frontend/src/components/lecture/creator/DangToanCard.tsx
git commit -m "refactor(lecture-creator): remove local json import button from MethodCard"
```

---

### Task 3: Bổ sung nút "Nhập JSON" và Modal bóc tách vào `LectureContentEditor.tsx`

**Files:**
- Modify: `frontend/src/components/lecture/creator/LectureContentEditor.tsx`

- [ ] **Step 1: Cập nhật giao diện tiêu đề mục 2 và thêm Modal Nhập JSON**

Cập nhật `frontend/src/components/lecture/creator/LectureContentEditor.tsx`:
1. Import `Code` từ `lucide-react`, `Button` từ `../../ui/Button`, `toast` từ `@/components/ui/ToastProvider`.
2. Import `parseLectureJson` từ `./utils/lectureJsonParser`.
3. Thêm state:
   ```tsx
   const [isJsonModalOpen, setIsJsonModalOpen] = useState(false)
   const [jsonInput, setJsonInput] = useState('')
   const [jsonError, setJsonError] = useState('')
   ```
4. Thêm hàm xử lý import:
   ```tsx
   const handleImportJson = () => {
     try {
       setJsonError('')
       const parsedList = parseLectureJson(jsonInput)
       setDangToanList(parsedList)
       setIsJsonModalOpen(false)
       setJsonInput('')
       toast.success(`Đã nhập thành công ${parsedList.length} dạng toán!`)
     } catch (err: any) {
       setJsonError(err.message || 'JSON không hợp lệ')
     }
   }
   ```
5. Cập nhật thanh tiêu đề:
   ```tsx
   <div className="flex items-center justify-between mb-4">
     <h2 className="text-xl font-bold text-slate-800">2. Phân tích bài tập mẫu</h2>
     <Button
       variant="outline"
       onClick={() => setIsJsonModalOpen(true)}
       disabled={contentType === 'practice'}
       className="border-slate-300 hover:border-primary hover:text-primary transition-colors text-xs font-semibold h-8 px-3 bg-white shadow-sm flex items-center gap-1.5"
     >
       <Code className="w-3.5 h-3.5" />
       Nhập JSON
     </Button>
   </div>
   ```
6. Render Modal ở cuối component:
   - Textarea để dán JSON.
   - Hiển thị lỗi nếu `jsonError`.
   - Nút Hủy và Xác nhận gọi `handleImportJson`.

- [ ] **Step 2: Kiểm tra biên dịch TypeScript**

Chạy: `cd frontend && npx tsc --noEmit`  
Kỳ vọng: Không có lỗi type error.

- [ ] **Step 3: Commit code**

```bash
git add frontend/src/components/lecture/creator/LectureContentEditor.tsx
git commit -m "feat(lecture-creator): add global batch json import to LectureContentEditor"
```

---

### Task 4: Kiểm thử End-to-End toàn diện

**Files:**
- N/A (Kiểm thử thực tế)

- [ ] **Step 1: Chạy toàn bộ test suites của parser**

Chạy: `cd frontend && npx vitest run src/components/lecture/creator/utils/lectureJsonParser.test.ts`  
Kỳ vọng: 100% tests pass.

- [ ] **Step 2: Kiểm tra chức năng thực tế trên giao diện**

1. Mở `http://localhost:3000/dashboard/lectures/create`.
2. Bấm nút **Nhập JSON** ở góc phải tiêu đề `2. Phân tích bài tập mẫu`.
3. Dán toàn bộ file JSON 6 Dạng toán của người dùng vào modal.
4. Bấm **Xác nhận**:
   - Kiểm tra giao diện tự động tạo đủ 6 Dạng toán (`Dạng 1...` đến `Dạng 6...`).
   - Kiểm tra ô *Nội dung phương pháp* hiển thị lý thuyết `Solution`.
   - Kiểm tra ô *BÀI TẬP MẪU* hiển thị đầy đủ các ví dụ bài tập với timeline các bước.
   - Thử thêm phương pháp giải cùng dạng toán và lưu bài giảng.

- [ ] **Step 3: Commit hoàn tất và chuẩn bị bàn giao**

```bash
git add .
git commit -m "chore: verify and finalize lecture creator json batch import feature"
```
