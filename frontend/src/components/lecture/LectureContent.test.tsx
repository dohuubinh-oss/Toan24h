import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import LectureContent from './LectureContent'

describe('LectureContent', () => {
  it('renders section headers', () => {
    render(<LectureContent />)
    expect(screen.getByText('1. Giải thích khái niệm')).toBeDefined()
    expect(screen.getByText('2. Phân tích bài tập mẫu')).toBeDefined()
    expect(screen.getByText('3. Ví dụ minh họa hình vẽ')).toBeDefined()
  })

  it('renders teacher notes', () => {
    render(<LectureContent />)
    expect(screen.getByText('DẶN DÒ CỦA GIÁO VIÊN')).toBeDefined()
    expect(screen.getByText('Lưu ý khi làm bài')).toBeDefined()
    expect(screen.getByText('Kinh nghiệm thi')).toBeDefined()
    expect(screen.getByText('Lời khuyên học tập')).toBeDefined()
  })

  it('contains latex-font class for math formulas', () => {
    const { container } = render(<LectureContent />)
    const latexElements = container.querySelectorAll('.latex-font')
    expect(latexElements.length).toBeGreaterThan(0)
  })
})
