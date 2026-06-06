import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import LectureContentEditor from './LectureContentEditor'

describe('LectureContentEditor', () => {
  it('renders editor sections', () => {
    render(<LectureContentEditor />)
    expect(screen.getByText('1. Khái niệm cơ bản')).toBeDefined()
    expect(screen.getByText('2.1. Phân tích bài tập mẫu')).toBeDefined()
  })

  it('renders tip tap toolbar buttons', () => {
    render(<LectureContentEditor />)
    // Check for some toolbar icons (we might use aria-labels or tooltips, let's just check buttons)
    const boldButton = screen.getAllByRole('button').find(b => b.innerHTML.includes('lucide-bold'))
    expect(boldButton).toBeDefined()
  })
})
