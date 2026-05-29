import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import LectureCreatorHeader from './LectureCreatorHeader'

describe('LectureCreatorHeader', () => {
  it('renders title', () => {
    render(<LectureCreatorHeader />)
    expect(screen.getByText('Soạn bài giảng mới')).toBeDefined()
  })

  it('renders action buttons', () => {
    render(<LectureCreatorHeader />)
    expect(screen.getByText('Tải file PDF đính kèm')).toBeDefined()
    expect(screen.getByText('Lưu & Xuất bản')).toBeDefined()
  })
})
