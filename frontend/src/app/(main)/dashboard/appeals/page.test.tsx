import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import AppealsPage from './page'
import * as api from '@/lib/api'

vi.mock('@/lib/api', () => ({
  getPendingAppeals: vi.fn(),
  getReportedQuestions: vi.fn(),
  getNeedsReviewSubmissions: vi.fn(),
  resolveAppeal: vi.fn(),
  resolveReportedQuestion: vi.fn(),
}))

vi.mock('@/components/ui/ToastProvider', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('@/components/ui/MathText', () => ({
  default: ({ content }: { content: string }) => <span>{content}</span>,
}))

describe('AppealsPage', () => {
  const mockAppeals = [
    {
      resultId: 'sub-1',
      detailId: 'q-1',
      examName: 'Đề kiểm tra 1 tiết Đại số',
      question: 'Giải phương trình: x^2 - 4 = 0',
      studentAnswer: 'x = 2 hoặc x = -2',
      aiExplanation: 'Lời giải đúng',
      score: 1.5,
      maxScore: 2.0,
      appealMessage: 'Em làm đúng nhưng AI trừ 0.5 điểm trình bày',
    },
  ]

  const mockReports = [
    {
      id: 'quest-12345678',
      content: 'Cho tam giác ABC vuông tại A...',
      reportMessage: 'Đề bài thiếu độ dài cạnh BC',
    },
  ]

  const mockReviews = [
    {
      submissionId: 'sub-2',
      examName: 'Thi thử vào 10 năm 2026',
      studentName: 'Trần Văn Nam',
      studentEmail: 'nam@example.com',
      submittedAt: '2026-05-15T10:00:00Z',
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(api.getPendingAppeals).mockResolvedValue(mockAppeals)
    vi.mocked(api.getReportedQuestions).mockResolvedValue(mockReports)
    vi.mocked(api.getNeedsReviewSubmissions).mockResolvedValue(mockReviews)
  })

  it('renders page header, breadcrumbs, and tabs with counts', async () => {
    render(<AppealsPage />)

    expect(await screen.findByText('Quản lý Báo lỗi & Kháng cáo')).toBeInTheDocument()
    expect(screen.getByText('Báo lỗi & Kháng cáo')).toBeInTheDocument()

    expect(screen.getByRole('button', { name: /Kháng cáo/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Báo cáo lỗi câu hỏi/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Cần duyệt chấm/i })).toBeInTheDocument()

    // Default tab is appeals
    expect(await screen.findByText('Đề kiểm tra 1 tiết Đại số')).toBeInTheDocument()
    expect(screen.getByText(/Em làm đúng nhưng AI trừ 0.5 điểm/i)).toBeInTheDocument()
  })

  it('switches between tabs properly', async () => {
    render(<AppealsPage />)
    await screen.findByText('Đề kiểm tra 1 tiết Đại số')

    // Switch to Reports tab
    const reportsTab = screen.getByRole('button', { name: /Báo cáo lỗi câu hỏi/i })
    fireEvent.click(reportsTab)

    expect(await screen.findByText(/Đề bài thiếu độ dài cạnh BC/i)).toBeInTheDocument()
    expect(screen.getByText(/Cho tam giác ABC/i)).toBeInTheDocument()

    // Switch to Reviews tab
    const reviewsTab = screen.getByRole('button', { name: /Cần duyệt chấm/i })
    fireEvent.click(reviewsTab)

    expect(await screen.findByText('Trần Văn Nam')).toBeInTheDocument()
    expect(screen.getByText('Thi thử vào 10 năm 2026')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Chấm ngay/i })).toBeInTheDocument()
  })

  it('opens and resolves appeal modal', async () => {
    vi.mocked(api.resolveAppeal).mockResolvedValue({ success: true })
    render(<AppealsPage />)

    const approveButton = await screen.findByRole('button', { name: /Duyệt kháng cáo cho đề/i })
    fireEvent.click(approveButton)

    // Modal should be open
    expect(screen.getByText('Duyệt Kháng Cáo')).toBeInTheDocument()
    expect(screen.getByText('Chấp thuận & Đổi điểm')).toBeInTheDocument()

    // Input feedback
    const textarea = screen.getByPlaceholderText(/Giải thích lý do/i)
    fireEvent.change(textarea, { target: { value: 'Chấp thuận, cộng lại 0.5 điểm cho em' } })

    // Click confirm
    const confirmButton = screen.getByRole('button', { name: 'Xác nhận' })
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(api.resolveAppeal).toHaveBeenCalledWith('sub-1', expect.objectContaining({
        detailId: 'q-1',
        status: 'APPROVED',
        teacherFeedback: 'Chấp thuận, cộng lại 0.5 điểm cho em',
      }))
    })
  })

  it('renders friendly empty state when there are no items', async () => {
    vi.mocked(api.getPendingAppeals).mockResolvedValue([])
    vi.mocked(api.getReportedQuestions).mockResolvedValue([])
    vi.mocked(api.getNeedsReviewSubmissions).mockResolvedValue([])

    render(<AppealsPage />)

    expect(await screen.findByText('Không có kháng cáo chờ xử lý')).toBeInTheDocument()
  })
})
