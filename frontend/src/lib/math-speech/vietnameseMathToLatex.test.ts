import { describe, it, expect } from 'vitest'
import { vietnameseMathToLatex } from './vietnameseMathToLatex'

describe('vietnameseMathToLatex', () => {
  it('chuyển các phép toán đại số cơ bản', () => {
    expect(vietnameseMathToLatex('x cộng hai bằng năm').latex).toBe('x + 2 = 5')
    expect(vietnameseMathToLatex('ba x trừ bốn y bằng không').latex).toBe('3x - 4y = 0')
    expect(vietnameseMathToLatex('hai nhân ba chia sáu').latex).toBe('2 \\cdot 3 : 6')
  })

  it('chuyển phân số và phân số đa thức', () => {
    expect(vietnameseMathToLatex('phân số ba phần bốn').latex).toBe('\\frac{3}{4}')
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

  it('nhận diện cờ isMath chính xác', () => {
    expect(vietnameseMathToLatex('x cộng một').isMath).toBe(true)
    expect(vietnameseMathToLatex('chào buổi sáng').isMath).toBe(false)
  })
})
