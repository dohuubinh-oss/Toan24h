import { normalizeVietnameseMath } from './normalizeVietnameseMath'
import { GRAMMAR_RULES } from './grammarRules'

export interface MathConversionResult {
  latex: string
  rawText: string
  isMath: boolean
}

export function vietnameseMathToLatex(input: string): MathConversionResult {
  if (!input || !input.trim()) {
    return { latex: '', rawText: '', isMath: false }
  }

  // 1. Chuẩn hóa số từ, biến số và từ đệm
  const normalized = normalizeVietnameseMath(input)
  let result = normalized

  // 2. Chạy multi-pass grammar transformer để giải quyết cấu trúc lồng nhau (phân số trong căn, căn trong phân số...)
  let maxPasses = 4
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

  // 3. Ghép số đứng trước biến (nhưng không áp dụng nếu số đó đứng ngay sau ^ hoặc _ ví dụ \sin^2 x): "3 x" -> "3x", "4 y" -> "4y", "2 xy" -> "2xy"
  result = result.replace(/(^|[^\^_0-9a-zA-Z\\])(\d+)\s+([a-zA-Z])(?![a-zA-Z0-9_àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ])/g, '$1$2$3')

  // 4. Hậu xử lý khoảng trắng & chuẩn hóa LaTeX
  result = result.replace(/\s+/g, ' ').trim()

  // 5. Kiểm tra xem chuỗi có phải là biểu thức toán học không
  const hasLatexCommands = /\\(frac|sqrt|Delta|widehat|vec|sin|cos|tan|cot|begin|parallel|perp|sim|ge|le|cdot|alpha|beta|gamma|pi|theta|omega|circ)/.test(result)
  const hasMathOperators = /[\^_\+=:<>]/.test(result)
  const isMath = hasLatexCommands || hasMathOperators

  return {
    latex: result,
    rawText: input,
    isMath
  }
}
