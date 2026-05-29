import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import ExamHeader from './ExamHeader'

describe('ExamHeader Component', () => {
  it('renders the header title', () => {
    render(<ExamHeader title="Kiểm tra & Hoàn thiện đề thi AI" />)
    expect(screen.getByText('Kiểm tra & Hoàn thiện đề thi AI')).toBeInTheDocument()
  })

  it('renders the publish button', () => {
    render(<ExamHeader title="Kiểm tra" />)
    const button = screen.getByRole('button', { name: /Lưu & Xuất bản/i })
    expect(button).toBeInTheDocument()
    // Test that it has a11y touch target padding/height
    expect(button).toHaveClass('h-12')
  })
})
