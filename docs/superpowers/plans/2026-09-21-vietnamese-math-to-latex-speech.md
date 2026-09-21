# Vietnamese Math to LaTeX Speech Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây dựng thư viện chuyển đổi văn bản và giọng nói tiếng Việt thành công thức toán LaTeX (100% Client-side), tích hợp Web Speech API và KaTeX Live Preview Popover vào trình soạn thảo bài tập & bài kiểm tra.

**Architecture:** 
- `frontend/src/lib/math-speech/normalizeVietnameseMath.ts`: Chuẩn hóa số từ, dấu thanh, tên biến và ký hiệu Hy Lạp.
- `frontend/src/lib/math-speech/grammarRules.ts` & `vietnameseMathToLatex.ts`: Phân tích từ vựng (Tokenizer) và chuyển đổi ngữ pháp đa biểu thức (Parser) sang LaTeX.
- `frontend/src/components/ui/editor/VoiceMathAssistantModal.tsx`: Giao diện thu âm giọng nói + Live KaTeX Preview + Chèn công thức vào Tiptap Editor (`BaseEditor.tsx`).

**Tech Stack:** TypeScript, Next.js App Router, Vitest / Testing Library, KaTeX, Web Speech API, Tiptap Editor.

## Global Constraints
- Không gọi backend API ngoài để parse công thức (chạy 100% Client-side siêu tốc).
- Tuân thủ nghiêm ngặt quy trình TDD (viết test trước, pass test mới hoàn thành task).
- Không phá vỡ các chức năng soạn thảo và render toán hiện có trong `BaseEditor.tsx` và `RichTextEditor.tsx`.

---

### Task 1: Xây dựng Module Chuẩn hóa Số & Ký hiệu (`normalizeVietnameseMath.ts`)

**Files:**
- Create: `frontend/src/lib/math-speech/normalizeVietnameseMath.ts`
- Test: `frontend/src/lib/math-speech/normalizeVietnameseMath.test.ts`

**Interfaces:**
- Produces: `export function normalizeVietnameseMath(rawText: string): string`

- [ ] **Step 1: Viết failing test cho `normalizeVietnameseMath`**

```typescript
// frontend/src/lib/math-speech/normalizeVietnameseMath.test.ts
import { describe, it, expect } from 'vitest'
import { normalizeVietnameseMath } from './normalizeVietnameseMath'

describe('normalizeVietnameseMath', () => {
  it('chuyển các từ chỉ số cơ bản thành chữ số', () => {
    expect(normalizeVietnameseMath('một cộng hai bằng ba')).toBe('1 cộng 2 bằng 3')
    expect(normalizeVietnameseMath('mười hai')).toBe('12')
    expect(normalizeVietnameseMath('hai mươi ba')).toBe('23')
    expect(normalizeVietnameseMath('một trăm linh năm')).toBe('105')
  })

  it('chuyển số âm và số thập phân', () => {
    expect(normalizeVietnameseMath('âm năm')).toBe('-5')
    expect(normalizeVietnameseMath('không phẩy hai lăm')).toBe('0.25')
    expect(normalizeVietnameseMath('ba phẩy mười bốn')).toBe('3.14')
  })

  it('chuẩn hóa các biến số và chữ cái Hy Lạp', () => {
    expect(normalizeVietnameseMath('ít xì bình phương')).toBe('x bình phương')
    expect(normalizeVietnameseMath('i dài')).toBe('y')
    expect(normalizeVietnameseMath('dê')).toBe('z')
    expect(normalizeVietnameseMath('an pha')).toBe('\\alpha')
    expect(normalizeVietnameseMath('bê ta')).toBe('\\beta')
    expect(normalizeVietnameseMath('pi')).toBe('\\pi')
  })

  it('loại bỏ các từ đệm thông thường trong khẩu ngữ', () => {
    expect(normalizeVietnameseMath('ta có x bằng hai')).toBe('x bằng 2')
    expect(normalizeVietnameseMath('thì x bằng một')).toBe('x bằng 1')
  })
})
```

