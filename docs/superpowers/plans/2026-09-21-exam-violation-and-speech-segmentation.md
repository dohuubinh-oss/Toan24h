# Exam Violation Handling & Speech Math-Text Segmentation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement anti-cheat exam cancellation (no grading on violation $\ge 3$ leaves or $> 5$ mins) and hybrid speech segmentation separating conversational Vietnamese text from LaTeX math nodes in the editor.

**Architecture:** 
1. `take/page.tsx` is updated to invoke `sendCheatWarning(id, 3)`, cancel submissions, clean session storage, display a toast, and redirect.
2. A new modular tokenizer `segmentSpeechTextAndMath.ts` splits spoken transcripts into discrete text and math segments, which are inserted sequentially as text and KaTeX nodes in `BaseEditor.tsx`.

**Tech Stack:** Next.js, React, TypeScript, Vitest, Tiptap ProseMirror, Web Speech API.

## Global Constraints
- Threshold for cheat level 3: `cheatCount >= 3 || totalAwayTime > 300000` (5 minutes).
- Disqualified exams MUST NOT invoke `submitExam` or AI grading pipeline.
- Vietnamese words must retain proper spacing and never be enclosed in KaTeX math nodes unless converted to LaTeX expressions.

---

### Task 1: Update Exam Anti-Cheat Violation Logic in Exam Take Page

**Files:**
- Modify: `frontend/src/app/(fullscreen)/exam/[id]/take/page.tsx:70-84,159-175`

**Interfaces:**
- Consumes: `sendCheatWarning(id: string, level: number)` from `@/lib/api`
- Produces: Disqualification flow without submitting or grading the exam.

- [ ] **Step 1: Update violation restore check on page load**
Update lines 70-84 in `frontend/src/app/(fullscreen)/exam/[id]/take/page.tsx`:
```tsx
    // Check penalty ngay khi quay lại nếu đã vi phạm từ trang bài giảng hoặc trước đó
    if (restoredCheatCount >= 3 || restoredTotalTime > 300000) {
        import('@/lib/api').then(mod => mod.sendCheatWarning(id, 3));
        toast.error("Bài làm đã bị thu hồi và HỦY KẾT QUẢ do vi phạm quy chế thi. (Đã gửi cảnh báo Zalo cho phụ huynh)", { duration: 6000 });
        sessionStorage.removeItem(`exam_state_${id}`);
        router.back();
    } else if (restoredCheatCount > 0) {
        setShowCheatModal(true)
    }
```

- [ ] **Step 2: Update real-time violation handler**
Update lines 159-175 in `frontend/src/app/(fullscreen)/exam/[id]/take/page.tsx`:
```tsx
    const enforceCheatPenalty = (count: number, totalTime: number) => {
      // Mức 3: Lần 3 hoặc tổng thời gian > 5 phút (300s = 300000ms)
      if (count >= 3 || totalTime > 300000) {
        if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
        import('@/lib/api').then(mod => mod.sendCheatWarning(id, 3));
        toast.error("Bài làm đã bị thu hồi và HỦY KẾT QUẢ do vi phạm quy chế thi. (Đã gửi cảnh báo Zalo cho phụ huynh)", { duration: 6000 });
        
        sessionStorage.removeItem(`exam_state_${id}`);
        router.back();
        return true; // was handled
      }
```

- [ ] **Step 3: Verify TypeScript compilation**
Run: `cd frontend && npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 4: Commit changes**
```bash
git add frontend/src/app/\(fullscreen\)/exam/\[id\]/take/page.tsx
git commit -m "feat: cancel exam submission and grading on anti-cheat violation"
```

---

### Task 2: Implement and Test `segmentSpeechTextAndMath` (TDD)

**Files:**
- Create: `frontend/src/lib/math-speech/segmentSpeechTextAndMath.test.ts`
- Create: `frontend/src/lib/math-speech/segmentSpeechTextAndMath.ts`

**Interfaces:**
- Consumes: `vietnameseMathToLatex(input: string)` from `./vietnameseMathToLatex`
- Produces: `segmentSpeechTextAndMath(input: string): SpeechSegment[]` where `SpeechSegment = { type: 'text' | 'math'; content: string }`

- [ ] **Step 1: Write failing unit test**
Create `frontend/src/lib/math-speech/segmentSpeechTextAndMath.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { segmentSpeechTextAndMath } from './segmentSpeechTextAndMath'

