import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import LectureContentEditor from './LectureContentEditor'
import { LectureCreatorProvider } from './LectureCreatorContext'

describe('LectureContentEditor', () => {
  it('renders correctly', () => {
    render(
      <LectureCreatorProvider>
        <LectureContentEditor />
      </LectureCreatorProvider>
    )
    expect(screen.getByText('1. Khái niệm cơ bản')).toBeDefined()
    expect(screen.getByText('2.1. Phân tích bài tập mẫu')).toBeDefined()
  })

  it('renders tip tap toolbar buttons', () => {
    render(
      <LectureCreatorProvider>
        <LectureContentEditor />
      </LectureCreatorProvider>
    )
    // Check for some toolbar icons (we might use aria-labels or tooltips, let's just check buttons)
    const boldButton = screen.getAllByRole('button').find(b => b.innerHTML.includes('lucide-bold'))
    expect(boldButton).toBeDefined()
  })
})