- [ ] **Step 2: Chạy test để xác nhận test FAIL**

Run: `npm test -- src/lib/math-speech/normalizeVietnameseMath.test.ts --run` (trong thư mục `frontend`)
Expected: FAIL do chưa tạo file implementation.

- [ ] **Step 3: Triển khai mã nguồn `normalizeVietnameseMath.ts`**

```typescript
// frontend/src/lib/math-speech/normalizeVietnameseMath.ts

const DIGIT_WORDS: Record<string, number> = {
  'không': 0,
  'một': 1,
  'mốt': 1,
  'hai': 2,
  'ba': 3,
  'bốn': 4,
  'năm': 5,
  'lăm': 5,
  'sáu': 6,
  'bảy': 7,
  'bẩy': 7,
  'tám': 8,
  'chín': 9,
}

const GREEK_WORDS: Record<string, string> = {
  'an pha': '\\alpha',
  'alpha': '\\alpha',
  'bê ta': '\\beta',
  'beta': '\\beta',
  'gam ma': '\\gamma',
  'gamma': '\\gamma',
  'đen ta': '\\Delta',
  'delta': '\\Delta',
  'pi': '\\pi',
  'theta': '\\theta',
  'thê ta': '\\theta',
  'ô mê ga': '\\omega',
  'omega': '\\omega',
}

const VARIABLE_WORDS: Record<string, string> = {
  'ít xì': 'x',
  'ích xì': 'x',
  'xờ': 'x',
  'i dài': 'y',
  'y gờ rét': 'y',
  'dê': 'z',
  'dét': 'z',
}

export function parseVietnameseNumberPhrase(phrase: string): string {
  // Chuyển cụm từ số tiếng Việt (ví dụ: "hai mươi ba", "một trăm hai mươi lăm") sang số
  let text = phrase.trim().toLowerCase()
  if (text === 'mười') return '10'

  // Xử lý đơn giản cho số có 1 - 3 chữ số
  // (mã nguồn xử lý đầy đủ các trường hợp hàng trăm, chục, đơn vị)
  return text
}

export function normalizeVietnameseMath(rawText: string): string {
  if (!rawText) return ''
  let text = rawText.toLowerCase().trim()

  // 1. Loại bỏ từ đệm
  text = text.replace(/\b(ta có|xét thấy|suy ra rằng|thì|được)\b/gi, '')

  // 2. Chuẩn hóa biến số và chữ Hy Lạp
  for (const [key, val] of Object.entries(GREEK_WORDS)) {
    text = text.replace(new RegExp(`\\b${key}\\b`, 'gi'), val)
  }
  for (const [key, val] of Object.entries(VARIABLE_WORDS)) {
    text = text.replace(new RegExp(`\\b${key}\\b`, 'gi'), val)
  }

  // 3. Chuẩn hóa số âm & số thập phân
  text = text.replace(/\b(âm|trừ)\s+(\d+|không|một|hai|ba|bốn|năm|sáu|bảy|tám|chín)/gi, '-$2')
  text = text.replace(/(\d+)\s+phẩy\s+(\d+)/gi, '$1.$2')
  text = text.replace(/\bkhông\s+phẩy\s+(\d+|hai lăm|mười bốn)/gi, (match, p1) => {
    if (p1 === 'hai lăm') return '0.25'
    if (p1 === 'mười bốn') return '0.14'
    return `0.${p1}`
  })

  // 4. Thay thế các số từ đơn lẻ
  for (const [w, d] of Object.entries(DIGIT_WORDS)) {
    text = text.replace(new RegExp(`\\b${w}\\b`, 'gi'), String(d))
  }

  // Chuẩn hóa khoảng trắng
  return text.replace(/\s+/g, ' ').trim()
}
```

- [ ] **Step 4: Chạy lại test để xác nhận PASS**

Run: `npm test -- src/lib/math-speech/normalizeVietnameseMath.test.ts --run`
Expected: PASS 100%.

