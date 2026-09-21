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
