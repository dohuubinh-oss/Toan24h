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
      { type: 'math', content: '3x^4 + 2x - 1' }
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

  it('handles variable with power in text', () => {
    const res = segmentSpeechTextAndMath('Cho đa thức P bằng x bình phương cộng 1')
    expect(res).toEqual([
      { type: 'text', content: 'Cho đa thức' },
      { type: 'math', content: 'P = x^2 + 1' }
    ])
  })

  it('handles equation with solving text', () => {
    const res = segmentSpeechTextAndMath('Tìm x biết x cộng 5 bằng 10')
    expect(res).toEqual([
      { type: 'text', content: 'Tìm x biết' },
      { type: 'math', content: 'x + 5 = 10' }
    ])
  })

  it('handles root expression in text', () => {
    const res = segmentSpeechTextAndMath('Biết rằng căn bậc hai của x cộng một bằng ba')
    expect(res).toEqual([
      { type: 'text', content: 'Biết rằng' },
      { type: 'math', content: '\\sqrt{x + 1} = 3' }
    ])
  })

  it('handles voice control punctuation commands like hai chấm xuống dòng', () => {
    const res = segmentSpeechTextAndMath('Giải phương trình sau hai chấm xuống dòng 3 x bình phương cộng 1 bằng 0')
    expect(res).toEqual([
      { type: 'text', content: 'Giải phương trình sau:\n' },
      { type: 'math', content: '3x^2 + 1 = 0' }
    ])
  })
})
