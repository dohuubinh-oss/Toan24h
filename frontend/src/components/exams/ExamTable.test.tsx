import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import ExamTable from './ExamTable'

describe('ExamTable Component', () => {
  const mockExams = [
    {
      id: 'E-01',
      title: 'Kiểm tra Giữa kỳ I - Đại số 10',
      grade: 10,
      questionCount: 50,
      duration: 90,
      status: 'Published' as const,
      updatedAt: '2 giờ trước'
    }
  ]

  it('renders the table headers', () => {
    render(<ExamTable exams={mockExams} />)
    expect(screen.getByText('Tên đề thi')).toBeInTheDocument()
    expect(screen.getByText('Khối lớp')).toBeInTheDocument()
    expect(screen.getByText('Số câu hỏi')).toBeInTheDocument()
    expect(screen.getByText('Thời gian')).toBeInTheDocument()
    expect(screen.getByText('Trạng thái')).toBeInTheDocument()
  })

  it('renders exam data correctly', () => {
    render(<ExamTable exams={mockExams} />)
    expect(screen.getByText('Kiểm tra Giữa kỳ I - Đại số 10')).toBeInTheDocument()
    expect(screen.getByText('Lớp 10')).toBeInTheDocument()
    expect(screen.getByText('50')).toBeInTheDocument()
    expect(screen.getByText('90 phút')).toBeInTheDocument()
    expect(screen.getByText('Đã xuất bản')).toBeInTheDocument()
  })
})
