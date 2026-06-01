import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import ExamsPage from './page'

// Mock ExamTable
vi.mock('@/components/exams/ExamTable', () => ({
  default: () => <div data-testid="exam-table-mock">ExamTable</div>
}))

describe('Exams Page', () => {
  it('renders the heading', () => {
    render(<ExamsPage />)
    expect(screen.getByText('Danh sách Bài thi')).toBeInTheDocument()
  })

  it('renders the create new exam link', () => {
    render(<ExamsPage />)
    const link = screen.getByRole('link', { name: /Tạo đề thi mới/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/dashboard/exams/create')
  })

  it('renders the ExamTable', () => {
    render(<ExamsPage />)
    expect(screen.getByTestId('exam-table-mock')).toBeInTheDocument()
  })
})
