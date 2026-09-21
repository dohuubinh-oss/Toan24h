import { vietnameseMathToLatex } from './vietnameseMathToLatex'

export interface SpeechSegment {
  type: 'text' | 'math'
  content: string
}

const MATH_TRIGGER_KEYWORDS = [
  'phân số',
  'căn bậc',
  'căn',
  'mũ',
  'bình phương',
  'lập phương',
  'bằng',
  'lớn hơn hoặc bằng',
  'nhỏ hơn hoặc bằng',
  'bé hơn hoặc bằng',
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
  'suy ra',
  'alpha',
  'an pha',
  'beta',
  'bê ta',
  'gamma',
  'gam ma',
  'delta',
  'đen ta',
  'omega',
  'ô mê ga',
  'pi'
]

export function segmentSpeechTextAndMath(rawInput: string): SpeechSegment[] {
  if (!rawInput || !rawInput.trim()) return []
  const input = rawInput.trim()

  // 1. Tìm vị trí xuất hiện đầu tiên của từ khóa/cụm toán học với lookbehind Unicode
  const mathTriggerPattern = new RegExp(
    `(?<=^|[^\\p{L}\\p{N}_])(` +
      `(?:${MATH_TRIGGER_KEYWORDS.join('|')})|` +
      `\\d+\\s*[a-zA-Z]|` +
      `(?:một|hai|ba|bốn|năm|sáu|bảy|bẩy|tám|chín|mười)\\s+[a-zA-Z]|` +
      `[a-zA-Z]\\s+(?:mũ|bình|lập|cộng|trừ|nhân|chia|bằng|lớn|nhỏ|bé)` +
    `)(?=[^\\p{L}\\p{N}_]|$)`,
    'iu'
  )

  const match = input.match(mathTriggerPattern)
  if (!match || match.index === undefined) {
    // Không tìm thấy dấu hiệu toán học -> Văn bản thuần
    return [{ type: 'text', content: input }]
  }

  const splitIdx = match.index

  // Nếu vị trí bắt đầu toán ở ngay đầu câu (index 0), toàn bộ câu là biểu thức toán
  if (splitIdx === 0) {
    const mathConversion = vietnameseMathToLatex(input)
    if (mathConversion.isMath && mathConversion.latex) {
      return [{ type: 'math', content: mathConversion.latex }]
    }
    return [{ type: 'text', content: input }]
  }

  // Nếu vị trí bắt đầu toán nằm ở giữa/cuối câu -> Tách thành [Text, Math]
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