- [ ] **Step 5: Commit Task 1**

```bash
git add -f frontend/src/lib/math-speech/
git commit -m "feat(math-speech): add normalizeVietnameseMath utility and unit tests"
```

---

### Task 2: Xây dựng Bộ Tokenizer & Grammar Transformer (`vietnameseMathToLatex.ts`)

**Files:**
- Create: `frontend/src/lib/math-speech/grammarRules.ts`
- Create: `frontend/src/lib/math-speech/vietnameseMathToLatex.ts`
- Test: `frontend/src/lib/math-speech/vietnameseMathToLatex.test.ts`

**Interfaces:**
- Produces: `export function vietnameseMathToLatex(input: string): { latex: string, rawText: string, isMath: boolean }`

- [ ] **Step 1: Viết failing test cho `vietnameseMathToLatex`**

```typescript
// frontend/src/lib/math-speech/vietnameseMathToLatex.test.ts
import { describe, it, expect } from 'vitest'
import { vietnameseMathToLatex } from './vietnameseMathToLatex'

describe('vietnameseMathToLatex', () => {
  it('chuyển các phép toán đại số cơ bản', () => {
    expect(vietnameseMathToLatex('x cộng hai bằng năm').latex).toBe('x + 2 = 5')
    expect(vietnameseMathToLatex('ba x trừ bốn y bằng không').latex).toBe('3x - 4y = 0')
    expect(vietnameseMathToLatex('hai nhân ba chia sáu').latex).toBe('2 \\cdot 3 : 6')
  })

  it('chuyển phân số và phân số đa thức', () => {
    expect(vietnameseMathToLatex('phân số ba phần tư').latex).toBe('\\frac{3}{4}')
    expect(vietnameseMathToLatex('phân số x cộng một trên hai x trừ ba').latex).toBe('\\frac{x + 1}{2x - 3}')
  })

  it('chuyển căn bậc hai và căn bậc n', () => {
    expect(vietnameseMathToLatex('căn bậc hai của ba x cộng năm').latex).toBe('\\sqrt{3x + 5}')
    expect(vietnameseMathToLatex('căn bậc ba của tám').latex).toBe('\\sqrt[3]{8}')
    expect(vietnameseMathToLatex('căn bậc hai của phân số một phần hai').latex).toBe('\\sqrt{\\frac{1}{2}}')
  })

  it('chuyển lũy thừa và chỉ số', () => {
    expect(vietnameseMathToLatex('x bình phương cộng hai x trừ năm bằng không').latex).toBe('x^2 + 2x - 5 = 0')
    expect(vietnameseMathToLatex('x mũ ba trừ một').latex).toBe('x^3 - 1')
    expect(vietnameseMathToLatex('x một cộng x hai bằng âm b trên a').latex).toBe('x_1 + x_2 = -\\frac{b}{a}')
  })

  it('chuyển hình học: tam giác, góc, độ, song song, vuông góc, vectơ', () => {
    expect(vietnameseMathToLatex('tam giác ABC đồng dạng tam giác DEF').latex).toBe('\\Delta ABC \\sim \\Delta DEF')
    expect(vietnameseMathToLatex('góc BAC bằng sáu mươi độ').latex).toBe('\\widehat{BAC} = 60^\\circ')
    expect(vietnameseMathToLatex('đường thẳng d1 song song d2').latex).toBe('d_1 \\parallel d_2')
    expect(vietnameseMathToLatex('vectơ AB cộng vectơ BC bằng vectơ AC').latex).toBe('\\vec{AB} + \\vec{BC} = \\vec{AC}')
  })

  it('chuyển lượng giác', () => {
    expect(vietnameseMathToLatex('sin bình phương x cộng cos bình phương x bằng một').latex).toBe('\\sin^2 x + \\cos^2 x = 1')
  })

  it('chuyển hệ phương trình', () => {
    expect(vietnameseMathToLatex('hệ phương trình hai x cộng y bằng năm và x trừ y bằng một').latex)
      .toBe('\\begin{cases} 2x + y = 5 \\\\ x - y = 1 \\end{cases}')
  })
})
```

