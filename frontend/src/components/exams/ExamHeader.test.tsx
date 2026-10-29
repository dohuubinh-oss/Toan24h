import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import ExamHeader from './ExamHeader'

describe('ExamHeader Component', () => {
  it('renders the header title', () => {
    render(<ExamHeader title="Kiểm tra & Hoàn thiện đề thi AI" />)
    expect(screen.getByText('Kiểm tra & Hoàn thiện đề thi AI')).toBeInTheDocument()
  })

  it('renders the publish button and does not render unused download pdf button', () => {
    render(<ExamHeader title="Kiểm tra" />)
    const button = screen.getByRole('button', { name: /Lưu & Xuất bản/i })
    expect(button).toBeInTheDocument()
    expect(button).toHaveClass('h-12')
    expect(screen.queryByText(/Tải file PDF/i)).not.toBeInTheDocument()
  })
})
