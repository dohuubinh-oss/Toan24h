# Question Creator Rubric & Step-by-Step Point Scale Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hiển thị và cấu hình thang điểm chi tiết cho từng bước giải trong trang Tạo/Sửa câu hỏi (`/dashboard/questions/create`), tự động đồng bộ tổng điểm vào thiết lập câu hỏi, hiển thị huy hiệu điểm trên timeline lời giải và cập nhật AI bóc tách tự động phân bổ điểm từng bước.

**Architecture:** Mở rộng kiểu dữ liệu `SolutionStep` với trường `point`, nâng cấp `formatSolutionGuide` để hiển thị badge điểm trang nhã trong timeline, xây dựng component `StepByStepSolutionEditor` trực quan với khả năng thêm/sửa/xóa bước giải cùng ô nhập điểm nhanh, tự động cộng dồn tổng điểm vào `currentQuestion.point` và hiển thị gợi ý thông minh trên `QuestionSettingsSidebar`.

**Tech Stack:** Next.js 14, React 18, TypeScript, Tailwind CSS, Vitest / React Testing Library, Go Fiber, GORM.

**Spec:** [docs/superpowers/specs/2026-10-22-question-creator-rubric-point-scale-design.md](file:///Users/modeptrai/Desktop/toan6789.vn/docs/superpowers/specs/2026-10-22-question-creator-rubric-point-scale-design.md)

## Global Constraints
- **Absolute Isolation:** Không tự ý deploy lên VPS. Không tham chiếu dự án bên ngoài.
- **Data Integrity:** Hướng dẫn giải dạng chuỗi string thuần cũ vẫn phải hoạt động bình thường, không gây lỗi khi không có cấu trúc steps hoặc `point` là null/undefined.
- **KaTeX / Math:** Tất cả công thức toán trong các bước giải đều phải duy trì bọc trong `$..$` hoặc `$$..$$`.
- **Strict TDD:** Mọi thay đổi đều phải có test tự động xác nhận trước khi hoàn thành task.

## Review Focus
1. `formatSolutionGuide` khi `item.point` là 0, undefined, hoặc null: Không được render badge điểm trống rỗng hoặc "0 điểm".
2. Chuyển đổi giữa chế độ từng bước và văn bản tự do: Dữ liệu văn bản không bị mất mát hay reset trắng.
3. Khi xóa hoặc sửa điểm một bước: Tổng điểm `point` của câu hỏi phải lập tức cập nhật lại đúng tổng mới.
4. Input điểm từng bước: Hỗ trợ số thập phân (`0.25`, `0.5`, `0.75`, `1.0`), không nhận giá trị âm.
5. AI Question Extractor: Parse thành công mảng `steps` có trường `point` từ Gemini JSON.

---

### Task 1: Mở rộng Types và Hiển thị Badge Thang điểm trong `formatSolutionGuide`

**Files:**
- Modify: `frontend/src/types/question.ts`
- Modify: `frontend/src/components/questions/creator/utils/questionTextFormatter.ts`
- Test: `frontend/src/components/questions/creator/utils/questionTextFormatter.test.ts`

**Interfaces:**
- Consumes: `SolutionStep`, `StructuredSolutionGuide`
- Produces: `formatSolutionGuide(guide: any): string` với badge điểm

- [ ] **Step 1: Viết failing test trong `questionTextFormatter.test.ts`**

```typescript
it('renders step point badge when point is specified in step', () => {
  const guideWithPoints = {
    steps: [
      { step: 1, title: 'Bước 1: Tìm x', content: 'Tính giá trị x', point: 0.5 },
      { step: 2, title: 'Bước 2: Tìm y', content: 'Tính giá trị y', point: 1 }
    ],
    conclusion: 'Vậy đáp số là $(x, y)$'
  };
  const html = formatSolutionGuide(guideWithPoints);
  expect(html).toContain('0.5 điểm');
  expect(html).toContain('1 điểm');
});

it('does not render point badge when point is missing or zero', () => {
  const guideWithoutPoints = {
    steps: [
      { step: 1, title: 'Bước 1', content: 'Nội dung', point: null },
      { step: 2, title: 'Bước 2', content: 'Nội dung' }
    ]
  };
  const html = formatSolutionGuide(guideWithoutPoints);
  expect(html).not.toContain('điểm</span>');
});
```

- [ ] **Step 2: Chạy test để xác nhận test thất bại**

Run: `npm --prefix frontend test -- questionTextFormatter.test.ts`
Expected: FAIL (chưa có badge `điểm`)

- [ ] **Step 3: Cập nhật `types/question.ts` và triển khai badge điểm trong `questionTextFormatter.ts`**

Cập nhật `types/question.ts`:
Thêm `SolutionStep` và `StructuredSolutionGuide`.

Cập nhật `formatSolutionGuide`:
Thêm `point: st.point || st.Point` vào `timelineItems`.
Khi render `item.type === 'step'`:
```typescript
if (item.point && Number(item.point) > 0) {
  html += `<span class="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">${item.point} điểm</span>`
}
```

- [ ] **Step 4: Chạy lại test để xác nhận test pass**

Run: `npm --prefix frontend test -- questionTextFormatter.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/types/question.ts frontend/src/components/questions/creator/utils/questionTextFormatter.ts frontend/src/components/questions/creator/utils/questionTextFormatter.test.ts
git commit -m "feat(question-creator): add point badge to solution guide step timeline"
```

---

### Task 2: Xây dựng Component `StepByStepSolutionEditor`

**Files:**
- Create: `frontend/src/components/questions/creator/editor/StepByStepSolutionEditor.tsx`
- Test: `frontend/src/components/questions/creator/editor/StepByStepSolutionEditor.test.tsx`

**Interfaces:**
- Consumes: `StructuredSolutionGuide`, `SolutionStep`
- Produces: `<StepByStepSolutionEditor guide={...} onChange={...} onTotalPointChange={...} />`

- [ ] **Step 1: Viết failing test trong `StepByStepSolutionEditor.test.tsx`**

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import StepByStepSolutionEditor from './StepByStepSolutionEditor';

describe('StepByStepSolutionEditor', () => {
  const initialGuide = {
    steps: [
      { step: 1, title: 'Bước 1: Tìm x', content: 'Tính x', formula: '$x=1$', point: 0.5 },
      { step: 2, title: 'Bước 2: Tìm y', content: 'Tính y', formula: '$y=2$', point: 0.5 }
    ],
    conclusion: 'Kết luận bài toán'
  };

  it('renders existing steps with their points', () => {
    render(<StepByStepSolutionEditor guide={initialGuide} onChange={vi.fn()} onTotalPointChange={vi.fn()} />);
    expect(screen.getByDisplayValue('0.5')).toBeDefined();
    expect(screen.getByDisplayValue('Bước 1: Tìm x')).toBeDefined();
  });

  it('calculates and calls onTotalPointChange when a step point changes', () => {
    const handleTotalChange = vi.fn();
    render(<StepByStepSolutionEditor guide={initialGuide} onChange={vi.fn()} onTotalPointChange={handleTotalChange} />);
    const pointInputs = screen.getAllByRole('spinbutton');
    fireEvent.change(pointInputs[0], { target: { value: '1.5' } });
    expect(handleTotalChange).toHaveBeenCalledWith(2.0);
  });
});
```

- [ ] **Step 2: Chạy test để xác nhận test thất bại**

Run: `npm --prefix frontend test -- StepByStepSolutionEditor.test.tsx`
Expected: FAIL (component chưa tồn tại)

- [ ] **Step 3: Triển khai `StepByStepSolutionEditor.tsx`**

Tạo component với:
- Danh sách các bước giải dạng thẻ (card) phân biệt rõ ràng.
- Ô nhập điểm nhanh (input type="number", step="0.25", min="0") cho từng bước.
- Ô nhập tiêu đề bước, nội dung bước, và công thức bước.
- Nút thêm bước mới (`+ Thêm bước`).
- Nút xóa bước giải.
- Ô nhập kết luận cuối bài (`conclusion`).
- Badge hiển thị tổng điểm: `Tổng thang điểm: X đ`.

- [ ] **Step 4: Chạy lại test để xác nhận test pass**

Run: `npm --prefix frontend test -- StepByStepSolutionEditor.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/questions/creator/editor/StepByStepSolutionEditor.tsx frontend/src/components/questions/creator/editor/StepByStepSolutionEditor.test.tsx
git commit -m "feat(question-creator): create StepByStepSolutionEditor component with point scale"
```

---

### Task 3: Tích hợp vào `QuestionEditorSection` & Đồng bộ Tổng điểm với `QuestionSettingsSidebar`

**Files:**
- Modify: `frontend/src/components/questions/creator/QuestionEditorSection.tsx`
- Modify: `frontend/src/components/questions/creator/QuestionSettingsSidebar.tsx`
- Test: `frontend/src/components/questions/creator/QuestionEditorSection.test.tsx`

**Interfaces:**
- Consumes: `<StepByStepSolutionEditor />`, `QuestionSettingsSidebar`
- Produces: Trải nghiệm biên tập thang điểm liền mạch trên `/dashboard/questions/create`

- [ ] **Step 1: Viết failing test trong `QuestionEditorSection.test.tsx`**

```typescript
it('allows switching between step-by-step and freeform solution guide modes', () => {
  // Test switching mode button
});

it('synchronizes total step points to question point', () => {
  // Test updateQuestion('point', total) when step points change
});
```

- [ ] **Step 2: Chạy test để xác nhận test thất bại**

Run: `npm --prefix frontend test -- QuestionEditorSection.test.tsx`
Expected: FAIL

- [ ] **Step 3: Cập nhật `QuestionEditorSection.tsx` và `QuestionSettingsSidebar.tsx`**

Trong `QuestionEditorSection.tsx`:
- Hiển thị toggle chuyển đổi: "Theo bước giải (có thang điểm)" vs "Văn bản tự do".
- Khi ở chế độ theo bước: Hiển thị `<StepByStepSolutionEditor />`, khi thay đổi điểm gọi `updateQuestion('point', totalPoint)`.
- Khi ở chế độ tự do: Hiển thị `<SharedEditorCard />` như cũ.

Trong `QuestionSettingsSidebar.tsx`:
- Dưới ô nhập điểm `Điểm`:
  Hiển thị gợi ý: `(Đồng bộ tự động từ {count} bước giải: {point} đ)` nếu câu hỏi có cấu trúc steps.

- [ ] **Step 4: Chạy lại test để xác nhận test pass**

Run: `npm --prefix frontend test -- QuestionEditorSection.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/questions/creator/QuestionEditorSection.tsx frontend/src/components/questions/creator/QuestionSettingsSidebar.tsx frontend/src/components/questions/creator/QuestionEditorSection.test.tsx
git commit -m "feat(question-creator): integrate step-by-step point scale editor and sync total points"
```

---

### Task 4: Cập nhật Backend AI Extractor Prompt & Hỗ trợ Phân bổ Thang điểm

**Files:**
- Modify: `backend/internal/services/question_extractor.go`
- Test: `backend/internal/services/question_extractor_test.go`

**Interfaces:**
- Consumes: Gemini Vision API JSON response
- Produces: `SolutionGuide` chứa `steps` với `point` được phân bổ hợp lý

- [ ] **Step 1: Viết test kiểm tra parse `steps` có trường `point` trong `question_extractor_test.go`**

```go
func TestParseAndProcessExtractedBlocks_StepPoints(t *testing.T) {
	rawJSON := `[
		{
			"shared_content": null,
			"type_question": "single",
			"questions": [
				{
					"content": "Tính diện tích hình tròn có bán kính $R = 5\\text{ cm}$.",
					"type": "Tự luận",
					"point": 2,
					"solution_guide": {
						"steps": [
							{ "step": 1, "title": "Công thức", "content": "Nêu công thức", "point": 0.5 },
							{ "step": 2, "title": "Thay số", "content": "Thay $R=5$", "point": 1.5 }
						],
						"conclusion": "Vậy $S = 25\\pi$"
					}
				}
			]
		}
	]`
	blocks, err := ParseAndProcessExtractedBlocks(rawJSON, nil, "./uploads/temp", 9)
	assert.NoError(t, err)
	assert.Len(t, blocks, 1)
	q := blocks[0].Questions[0]
	solMap, ok := q.SolutionGuide.(map[string]interface{})
	assert.True(t, ok)
	steps, ok := solMap["steps"].([]interface{})
	assert.True(t, ok)
	assert.Len(t, steps, 2)
	step1 := steps[0].(map[string]interface{})
	assert.Equal(t, 0.5, step1["point"])
}
```

- [ ] **Step 2: Chạy test để xác nhận test chạy**

Run: `go test -v -run TestParseAndProcessExtractedBlocks_StepPoints ./internal/services`
Expected: PASS hoặc fail nếu parse type mismatch

- [ ] **Step 3: Cập nhật prompt Gemini Vision trong `question_extractor.go`**

Bổ sung trường `"point"` cho từng phần tử của `"steps"` trong rule 14 và ví dụ mẫu JSON của prompt.

- [ ] **Step 4: Chạy toàn bộ test services để xác nhận**

Run: `go test ./internal/services/...`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/internal/services/question_extractor.go backend/internal/services/question_extractor_test.go
git commit -m "feat(backend): add step points distribution rule in Gemini question extraction"
```

---

### Task 5: Kiểm định Toàn diện (End-to-End Verification)

- [ ] **Step 1: Chạy test frontend**
Run: `npm --prefix frontend test`
Expected: All frontend tests PASS.

- [ ] **Step 2: Chạy type-check frontend**
Run: `npm --prefix frontend run build` hoặc `npm --prefix frontend exec tsc -- --noEmit`
Expected: No type errors.

- [ ] **Step 3: Chạy test backend**
Run: `go test ./internal/...`
Expected: All backend tests PASS.
