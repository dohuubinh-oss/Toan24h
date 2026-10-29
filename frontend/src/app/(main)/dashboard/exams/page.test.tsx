import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ExamsPage from './page'
import * as api from '@/lib/api'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/dashboard/exams',
}))

// Mock ExamTable
vi.mock('@/components/exams/ExamTable', () => ({
  default: () => <div data-testid="exam-table-mock">ExamTable</div>
}))

// Mock API
vi.mock('@/lib/api', () => ({
  getExams: vi.fn(),
  deleteExam: vi.fn(),
}))

describe('Exams Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(api.getExams).mockResolvedValue([
      {
        id: 'exam-1',
        title: 'Đề kiểm tra Đại số 9',
        grade: 9,
        duration: 45,
        questionIds: ['q1', 'q2'],
      }
    ] as any)
  })

  it('renders the heading', async () => {
    render(<ExamsPage />)
    await waitFor(() => {
      expect(screen.getByText(/Danh sách Bài thi/i)).toBeInTheDocument()
    })
  })

  it('renders the select questions to create exam link', async () => {
    render(<ExamsPage />)
    const link = screen.getByRole('link', { name: /Chọn câu hỏi tạo đề/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/dashboard/questions')
  })

  it('renders the ExamTable when data is loaded', async () => {
    render(<ExamsPage />)
    await waitFor(() => {
      expect(screen.getByTestId('exam-table-mock')).toBeInTheDocument()
    })
  })

  it('renders error state with retry button when API fails', async () => {
    vi.mocked(api.getExams).mockRejectedValueOnce(new Error('Lỗi kết nối máy chủ'))
    render(<ExamsPage />)
    await waitFor(() => {
      expect(screen.getByText(/Không thể tải dữ liệu đề thi/i)).toBeInTheDocument()
      expect(screen.getByText('Lỗi kết nối máy chủ')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Thử lại/i })).toBeInTheDocument()
    })
  })
})