describe('segmentSpeechTextAndMath', () => {
  it('handles empty input', () => {
    expect(segmentSpeechTextAndMath('')).toEqual([])
  })

  it('handles pure text without math', () => {
    const res = segmentSpeechTextAndMath('Tìm nghiệm của phương trình sau')
    expect(res).toEqual([
      { type: 'text', content: 'Tìm nghiệm của phương trình sau' }
    ])
  })

  it('handles pure math expression', () => {
    const res = segmentSpeechTextAndMath('ba x mũ bốn cộng hai x trừ một')
    expect(res).toEqual([
      { type: 'math', content: '3x^4+2x-1' }
    ])
  })

  it('handles mixed text and math in a single sentence', () => {
    const res = segmentSpeechTextAndMath('Giá trị của đa thức 3 x mũ 4')
    expect(res).toEqual([
      { type: 'text', content: 'Giá trị của đa thức' },
      { type: 'math', content: '3x^4' }
    ])
  })

  it('handles sentence with fraction math', () => {
    const res = segmentSpeechTextAndMath('Rút gọn phân số một phần hai')
    expect(res).toEqual([
      { type: 'text', content: 'Rút gọn' },
      { type: 'math', content: '\\frac{1}{2}' }
    ])
  })
})
```

- [ ] **Step 2: Run test to verify failure**
Run: `cd frontend && npx vitest run src/lib/math-speech/segmentSpeechTextAndMath.test.ts`
Expected: FAIL (Cannot find module)

- [ ] **Step 3: Implement `segmentSpeechTextAndMath.ts`**
Create `frontend/src/lib/math-speech/segmentSpeechTextAndMath.ts`:
```ts
import { vietnameseMathToLatex } from './vietnameseMathToLatex'

export interface SpeechSegment {
  type: 'text' | 'math'
  content: string
}

// Patterns that mark pure conversational/descriptive Vietnamese text before or after math
const MATH_TRIGGER_KEYWORDS = [
  'phân số',
  'căn bậc',
  'căn',
  'mũ',
  'bình phương',
  'lập phương',
  'bằng',
  'cộng',
  'trừ',
  'nhân',
  'chia',
  'lớn hơn',
  'nhỏ hơn',
  'bé hơn',
  'sin',
  'cos',
  'tan',
  'cot',
  'vectơ',
  'vecto',
  'góc',
  'vuông góc',
  'song song',
  'tương đương',
  'suy ra'
]

export function segmentSpeechTextAndMath(rawInput: string): SpeechSegment[] {
  if (!rawInput || !rawInput.trim()) return []
  const input = rawInput.trim()

  // First, check if entire input is converted to a clean math formula
  const directConversion = vietnameseMathToLatex(input)
  if (directConversion.isMath && !/[a-zA-Zàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ\s]{6,}/i.test(directConversion.latex)) {
    // If the whole string converted to pure math with no lingering long words, return pure math
    return [{ type: 'math', content: directConversion.latex }]
  }

  // Look for boundary where math starts
  // Regex to find math trigger phrases or algebraic variable patterns like "3 x", "x bình phương", "phân số"
  const mathTriggerRegex = new RegExp(
    `(\\b(?:${MATH_TRIGGER_KEYWORDS.join('|')})\\b|\\b\\d+\\s+[a-zA-Z]\\b|\\b[a-zA-Z]\\s+(?:mũ|bình|cộng|trừ|nhân|chia|bằng)\\b)`,
    'i'
  )

  const match = input.match(mathTriggerRegex)
  if (!match || match.index === undefined) {
    // No math triggers found: treat as text
    return [{ type: 'text', content: input }]
  }

  const splitIdx = match.index
  const textPart = input.slice(0, splitIdx).trim()
  const mathPart = input.slice(splitIdx).trim()

  const segments: SpeechSegment[] = []
  if (textPart) {
    segments.push({ type: 'text', content: textPart })
  }

  if (mathPart) {
    const mathConversion = vietnameseMathToLatex(mathPart)
    if (mathConversion.isMath && mathConversion.latex) {
      segments.push({ type: 'math', content: mathConversion.latex })
    } else {
      segments.push({ type: 'text', content: mathPart })
    }
  }

  return segments
}
```

- [ ] **Step 4: Run unit tests to verify success**
Run: `cd frontend && npx vitest run src/lib/math-speech/segmentSpeechTextAndMath.test.ts`
Expected: PASS (5/5 tests passed)

- [ ] **Step 5: Commit changes**
```bash
git add frontend/src/lib/math-speech/segmentSpeechTextAndMath*
git commit -m "feat: add segmentSpeechTextAndMath hybrid speech parser"
```

---

### Task 3: Integrate Speech Segmenter into `BaseEditor.tsx`

**Files:**
- Modify: `frontend/src/components/ui/editor/BaseEditor.tsx:124-142`

**Interfaces:**
- Consumes: `segmentSpeechTextAndMath` from `@/lib/math-speech/segmentSpeechTextAndMath`
- Produces: Sequence of text and `<math>` nodes in Tiptap.

- [ ] **Step 1: Import and apply segmenter in `BaseEditor.tsx`**
Update `BaseEditor.tsx` recognition `onresult`:
```tsx
import { segmentSpeechTextAndMath } from '@/lib/math-speech/segmentSpeechTextAndMath'

// In recognition.onresult:
recognition.onresult = (event: any) => {
  for (let i = event.resultIndex; i < event.results.length; ++i) {
    if (event.results[i].isFinal) {
      const rawSentence = event.results[i][0].transcript.trim()
      if (rawSentence && editor) {
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
      }
    }
  }
}
```

- [ ] **Step 2: Run all tests & type check**
Run: `cd frontend && npx vitest run && npx tsc --noEmit`
Expected: All tests pass, 0 type errors.

- [ ] **Step 3: Commit changes**
```bash
git add frontend/src/components/ui/editor/BaseEditor.tsx
git commit -m "feat: integrate speech math-text segmenter into BaseEditor"
```
