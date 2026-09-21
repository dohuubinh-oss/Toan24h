# Design Specification: Exam Violation Handling & Speech Math-Text Segmentation

**Date:** 2026-09-21  
**Status:** Approved  
**Author:** Antigravity Team  

---

## 1. Overview & Goals

This specification addresses two key improvements:
1. **Exam/Practice Violation Policy**: When a student violates exam rules ($\ge 3$ times away or total away time $> 5$ minutes / 300,000 ms), the system automatically revokes the exam without grading or submitting it, clears local exam state, sends a cheat warning (Zalo notification to parents), displays an informative Toast/alert, and redirects back to safety.
2. **Speech-to-Editor Segmentation (Text vs Math)**: When speaking natural Vietnamese sentences containing math expressions (e.g. *"Giá trị của đa thức 3 x mũ 4"*), the system dynamically segments text phrases from mathematical expressions, inserting normal words as standard text and math formulas into inline KaTeX `<math>` nodes, preventing squashed/spaceless math text rendering.

---

## 2. Topic 1: Exam Violation Handling

### 2.1 Trigger Conditions (Level 3 Penalty)
- Number of tab switches / screen leaves $\ge 3$.
- OR Cumulative away time $> 300\,000\text{ ms}$ ($5\text{ minutes}$).

### 2.2 Execution Flow
1. **Clear Interval / Listeners**: Stop anti-cheat ticker and away timers.
2. **Trigger Warning API**: Call `sendCheatWarning(examId, 3)` (backend logs penalty and triggers Zalo parental alert).
3. **Suppress Submission**: Do NOT call `submitExam(...)` or queue AI grading jobs.
4. **State Cleanup**: Remove `sessionStorage.removeItem('exam_state_' + id)`.
5. **User Feedback**:
   - `toast.error("Bài làm đã bị thu hồi và HỦY KẾT QUẢ do vi phạm quy chế thi. (Đã gửi cảnh báo Zalo cho phụ huynh)", { duration: 6000 })`
6. **Navigation**: Redirect the student back to the previous screen or `/practice` / `/dashboard`.

---

## 3. Topic 2: Speech Math-Text Hybrid Segmenter

### 3.1 Problem Statement
When a user says: `"Tính giá trị của đa thức 3 x mũ 4 cộng 2 x trừ 1"`, KaTeX math mode strips word spaces if wrapped inside a single math node, producing `Tínhgiátrịcủađathức3x^4+2x-1`.

### 3.2 Segmentation Engine Architecture
Create/Update `frontend/src/lib/math-speech/segmentSpeechTextAndMath.ts`:
- **Input**: Raw speech transcript string (e.g., `"Tìm nghiệm của phương trình x bình phương trừ 4 bằng 0"`).
- **Segment Types**:
  ```ts
  export interface SpeechSegment {
    type: 'text' | 'math'
    content: string
  }
  ```
- **Math Detection Boundaries**:
  - Identify math trigger tokens and patterns:
    - Number + variable combinations: `3x`, `2y^2`, `x + 1`
    - Math keywords: `phân số`, `căn bậc`, `mũ`, `bình phương`, `bằng`, `cộng`, `trừ`, `nhân`, `chia`, `lớn hơn`, `nhỏ hơn`, `sin`, `cos`, `tan`, `vectơ`, `góc`, `vuông góc`, `song song`
    - Equations & comparisons: `=`, `>`, `<`, `\le`, `\ge`
  - Group pure Vietnamese conversational phrases (`"Tính giá trị của đa thức"`, `"Tìm nghiệm của phương trình"`, `"Cho tam giác ABC có"`, `"Rút gọn biểu thức"`, `"với x bằng 2"`) as `type: 'text'`.
  - Pass the mathematical components through `vietnameseMathToLatex` to obtain cleanly formatted LaTeX strings as `type: 'math'`.

### 3.3 Editor Integration (`BaseEditor.tsx`)
When receiving final speech recognition results:
```ts
const segments = segmentSpeechTextAndMath(rawSentence)
for (const seg of segments) {
  if (seg.type === 'math' && seg.content) {
    editor.chain().focus().insertContent({
      type: 'math',
      attrs: { latex: seg.content }
    }).insertContent(' ').run()
  } else if (seg.type === 'text' && seg.content) {
    editor.chain().focus().insertContent(seg.content + ' ').run()
  }
}
```

---

## 4. Testing & Verification

1. **Unit Tests (Vitest)**:
   - `segmentSpeechTextAndMath.test.ts`: Test pure math, pure text, and mixed sentences (e.g. `"Tính giá trị của đa thức 3 x mũ 4"` -> `[text: "Tính giá trị của đa thức", math: "3x^4"]`).
   - `vietnameseMathToLatex.test.ts`: Ensure all math formulas continue to pass.
2. **Frontend Violation Flow Test**:
   - Verify `exam/[id]/take/page.tsx` triggers `sendCheatWarning` with level 3 when threshold reached ($> 5$ min or $\ge 3$ leaves) and does NOT call `submitExam`.
3. **Type & Build Validation**:
   - Run `npm run build` / `npx tsc --noEmit` to verify type safety.