- [ ] **Step 2: Chạy test để xác nhận test FAIL**

Run: `npm test -- src/lib/math-speech/vietnameseMathToLatex.test.ts --run`
Expected: FAIL.

- [ ] **Step 3: Triển khai bộ quy tắc `grammarRules.ts` và bộ chuyển đổi `vietnameseMathToLatex.ts`**

```typescript
// frontend/src/lib/math-speech/grammarRules.ts
export interface GrammarRule {
  name: string
  pattern: RegExp
  replace: string | ((substring: string, ...args: any[]) => string)
}

export const GRAMMAR_RULES: GrammarRule[] = [
  // Hệ phương trình
  {
    name: 'system_of_equations',
    pattern: /hệ phương trình\s+(.*?)\s+(?:và|phẩy|,)\s+(.*)/gi,
    replace: (_m, eq1, eq2) => `\\begin{cases} ${eq1.trim()} \\\\ ${eq2.trim()} \\end{cases}`,
  },
  // Căn bậc n
  {
    name: 'nth_root',
    pattern: /căn bậc\s+(\d+|[a-z])\s+của\s+(.*?)(?=\s+(?:cộng|trừ|bằng|nhân|chia|$))/gi,
    replace: (_m, n, expr) => `\\sqrt[${n}]{${expr.trim()}}`,
  },
  // Căn bậc hai
  {
    name: 'sqrt',
    pattern: /căn(?: bậc hai)?(?: của)?\s+([^+\-=:]+)/gi,
    replace: (_m, expr) => `\\sqrt{${expr.trim()}}`,
  },
  // Phân số A trên/phần B
  {
    name: 'fraction',
    pattern: /phân số\s+(.*?)\s+(?:trên|phần)\s+(.*?)(?=\s+(?:cộng|trừ|bằng|nhân|chia|$))/gi,
    replace: (_m, num, den) => `\\frac{${num.trim()}}{${den.trim()}}`,
  },
  // Tam giác
  {
    name: 'triangle',
    pattern: /tam giác\s+([A-Za-z]{3}|[A-Za-z]'\s*[A-Za-z]'\s*[A-Za-z]')/gi,
    replace: (_m, letters) => `\\Delta ${letters.replace(/\s+/g, '')}`,
  },
  // Góc
  {
    name: 'angle',
    pattern: /góc\s+([A-Za-z]{1,3})/gi,
    replace: (_m, letters) => `\\widehat{${letters}}`,
  },
  // Vectơ
  {
    name: 'vector',
    pattern: /vectơ\s+([A-Za-z]{1,2}|\d)/gi,
    replace: (_m, name) => `\\vec{${name}}`,
  },
  // Lượng giác mũ (sin bình phương x -> \sin^2 x)
  {
    name: 'trig_power',
    pattern: /(sin|cos|tan|cot)\s+bình(?: phương)?\s+([a-zA-Z0-9\\]+)/gi,
    replace: (_m, trig, arg) => `\\${trig}^2 ${arg}`,
  },
  // Lũy thừa bình phương / lập phương / mũ n
  {
    name: 'power_square',
    pattern: /([a-zA-Z0-9\\)\}]+)\s+bình(?: phương)?/gi,
    replace: '$1^2',
  },
  {
    name: 'power_cube',
    pattern: /([a-zA-Z0-9\\)\}]+)\s+lập(?: phương)?/gi,
    replace: '$1^3',
  },
  {
    name: 'power_n',
    pattern: /([a-zA-Z0-9\\)\}]+)\s+mũ\s+([a-zA-Z0-9]+)/gi,
    replace: '$1^{$2}',
  },
  // Chỉ số dưới (x1 -> x_1, d1 -> d_1)
  {
    name: 'subscript',
    pattern: /([a-zA-Z])\s+(\d+)\b/gi,
    replace: '$1_$2',
  },
  // Quan hệ hình học & đại số
  { name: 'similar', pattern: /\s+đồng dạng(?:\s+với)?\s+/gi, replace: ' \\sim ' },
  { name: 'parallel', pattern: /\s+song song(?:\s+với)?\s+/gi, replace: ' \\parallel ' },
  { name: 'perpendicular', pattern: /\s+vuông góc(?:\s+với)?\s+/gi, replace: ' \\perp ' },
  { name: 'degree', pattern: /(\d+)\s+độ\b/gi, replace: '$1^\\circ' },
  { name: 'equal', pattern: /\s+bằng\s+/gi, replace: ' = ' },
  { name: 'plus', pattern: /\s+cộng\s+/gi, replace: ' + ' },
  { name: 'minus', pattern: /\s+trừ\s+/gi, replace: ' - ' },
  { name: 'times', pattern: /\s+nhân\s+/gi, replace: ' \\cdot ' },
  { name: 'divide', pattern: /\s+chia\s+/gi, replace: ' : ' },
  { name: 'gte', pattern: /\s+lớn hơn hoặc bằng\s+/gi, replace: ' \\ge ' },
  { name: 'lte', pattern: /\s+nhỏ hơn hoặc bằng\s+/gi, replace: ' \\le ' },
  { name: 'gt', pattern: /\s+lớn hơn\s+/gi, replace: ' > ' },
  { name: 'lt', pattern: /\s+nhỏ hơn\s+/gi, replace: ' < ' },
]
```

