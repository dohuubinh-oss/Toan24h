import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import ExamConfigSidebar from './ExamConfigSidebar'

describe('ExamConfigSidebar Component', () => {
  const mockConfig = {
    title: 'Đề thi thử',
    grade: '8',
    duration: 90,
    type: 'Giữa kì 1'
  }
  const mockOnChange = vi.fn()
  const mockQuestions = [
    {
      id: 'q1',
      topic: 'Đại số',
      difficulty_level: 'Nhận biết',
      point: 1,
      difficulty_point: 2.5
    }
  ]

  it('renders config form elements and 6 standard exam types', () => {
    render(<ExamConfigSidebar config={mockConfig} onChange={mockOnChange} questions={mockQuestions as any} />)
    expect(screen.getByText('Tên đề thi')).toBeInTheDocument()
    expect(screen.getByText('Khối lớp')).toBeInTheDocument()
    expect(screen.getByText('Thời gian (phút)')).toBeInTheDocument()
    expect(screen.getByText('Loại đề')).toBeInTheDocument()

    // 6 types
    expect(screen.getByRole('option', { name: 'Giữa kì 1' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Cuối kì 1' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Giữa kì 2' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Cuối kì 2' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Chuyên Đề' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Ôn tập' })).toBeInTheDocument()
  })

  it('renders matrix table with total row when questions exist', () => {
    render(<ExamConfigSidebar config={mockConfig} onChange={mockOnChange} questions={mockQuestions as any} />)
    expect(screen.getByText('Ma trận đề thi')).toBeInTheDocument()
    expect(screen.getByText('Tổng cộng')).toBeInTheDocument()
  })

  it('renders "Liên kết bài giảng" for both exam and practice categories', () => {
    // 1. Exam mode (cate === 'exam' or undefined)
    const { rerender } = render(<ExamConfigSidebar config={{ ...mockConfig, cate: 'exam' }} onChange={mockOnChange} questions={mockQuestions as any} />)
    expect(screen.getByText('Liên kết bài giảng')).toBeInTheDocument()
    expect(screen.getByText('Chưa liên kết bài giảng')).toBeInTheDocument()

    // 2. Practice mode (cate === 'practice')
    rerender(<ExamConfigSidebar config={{ ...mockConfig, cate: 'practice' }} onChange={mockOnChange} questions={mockQuestions as any} />)
    expect(screen.getByText('Liên kết bài giảng')).toBeInTheDocument()
  })
})
