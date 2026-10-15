import { describe, it, expect } from 'vitest'
import { getAvatarInitial } from './utils'

describe('getAvatarInitial (Vietnamese standard)', () => {
  it('returns the initial of the last word for full names', () => {
    expect(getAvatarInitial('Nguyễn Văn An')).toBe('A')
    expect(getAvatarInitial('Trần Thị Bích Ngọc')).toBe('N')
    expect(getAvatarInitial('Phạm Hoàng Nam')).toBe('N')
  })

  it('handles single-word names correctly', () => {
    expect(getAvatarInitial('Bình')).toBe('B')
    expect(getAvatarInitial('an')).toBe('A')
  })

  it('handles names with digits or alphanumeric suffix', () => {
    expect(getAvatarInitial('Học sinh 9A')).toBe('9')
    expect(getAvatarInitial('Lớp 12')).toBe('1')
  })

  it('trims leading, trailing and duplicate spaces properly', () => {
    expect(getAvatarInitial('   Nguyễn   Khánh   Linh   ')).toBe('L')
  })

  it('handles names with parentheses or quotes', () => {
    expect(getAvatarInitial('Bạn (Nam)')).toBe('N')
    expect(getAvatarInitial('(Hải)')).toBe('H')
    expect(getAvatarInitial('"Thảo"')).toBe('T')
  })

  it('returns fallback for empty, null, or undefined values', () => {
    expect(getAvatarInitial('')).toBe('U')
    expect(getAvatarInitial('   ')).toBe('U')
    expect(getAvatarInitial(null)).toBe('U')
    expect(getAvatarInitial(undefined)).toBe('U')
    expect(getAvatarInitial('', 'H')).toBe('H')
  })
})
