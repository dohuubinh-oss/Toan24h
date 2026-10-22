# Kế Hoạch Triển Khai: Chấm Điểm Câu Tự Luận Theo Thang Điểm Từng Bước (Rubric)

> **Dành cho kỹ sư thực thi:** KỸ NĂNG BẮT BUỘC: Sử dụng `superpowers:subagent-driven-development` (khuyến nghị) hoặc `superpowers:executing-plans` để thực thi kế hoạch này theo từng task. Các bước sử dụng cú pháp checkbox (`- [ ]`) để theo dõi tiến độ.

**Mục tiêu:** Nâng cấp hệ thống chấm thi tự luận toán học bằng Gemini từ chấm một điểm tổng sang chấm chi tiết theo từng bước giải (rubric), trả về điểm số từng bước (bội số 0.25), áp dụng quy tắc chấm dứt khoát (all-or-nothing), công nhận cách giải khác hợp lệ và hiển thị trực quan trên giao diện kết quả.

**Kiến trúc:** 
1. Mở rộng `models.QuestionAnswer` và `ai_grader.go` để lưu trữ và trao đổi mảng `step_results`.
2. Nâng cấp Prompt & Schema Gemini trong `GradeEssayBatchWithGemini` để phân tích bài làm học sinh theo từng bước hoặc lập bước tương đương nếu giải cách khác.
3. Cập nhật `exam_result_handler.go` để tích hợp `solution_guide` vào dữ liệu đầu vào AI và tổng hợp điểm số từ các bước.
4. Cập nhật giao diện `EssayQuestion.tsx` và trang kết quả bài thi để hiển thị bảng phân tích thẻ từng bước.

**Tech Stack:** Go (Fiber/Gin, GORM, PostgreSQL JSONB), Gemini 2.5/Flash API, Next.js 16, React 19, KaTeX, Tailwind CSS v4.

