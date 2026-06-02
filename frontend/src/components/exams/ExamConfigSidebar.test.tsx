import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import ExamConfigSidebar from './ExamConfigSidebar'

describe('ExamConfigSidebar Component', () => {
  const mockConfig = {
    title: 'Đề thi thử',
    grade: '12',
    duration: 90
  }
  const mockOnChange = vi.fn()
  const mockQuestions = []

  it('renders config form elements', () => {
    render(<ExamConfigSidebar config={mockConfig} onChange={mockOnChange} questions={mockQuestions} />)
    expect(screen.getByText('Tên đề thi')).toBeInTheDocument()
    expect(screen.getByText('Khối lớp')).toBeInTheDocument()
    expect(screen.getByText('Thời gian (phút)')).toBeInTheDocument()
  })

  it('renders matrix table', () => {
    render(<ExamConfigSidebar config={mockConfig} onChange={mockOnChange} questions={mockQuestions} />)
    expect(screen.getByText('Ma trận đề thi')).toBeInTheDocument()
    expect(screen.getByText('Tổng cộng')).toBeInTheDocument()
  })
})