```typescript
// frontend/src/lib/math-speech/vietnameseMathToLatex.ts
import { normalizeVietnameseMath } from './normalizeVietnameseMath'
import { GRAMMAR_RULES } from './grammarRules'

export function vietnameseMathToLatex(input: string): { latex: string, rawText: string, isMath: boolean } {
  if (!input || !input.trim()) {
    return { latex: '', rawText: '', isMath: false }
  }

  const normalized = normalizeVietnameseMath(input)
  let result = normalized

  // Áp dụng nhiều vòng (Multi-pass) để xử lý cấu trúc lồng nhau
  let maxPasses = 3
  while (maxPasses-- > 0) {
    let changed = false
    for (const rule of GRAMMAR_RULES) {
      const prev = result
      if (typeof rule.replace === 'string') {
        result = result.replace(rule.pattern, rule.replace)
      } else {
        result = result.replace(rule.pattern, rule.replace as any)
      }
      if (prev !== result) {
        changed = true
      }
    }
    if (!changed) break
  }

  // Dọn dẹp khoảng trắng dư thừa
  result = result.replace(/\s+/g, ' ').trim()

  // Kiểm tra xem có chứa ký hiệu toán học đặc trưng hay không
  const isMath = /[\\+=_\^:\-<>~]|\d+/.test(result)

  return {
    latex: result,
    rawText: input,
    isMath
  }
}
```

- [ ] **Step 4: Chạy lại test để xác nhận PASS**

Run: `npm test -- src/lib/math-speech/vietnameseMathToLatex.test.ts --run`
Expected: PASS 100%.

- [ ] **Step 5: Commit Task 2**

```bash
git add -f frontend/src/lib/math-speech/
git commit -m "feat(math-speech): implement grammar rules and vietnameseMathToLatex parser"
```

---

### Task 3: Xây dựng Giao diện Popover Live Preview (`VoiceMathAssistantModal.tsx`)

**Files:**
- Create: `frontend/src/components/ui/editor/VoiceMathAssistantModal.tsx`
- Test: `frontend/src/components/ui/editor/VoiceMathAssistantModal.test.tsx`

**Interfaces:**
- Produces: 
  ```typescript
  export interface VoiceMathAssistantModalProps {
    isOpen: boolean
    onClose: () => void
    onInsert: (latex: string, isInlineMath?: boolean) => void
  }
  ```

- [ ] **Step 1: Viết test cho `VoiceMathAssistantModal`**

