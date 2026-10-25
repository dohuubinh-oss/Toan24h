import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import ExamTable from './ExamTable'

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

describe('ExamTable Component', () => {
  const mockExams = [
    {
      id: 'E-01',
      title: 'Kiểm tra Giữa kì 1 - Đại số 10',
      grade: 10,
      questionIds: ['q1', 'q2'],
      duration: 90,
      cate: 'exam',
      type: 'Giữa kì 1',
      diffScore: 6.5,
      updatedAt: '2 giờ trước'
    }
  ]

  it('renders the table headers', () => {
    render(<ExamTable exams={mockExams} />)
    expect(screen.getByText('Tên đề thi')).toBeInTheDocument()
    expect(screen.getByText('Khối lớp')).toBeInTheDocument()
    expect(screen.getByText('Số câu hỏi')).toBeInTheDocument()
    expect(screen.getByText('Thời gian')).toBeInTheDocument()
    expect(screen.getByText('Phân loại')).toBeInTheDocument()
    expect(screen.getByText('Loại đề')).toBeInTheDocument()
  })

  it('renders exam data and type badge correctly', () => {
    render(<ExamTable exams={mockExams} />)
    expect(screen.getByText('Kiểm tra Giữa kì 1 - Đại số 10')).toBeInTheDocument()
    expect(screen.getByText('Lớp 10')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('90 phút')).toBeInTheDocument()
    expect(screen.getByText('Giữa kì 1')).toBeInTheDocument()
  })
})