**Tài liệu thiết kế:** [docs/superpowers/specs/2026-10-22-step-by-step-essay-grading-design.md](file:///Users/modeptrai/Desktop/toan6789.vn/docs/superpowers/specs/2026-10-22-step-by-step-essay-grading-design.md)

---

## Ràng Buộc Toàn Cục (Global Constraints)

- Điểm thành phần của mỗi bước giải luôn là bội số của 0.25 (0.25, 0.5, 0.75, 1.0...) và tổng điểm các bước khớp đúng với `maxScore` của câu hỏi.
- Quy tắc chấm từng bước là nhị phân dứt khoát: Làm đúng trọn vẹn bước thì nhận đủ điểm bước đó; có lỗi sai (dù nhỏ) thì nhận 0 điểm của bước đó kèm trích dẫn lỗi sai (`error_location`) và lý do (`deduction_reason`).
- Tương thích ngược 100%: Các bài thi và câu hỏi cũ không có `step_results` vẫn hiển thị bình thường, không gây lỗi runtime.
- Tuyệt đối không thêm các nút bấm thừa thãi làm rác giao diện UI.

## Trọng Tâm Rà Soát (Review Focus)

1. Câu hỏi tự luận có `solution_guide` dạng chuỗi văn bản tự do (không có mảng JSON steps) -> Gemini tự động phân rã thành các bước logic và chia điểm hợp lý theo tổng điểm.
2. Học sinh giải theo phương pháp khác hoàn toàn nhưng đúng logic -> Gemini công nhận, bật cờ `isAlternativeMethod: true`, tự lập các bước tương đương và chấm điểm.
3. Học sinh bỏ trống bài làm tự luận -> Backend gán 0 điểm ngay lập tức, không gọi Gemini gây lãng phí quota API.
4. Tổng điểm của các bước trong `step_results` phải khớp chính xác với `ans.Score` của câu hỏi.
5. KaTeX rendering cho công thức toán trong tiêu đề bước và vị trí trích dẫn lỗi sai không bị vỡ định dạng.

---

### Task 1: Cấu Trúc Dữ Liệu `StepGradeResult` & Mở Rộng Schema Backend

**Files:**
- Modify: `backend/internal/models/submission.go:35-51`
- Modify: `backend/internal/services/question_extractor.go:40-70`
- Test: `backend/internal/models/submission_test.go`

**Interfaces:**
- Produces:
  ```go
  type StepGradeResult struct {
      Step            int     `json:"step"`
      Title           string  `json:"title"`
      Score           float64 `json:"score"`
      MaxScore        float64 `json:"max_score"`
      IsCorrect       bool    `json:"is_correct"`
      ErrorLocation   string  `json:"error_location,omitempty"`
      DeductionReason string  `json:"deduction_reason,omitempty"`
  }
  ```
  Trong `models.QuestionAnswer`:
  ```go
  StepResults         []StepGradeResult `json:"step_results,omitempty"`
  IsAlternativeMethod bool              `json:"is_alternative_method,omitempty"`
  ```
  Trong `services.SolutionGuideStep`:
  ```go
  Point float32 `json:"point,omitempty"`
  ```

- [ ] **Step 1: Viết test kiểm tra cấu trúc dữ liệu `StepGradeResult` và JSON serialization**

Tạo file `backend/internal/models/submission_test.go`:
```go
package models

import (
	"encoding/json"
	"testing"
	"github.com/stretchr/testify/assert"
)

func TestQuestionAnswer_StepResultsSerialization(t *testing.T) {
	qa := QuestionAnswer{
		Type:          "Tự luận",
		StudentAnswer: "x = 2",
		Score:         1.0,
		MaxScore:      1.0,
		IsCorrect:     true,
		IsAlternativeMethod: false,
		StepResults: []StepGradeResult{
			{
				Step:      1,
				Title:     "Điều kiện xác định",
				Score:     0.5,
				MaxScore:  0.5,
				IsCorrect: true,
			},
			{
				Step:      2,
				Title:     "Giải phương trình",
				Score:     0.5,
				MaxScore:  0.5,
				IsCorrect: true,
			},
		},
	}

	bytes, err := json.Marshal(qa)
	assert.NoError(t, err)

	var decoded QuestionAnswer
	err = json.Unmarshal(bytes, &decoded)
	assert.NoError(t, err)
	assert.Len(t, decoded.StepResults, 2)
	assert.Equal(t, 0.5, decoded.StepResults[0].Score)
	assert.False(t, decoded.IsAlternativeMethod)
}
```

- [ ] **Step 2: Chạy test để xác nhận test thất bại (compile error do chưa có struct)**

Run: `cd backend && go test -v ./internal/models/... -run TestQuestionAnswer_StepResultsSerialization`  
Expected: FAIL (undefined: StepGradeResult)

- [ ] **Step 3: Cập nhật `models/submission.go` và `services/question_extractor.go`**

1. Trong `backend/internal/models/submission.go`, định nghĩa `StepGradeResult` và thêm `StepResults`, `IsAlternativeMethod` vào `QuestionAnswer`.
2. Trong `backend/internal/services/question_extractor.go`, thêm trường `Point float32 json:"point,omitempty"` vào struct bước giải `SolutionGuideStep`.

- [ ] **Step 4: Chạy test để xác nhận test đã PASS**

Run: `cd backend && go test -v ./internal/models/... -run TestQuestionAnswer_StepResultsSerialization`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/internal/models/submission.go backend/internal/models/submission_test.go backend/internal/services/question_extractor.go
git commit -m "feat(models): add StepGradeResult and step_results to QuestionAnswer"
```

---

### Task 2: Nâng Cấp `GradeEssayBatchWithGemini` Chấm Điểm Từng Bước & Xử Lý Cách Giải Khác

**Files:**
- Modify: `backend/internal/services/ai_grader.go:17-51, 114-193`
- Test: `backend/internal/services/ai_grader_test.go`

**Interfaces:**
- Consumes: `models.StepGradeResult` từ Task 1.
- Produces:
  ```go
  type EssayBatchQuestionItem struct {
      QuestionID      string  `json:"questionId"`
      QuestionContent string  `json:"questionContent"`
      CorrectAnswer   string  `json:"correctAnswer"`
      SolutionGuide   string  `json:"solutionGuide,omitempty"`
      MaxScore        float64 `json:"maxScore"`
      StudentAnswer   string  `json:"studentAnswer"`
  }

  type EssayQuestionResult struct {
      QuestionID          string                   `json:"questionId"`
      Score               float64                  `json:"score"`
      MaxScore            float64                  `json:"maxScore"`
      IsCorrect           bool                     `json:"isCorrect"`
      IsAlternativeMethod bool                     `json:"isAlternativeMethod"`
      Explanation         string                   `json:"explanation"`
      ErrorLocation       string                   `json:"errorLocation"`
      DeductionReason     string                   `json:"deductionReason"`
      StepResults         []models.StepGradeResult `json:"stepResults"`
  }
  ```

- [ ] **Step 1: Viết failing test cho chấm điểm từng bước trong `ai_grader_test.go`**

Tạo/cập nhật `backend/internal/services/ai_grader_test.go`:
```go
package services

import (
	"encoding/json"
	"testing"
	"github.com/modeptrai/exam-model-backend/internal/models"
	"github.com/stretchr/testify/assert"
)

func TestEssayQuestionResult_StepResultsSchema(t *testing.T) {
	rawJSON := `{
		"questionId": "q1",
		"score": 0.5,
		"maxScore": 1.0,
		"isCorrect": false,
		"isAlternativeMethod": false,
		"explanation": "Học sinh làm đúng bước 1 nhưng sai bước 2.",
		"errorLocation": "x = 5",
		"deductionReason": "Tính toán nhầm phép cộng",
		"stepResults": [
			{
				"step": 1,
				"title": "Tìm ĐKXĐ",
				"score": 0.5,
				"max_score": 0.5,
				"is_correct": true
			},
			{
				"step": 2,
				"title": "Giải phương trình",
				"score": 0.0,
				"max_score": 0.5,
				"is_correct": false,
				"error_location": "x = 5",
				"deduction_reason": "Tính toán nhầm"
			}
		]
	}`

	var res EssayQuestionResult
	err := json.Unmarshal([]byte(rawJSON), &res)
	assert.NoError(t, err)
	assert.Len(t, res.StepResults, 2)
	assert.Equal(t, 0.5, res.StepResults[0].Score)
	assert.Equal(t, 0.0, res.StepResults[1].Score)
	assert.False(t, res.StepResults[1].IsCorrect)
}
```

- [ ] **Step 2: Chạy test để kiểm tra biên dịch/chạy**

Run: `cd backend && go test -v ./internal/services/... -run TestEssayQuestionResult_StepResultsSchema`  
Expected: FAIL nếu struct chưa có `StepResults` hoặc `IsAlternativeMethod`.

- [ ] **Step 3: Cập nhật Prompt và ResponseSchema trong `backend/internal/services/ai_grader.go`**

1. Cập nhật struct `EssayBatchQuestionItem` thêm `SolutionGuide string json:"solutionGuide,omitempty"`.
2. Cập nhật struct `EssayQuestionResult` thêm `StepResults []models.StepGradeResult json:"stepResults"` và `IsAlternativeMethod bool json:"isAlternativeMethod"`.
3. Trong hàm `gradeEssayChunk`:
   - Bổ sung quy tắc vào Prompt:
     + "3. ĐỐI CHIẾU THEO TỪNG BƯỚC: Nếu câu hỏi có solutionGuide dạng các bước, hãy đối chiếu từng bước. Nếu học sinh giải bằng CÁCH KHÁC hợp lệ, hãy công nhận, đặt 'isAlternativeMethod = true' và tự chia các bước tương đương."
     + "4. QUY TẮC NHỊ PHÂN MỖI BƯỚC: Bước đúng hoàn toàn => score = max_score, is_correct = true. Bước có lỗi sai (dù nhỏ) => score = 0, is_correct = false, trích dẫn lỗi tại error_location và nêu lý do tại deduction_reason."
     + "5. Điểm số mỗi bước là bội số của 0.25. Tổng điểm câu (score) = Tổng điểm các bước thành phần."
   - Cập nhật `responseSchema` của Gemini API để khai báo thuộc tính `stepResults` (array of objects với `step`, `title`, `score`, `max_score`, `is_correct`, `error_location`, `deduction_reason`) và `isAlternativeMethod` (boolean).

- [ ] **Step 4: Chạy test kiểm tra**

Run: `cd backend && go test -v ./internal/services/... -run TestEssayQuestionResult_StepResultsSchema`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/internal/services/ai_grader.go backend/internal/services/ai_grader_test.go
git commit -m "feat(ai_grader): support step-by-step grading with rubric and alternative methods"
```

---

### Task 3: Tích Hợp Chấm Tự Luận Từng Bước Vào `exam_result_handler.go`

**Files:**
- Modify: `backend/internal/handlers/exam_result_handler.go:210-285`
- Test: `backend/internal/handlers/exam_result_handler_test.go`

**Interfaces:**
- Consumes: `services.GradeEssayBatchWithGemini` trả về `StepResults`.
- Produces: `submission.AnswersMap[qID]` chứa `StepResults` và `IsAlternativeMethod`, `totalScore` tổng hợp chuẩn xác.

- [ ] **Step 1: Viết test kiểm tra lưu trữ `StepResults` khi nộp bài thi**

Trong `backend/internal/handlers/exam_result_handler_test.go`, bổ sung test case nộp bài tự luận và kiểm tra JSON kết quả chứa `step_results`:
```go
func TestSubmitExam_EssayStepResultsStored(t *testing.T) {
    // Kiểm tra câu tự luận sau khi chấm có step_results và tính đúng điểm
}
```

- [ ] **Step 2: Chạy test và xác nhận kết quả**

Run: `cd backend && go test -v ./internal/handlers/... -run TestSubmitExam_EssayStepResultsStored`  
Expected: PASS/FAIL tùy thuộc vào mock.

- [ ] **Step 3: Cập nhật `backend/internal/handlers/exam_result_handler.go`**

1. Tại vòng lặp gom câu tự luận (`question.Type == "Tự luận"`):
   - Truyền `SolutionGuide: question.SolutionGuide` vào `services.EssayBatchQuestionItem`.
2. Tại khối nhận phản hồi từ `services.GradeEssayBatchWithGemini`:
   - Gán `ans.StepResults = res.StepResults`
   - Gán `ans.IsAlternativeMethod = res.IsAlternativeMethod`
   - Đảm bảo nếu `len(res.StepResults) > 0`, điểm `ans.Score` tính từ tổng điểm các bước đạt được.

- [ ] **Step 4: Chạy toàn bộ test handlers**

Run: `cd backend && go test ./internal/handlers/...`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/internal/handlers/exam_result_handler.go backend/internal/handlers/exam_result_handler_test.go
git commit -m "feat(handler): store step_results and alternative method flag in submission answers"
```

---

### Task 4: Cập Nhật Component `EssayQuestion.tsx` Hiển Thị Thẻ Từng Bước

**Files:**
- Modify: `frontend/src/components/exam/taking/EssayQuestion.tsx:36-55, 350-410`
- Test: `frontend/src/components/exam/taking/EssayQuestion.test.tsx`

**Interfaces:**
- Consumes: `aiFeedback` chứa `stepResults?: StepGradeResult[]` và `isAlternativeMethod?: boolean`.
- Produces: UI Step Breakdown Cards với badge điểm (`+0.5 / 0.5đ` hoặc `0.0 / 0.25đ`), tiêu đề bước, icon check/x, vị trí sai và lý do trừ điểm.

- [ ] **Step 1: Viết unit test cho `EssayQuestion` kiểm tra hiển thị Step Breakdown**

Tạo/cập nhật `frontend/src/components/exam/taking/EssayQuestion.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import EssayQuestion from './EssayQuestion'

describe('EssayQuestion Step Breakdown', () => {
  it('renders step results with score badges and titles in readonly mode', () => {
    const aiFeedbacks = {
      1: {
        isCorrect: false,
        score: 0.5,
        maxScore: 1.0,
        aiExplanation: 'Giải thích chung',
        isAlternativeMethod: true,
        stepResults: [
          {
            step: 1,
            title: 'Tìm điều kiện xác định',
            score: 0.5,
            max_score: 0.5,
            is_correct: true,
          },
          {
            step: 2,
            title: 'Biến đổi phương trình',
            score: 0.0,
            max_score: 0.5,
            is_correct: false,
            error_location: '2x = 6',
            deduction_reason: 'Chuyển vế đổi dấu sai',
          },
        ],
      },
    }

    render(
      <EssayQuestion
        questionId={1}
        index={0}
        content="Giải phương trình"
        answers={{ 1: 'x = 3' }}
        isHintOpen={false}
        isFlagged={false}
        readonly={true}
        aiFeedbacks={aiFeedbacks as any}
      />
    )

    expect(screen.getByText(/Tìm điều kiện xác định/i)).toBeInTheDocument()
    expect(screen.getByText(/Chuyển vế đổi dấu sai/i)).toBeInTheDocument()
    expect(screen.getByText(/Cách giải khác hợp lệ/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Chạy vitest để xác nhận test thất bại**

Run: `cd frontend && npm test src/components/exam/taking/EssayQuestion.test.tsx`  
Expected: FAIL

- [ ] **Step 3: Cập nhật component `EssayQuestion.tsx`**

1. Khai báo interface `StepGradeResult`:
   ```typescript
   export interface StepGradeResult {
     step: number
     title: string
     score: number
     max_score: number
     is_correct: boolean
     error_location?: string
     deduction_reason?: string
   }
   ```
2. Mở rộng `aiFeedbacks` prop để bao gồm `stepResults?: StepGradeResult[]` và `isAlternativeMethod?: boolean`.
3. Khi ở chế độ `readonly` và câu hỏi có `aiFeedback.stepResults`:
   - Render khối "CHI TIẾT CHẤM ĐIỂM TỪNG BƯỚC (RUBRIC)":
     + Nếu `aiFeedback.isAlternativeMethod === true`: Hiển thị badge màu tím/indigo: "✨ Học sinh giải theo phương pháp tương đương hợp lệ".
     + Render danh sách các thẻ bước giải:
       - Header mỗi bước: Số thứ tự, Tên bước, Badge điểm (màu xanh nếu `is_correct`, màu đỏ nếu không).
       - Nếu bước bị 0 điểm: Hiển thị box cảnh báo màu đỏ/cam trích dẫn vị trí sai (`error_location`) và lý do trừ điểm (`deduction_reason`).
   - Nếu không có `stepResults` (bài thi cũ): Tự động hiển thị fallback về `aiExplanation` chung như hiện tại.

- [ ] **Step 4: Chạy vitest để kiểm tra**

Run: `cd frontend && npm test src/components/exam/taking/EssayQuestion.test.tsx`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/exam/taking/EssayQuestion.tsx frontend/src/components/exam/taking/EssayQuestion.test.tsx
git commit -m "feat(ui): render step-by-step rubric breakdown in EssayQuestion"
```

---

### Task 5: Đồng Bộ Trang Kết Quả Bài Thi & Kiểm Thử Toàn Diện (End-to-End)

**Files:**
- Modify: `frontend/src/app/(fullscreen)/exam/[id]/result/page.tsx:200-250`
- Test: Toàn bộ test suite Backend & Frontend

- [ ] **Step 1: Cập nhật mapping dữ liệu `mappedData.aiFeedbacks` trong `result/page.tsx`**

Đảm bảo khi load bài thi từ API `/api/v1/submissions/:id`, các trường `stepResults` (hoặc `step_results`) và `isAlternativeMethod` từ `answer` được truyền đầy đủ vào `aiFeedbacks[q.id]`.

- [ ] **Step 2: Chạy kiểm tra TypeScript type check**

Run: `cd frontend && npx tsc --noEmit`  
Expected: 0 errors

- [ ] **Step 3: Chạy toàn bộ test Frontend và Backend**

Run:
```bash
cd backend && go test ./...
cd frontend && npm run test -- --run
```
Expected: All tests PASS

- [ ] **Step 4: Commit**

```bash
git add frontend/src/app/\(fullscreen\)/exam/\[id\]/result/page.tsx
git commit -m "feat(result): map stepResults into exam result page and verify end-to-end"
```

---

## Bàn Giao Kế Hoạch (Execution Handoff)

Kế hoạch đã hoàn thành và được lưu tại [docs/superpowers/plans/2026-10-22-step-by-step-essay-grading.md](file:///Users/modeptrai/Desktop/toan6789.vn/docs/superpowers/plans/2026-10-22-step-by-step-essay-grading.md).