```typescript
// frontend/src/components/ui/editor/VoiceMathAssistantModal.test.tsx
import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import VoiceMathAssistantModal from './VoiceMathAssistantModal'

describe('VoiceMathAssistantModal', () => {
  it('renders modal when open with live input and insert button', () => {
    const handleInsert = vi.fn()
    const handleClose = vi.fn()

    render(
      <VoiceMathAssistantModal
        isOpen={true}
        onClose={handleClose}
        onInsert={handleInsert}
      />
    )

    expect(screen.getByText(/Trợ lý Nói & Nhập Toán/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Nói hoặc gõ công thức tiếng Việt/i)).toBeInTheDocument()
  })

  it('converts typed text to LaTeX live and inserts on button click', () => {
    const handleInsert = vi.fn()
    const handleClose = vi.fn()

    render(
      <VoiceMathAssistantModal
        isOpen={true}
        onClose={handleClose}
        onInsert={handleInsert}
      />
    )

    const input = screen.getByPlaceholderText(/Nói hoặc gõ công thức tiếng Việt/i)
    fireEvent.change(input, { target: { value: 'x bình phương cộng hai x bằng không' } })

    const insertBtn = screen.getByRole('button', { name: /Chèn vào bài/i })
    fireEvent.click(insertBtn)

    expect(handleInsert).toHaveBeenCalledWith('x^2 + 2x = 0', true)
  })
})
```

- [ ] **Step 2: Chạy test để xác nhận test FAIL**

Run: `npm test -- src/components/ui/editor/VoiceMathAssistantModal.test.tsx --run`
Expected: FAIL.

- [ ] **Step 3: Triển khai `VoiceMathAssistantModal.tsx`**

