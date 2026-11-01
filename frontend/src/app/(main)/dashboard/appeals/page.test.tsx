import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import AppealsPage from './page'
import * as api from '@/lib/api'

vi.mock('@/lib/api', () => ({
  getPendingAppeals: vi.fn(),
  getReportedQuestions: vi.fn(),
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
      studentName: 'Lê Minh Anh',
      studentEmail: 'minhanh@example.com',
      submittedAt: '2026-05-15T09:30:00Z',
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
      options: ['3 cm', '4 cm', '5 cm', '6 cm'],
      correctAnswer: '5 cm',
      solutionGuide: 'Áp dụng định lý Pytago',
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(api.getPendingAppeals).mockResolvedValue(mockAppeals)
    vi.mocked(api.getReportedQuestions).mockResolvedValue(mockReports)
  })

  it('renders page header, breadcrumbs, and tabs with counts', async () => {
    render(<AppealsPage />)

    expect(await screen.findByText('Quản lý Báo lỗi & Kháng cáo')).toBeInTheDocument()
    expect(screen.getByText('Báo lỗi & Kháng cáo')).toBeInTheDocument()

    expect(screen.getByRole('button', { name: /^Kháng cáo/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Báo cáo lỗi câu hỏi/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Cần duyệt chấm/i })).not.toBeInTheDocument()

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

    // Switch back to Appeals tab
    const appealsTab = screen.getByRole('button', { name: /^Kháng cáo/i })
    fireEvent.click(appealsTab)

    expect(await screen.findByText('Đề kiểm tra 1 tiết Đại số')).toBeInTheDocument()
    expect(screen.getByText(/Em làm đúng nhưng AI trừ 0.5 điểm/i)).toBeInTheDocument()
  })

  it('opens and resolves appeal modal', async () => {
    vi.mocked(api.resolveAppeal).mockResolvedValue({ success: true })
    render(<AppealsPage />)

    const approveButton = await screen.findByRole('button', { name: /Duyệt kháng cáo cho đề/i })
    fireEvent.click(approveButton)

    // Modal should be open
    expect(screen.getByText('Duyệt Kháng Cáo')).toBeInTheDocument()
    expect(screen.getByText('Chấp thuận & Đổi điểm')).toBeInTheDocument()

    // Student info in modal header
    expect(screen.getAllByText('Lê Minh Anh').length).toBeGreaterThanOrEqual(2)

    // Test quick score max button
    const maxScoreBtn = screen.getByRole('button', { name: /Tối đa \(2\)/i })
    fireEvent.click(maxScoreBtn)

    // Test quick feedback chip
    const feedbackChip = screen.getByRole('button', { name: /Đã cộng điểm câu này/i })
    fireEvent.click(feedbackChip)

    // Click confirm
    const confirmButton = screen.getByRole('button', { name: 'Xác nhận' })
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(api.resolveAppeal).toHaveBeenCalledWith('sub-1', expect.objectContaining({
        detailId: 'q-1',
        status: 'APPROVED',
        newScore: 2,
        teacherFeedback: expect.stringContaining('Đã cộng điểm câu này'),
      }))
    })
  })

  it('allows expanding reported question to view answers and solution guide', async () => {
    render(<AppealsPage />)
    await screen.findByText('Đề kiểm tra 1 tiết Đại số')

    // Switch to Reports tab
    const reportsTab = screen.getByRole('button', { name: /Báo cáo lỗi câu hỏi/i })
    fireEvent.click(reportsTab)

    expect(await screen.findByText(/Đề bài thiếu độ dài cạnh BC/i)).toBeInTheDocument()

    // Initially details are not visible
    expect(screen.queryByText('Các phương án lựa chọn:')).not.toBeInTheDocument()

    // Click "Xem đáp án" button
    const toggleBtn = screen.getByRole('button', { name: /Xem đáp án/i })
    fireEvent.click(toggleBtn)

    // Now options, correct answer and solution guide are displayed
    expect(screen.getByText('Các phương án lựa chọn:')).toBeInTheDocument()
    expect(screen.getByText('Áp dụng định lý Pytago')).toBeInTheDocument()
    expect(screen.getByText('(Đáp án đúng)')).toBeInTheDocument()

    // Click again to hide
    const hideBtn = screen.getByRole('button', { name: /Ẩn đáp án/i })
    fireEvent.click(hideBtn)
    expect(screen.queryByText('Các phương án lựa chọn:')).not.toBeInTheDocument()
  })

  it('renders friendly empty state when there are no items', async () => {
    vi.mocked(api.getPendingAppeals).mockResolvedValue([])
    vi.mocked(api.getReportedQuestions).mockResolvedValue([])

    render(<AppealsPage />)

    expect(await screen.findByText('Không có kháng cáo chờ xử lý')).toBeInTheDocument()
  })
})