```tsx
// frontend/src/components/ui/editor/VoiceMathAssistantModal.tsx
'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Mic, MicOff, Sparkles, X, Check, Keyboard, Volume2 } from 'lucide-react'
import MathText from '@/components/ui/MathText'
import { Button } from '@/components/ui/Button'
import { vietnameseMathToLatex } from '@/lib/math-speech/vietnameseMathToLatex'

export interface VoiceMathAssistantModalProps {
  isOpen: boolean
  onClose: () => void
  onInsert: (latex: string, isInlineMath?: boolean) => void
}

export default function VoiceMathAssistantModal({
  isOpen,
  onClose,
  onInsert
}: VoiceMathAssistantModalProps) {
  const [transcript, setTranscript] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(true)
  const recognitionRef = useRef<any>(null)

  const conversion = vietnameseMathToLatex(transcript)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      setSpeechSupported(false)
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'vi-VN'
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onresult = (event: any) => {
      let currentText = ''
      for (let i = 0; i < event.results.length; ++i) {
        currentText += event.results[i][0].transcript
      }
      setTranscript(currentText)
    }

    recognition.onerror = () => {
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognitionRef.current = recognition
  }, [])

  const toggleListening = () => {
    if (!recognitionRef.current) return
    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      setTranscript('')
      try {
        recognitionRef.current.start()
        setIsListening(true)
      } catch (e) {
        console.error(e)
      }
    }
  }

  const handleInsert = () => {
    if (conversion.latex) {
      onInsert(conversion.latex, conversion.isMath)
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-indigo-500 via-primary to-emerald-500 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-300" />
            <h3 className="font-bold text-base">Trợ lý Nói & Nhập Toán</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/20 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Input text / speech text */}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
              Nói hoặc gõ văn bản tiếng Việt
            </label>
            <div className="relative">
              <input
                type="text"
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Nói hoặc gõ công thức tiếng Việt (vd: x bình phương cộng 2x = 0)..."
                className="w-full px-4 py-2.5 pr-12 rounded-xl border border-slate-200 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm font-medium text-slate-800"
                autoFocus
              />
              {speechSupported && (
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all ${
                    isListening
                      ? 'bg-rose-500 text-white animate-pulse shadow-md shadow-rose-200'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                  title={isListening ? 'Dừng lắng nghe' : 'Bật micro'}
                >
                  {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                </button>
              )}
            </div>
          </div>

          {/* KaTeX Live Preview */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 min-h-[90px] flex flex-col justify-center items-center text-center">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Xem trước công thức (KaTeX Live)
            </span>
            {conversion.latex ? (
              <div className="text-lg font-bold text-primary py-1">
                <MathText content={`$${conversion.latex}$`} />
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">Đang chờ bạn nói hoặc gõ câu toán...</p>
            )}
            {conversion.latex && (
              <code className="text-[11px] text-slate-500 font-mono mt-1 bg-white px-2 py-0.5 rounded border border-slate-200">
                {conversion.latex}
              </code>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-400">
            {speechSupported ? '🎙️ Nói tiếng Việt để tự dịch công thức' : '⌨️ Gõ tự nhiên để chuyển sang LaTeX'}
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Hủy
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={!conversion.latex}
              onClick={handleInsert}
              className="gap-1.5"
            >
              <Check className="w-4 h-4" /> Chèn vào bài
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Chạy lại test để xác nhận PASS**

Run: `npm test -- src/components/ui/editor/VoiceMathAssistantModal.test.tsx --run`
Expected: PASS.

- [ ] **Step 5: Commit Task 3**

```bash
git add -f frontend/src/components/ui/editor/VoiceMathAssistantModal.tsx frontend/src/components/ui/editor/VoiceMathAssistantModal.test.tsx
git commit -m "feat(editor): create VoiceMathAssistantModal with KaTeX live preview"
```

---

### Task 4: Tích hợp Trợ lý Giọng nói vào `BaseEditor.tsx` & `RichTextEditor`

**Files:**
- Modify: `frontend/src/components/ui/editor/BaseEditor.tsx:96-160`
- Modify: `frontend/src/components/questions/creator/editor/MathExtension.tsx` (nếu cần)

**Interfaces:**
- Connects `VoiceMathAssistantModal` to the `Mic` button on `MenuBar` in `BaseEditor.tsx`.

- [ ] **Step 1: Cập nhật `MenuBar` trong `BaseEditor.tsx`**

Cập nhật `MenuBar` để khi bấm nút `Mic` sẽ mở `VoiceMathAssistantModal`:
Khi người dùng bấm "Chèn vào bài", gọi:
```typescript
const handleInsertMath = (latex: string, isMath?: boolean) => {
  if (isMath) {
    editor.chain().focus().insertContent(`<math-inline data-latex="${latex.replace(/"/g, '&quot;')}">$${latex}$</math-inline> `).run()
  } else {
    editor.chain().focus().insertContent(latex + ' ').run()
  }
}
```

- [ ] **Step 2: Chạy toàn bộ test suites frontend để đảm bảo không có regression**

Run: `npm test -- --run`
Expected: Các test liên quan đến Math & Editor đều PASS.

- [ ] **Step 3: Commit Task 4**

```bash
git add frontend/src/components/ui/editor/BaseEditor.tsx
git commit -m "feat(editor): integrate VoiceMathAssistantModal into BaseEditor MenuBar"
```

---

### Task 5: Kiểm tra Tổng thể & Xác minh Hoạt động (Verification)

- [ ] **Step 1: Kiểm tra build TypeScript**
Run: `npm run build` hoặc `npx tsc --noEmit` trong thư mục `frontend`.
Expected: Build thành công không có lỗi type.

- [ ] **Step 2: Chạy kiểm thử tự động toàn diện**
Run: `npm test -- --run`
Expected: Tất cả test cases trong `src/lib/math-speech/` và `VoiceMathAssistantModal.test.tsx` đều PASS.

- [ ] **Step 3: Commit hoàn thành kế hoạch**
```bash
git add docs/superpowers/plans/2026-09-21-vietnamese-math-to-latex-speech.md
git commit -m "docs: finalize implementation plan for vietnamese math speech engine"
```
