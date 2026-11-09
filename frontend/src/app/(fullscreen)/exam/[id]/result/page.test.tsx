import React, { Suspense, act } from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ExamResultPage from './page'

const mockRouter = {
  push: vi.fn(),
  back: vi.fn(),
  replace: vi.fn(),
}

let mockSearchParamsMode = ''
vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => ({
    get: (key: string) => (key === 'mode' ? mockSearchParamsMode : null)
  })
}))

const mockQuestions = [
  {
    id: 'q-1',
    typeQuestion: 'single',
    type: 'Trắc nghiệm',
    topic: 'Căn thức',
    content: 'Rút gọn biểu thức A',
    options: ['2', '3'],
    difficultyPoint: 5,
    answer: '2'
  },
  {
    id: 'q-2',
    typeQuestion: 'single',
    type: 'Tự luận',
    topic: 'Hình học',
    content: 'Chứng minh tam giác ABC đồng dạng',
    options: [],
    difficultyPoint: 5,
    solution_guide: 'Áp dụng định lý Ta-lét'
  }
]

const mockResultData = {
  submission: {
    id: 'sub-1',
    status: 'graded',
    totalScore: 9,
    submittedAt: '2026-11-09T10:00:00Z',
    answersJson: JSON.stringify({
      'q-1': { score: 5, user_answer: '2', is_correct: true },
      'q-2': { score: 4, deduction_reason: 'Thiếu đơn vị' }
    }),
    aiGeneralFeedback: 'Bài làm rất tốt, lập luận chặt chẽ.',
    aiComprehensionRemark: 'Tư duy logic nhạy bén.',
    overallEssayFeedback: 'Bài làm rất tốt, lập luận chặt chẽ.',
    overallComprehensionFeedback: 'Tư duy logic nhạy bén.'
  },
  exam: {
    id: 'exam-1',
    title: 'Đề Khảo Sát Toán 9',
    grade: '9',
    cate: 'exam'
  },
  questions: mockQuestions,
  attempts: [
    { id: 'sub-1', attemptNumber: 1, totalScore: 9 },
    { id: 'sub-2', attemptNumber: 2, totalScore: 10 }
  ]
}

const mockGetExamResultById = vi.fn()
const mockSubmitTeacherGradingReview = vi.fn()

vi.mock('@/lib/api', () => ({
  getExamResultById: (...args: any[]) => mockGetExamResultById(...args),
  submitTeacherGradingReview: (...args: any[]) => mockSubmitTeacherGradingReview(...args)
}))

const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn()
}

vi.mock('@/components/ui/ToastProvider', () => ({
  useToast: () => mockToast,
  ToastProvider: ({ children }: any) => <>{children}</>
}))

describe('ExamResultPage - Distill UI Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    sessionStorage.clear()
    mockSearchParamsMode = ''
  })

  it('renders pending state cleanly when exam grading is in progress', async () => {
    mockGetExamResultById.mockResolvedValueOnce({
      submission: { status: 'pending' },
      questions: mockQuestions
    })

    const params = Promise.resolve({ id: 'sub-pending' })
    await act(async () => {
      render(
        <Suspense fallback={<div>Loading...</div>}>
          <ExamResultPage params={params} />
        </Suspense>
      )
    })

    await waitFor(() => {
      expect(screen.getByText('Hệ thống đang chấm điểm bài làm')).toBeInTheDocument()
    })
    expect(
      screen.getByText(/Hệ thống đang phân tích chi tiết các bước giải/i)
    ).toBeInTheDocument()
  })

  it('renders distilled result page without intrusive overlay navigation traps', async () => {
    mockGetExamResultById.mockResolvedValueOnce(mockResultData)

    const params = Promise.resolve({ id: 'sub-1' })
    await act(async () => {
      render(
        <Suspense fallback={<div>Loading...</div>}>
          <ExamResultPage params={params} />
        </Suspense>
      )
    })

    // Wait for exam content to load
    await waitFor(() => {
      expect(screen.getByText('Đề Khảo Sát Toán 9')).toBeInTheDocument()
    })

    expect(screen.getByText(/Tổng điểm: 9.0\/10/i)).toBeInTheDocument()

    // Multiple attempts segmented bar
    expect(screen.getByText('Lần làm bài:')).toBeInTheDocument()
    expect(screen.getByText(/Lần 1 \(Chính thức\):/i)).toBeInTheDocument()
    expect(screen.getByText(/Lần 2 \(Ôn tập\):/i)).toBeInTheDocument()

    // Retake button
    expect(screen.getByText('Làm lại đề thi')).toBeInTheDocument()

    // Footer navigation
    expect(screen.getByRole('button', { name: /Câu trước/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Câu tiếp theo/i })).toBeInTheDocument()

    // Verify overlay hover traps are gone (only footer prev button exists)
    const prevButtons = screen.getAllByRole('button', { name: /Câu trước/i })
    expect(prevButtons).toHaveLength(1)
  })

  it('opens AI summary modal cleanly without marketing fluff badge', async () => {
    mockGetExamResultById.mockResolvedValueOnce(mockResultData)

    const params = Promise.resolve({ id: 'sub-1' })
    await act(async () => {
      render(
        <Suspense fallback={<div>Loading...</div>}>
          <ExamResultPage params={params} />
        </Suspense>
      )
    })

    await waitFor(() => {
      expect(screen.getByText('Đề Khảo Sát Toán 9')).toBeInTheDocument()
    })

    // Click "Xem Nhận xét AI"
    const aiSummaryBtn = screen.getByRole('button', { name: /Xem Nhận xét AI/i })
    fireEvent.click(aiSummaryBtn)

    // Modal title appears
    expect(screen.getByText('Báo cáo Đánh giá AI Tổng quan')).toBeInTheDocument()

    // NO "Gemini 3.6 Flash" badge should be present (distilled)
    expect(screen.queryByText(/Gemini 3.6 Flash/i)).not.toBeInTheDocument()

    // Tabs
    expect(screen.getByText('Nhận xét Tự luận')).toBeInTheDocument()
    expect(screen.getByText('Phân tích Tư duy')).toBeInTheDocument()

    // Switch to Comprehension Tab
    const compTab = screen.getByRole('button', { name: /Phân tích Tư duy/i })
    fireEvent.click(compTab)
    expect(screen.getByText('Tư duy logic nhạy bén.')).toBeInTheDocument()

    // Close modal
    const closeBtn = screen.getByRole('button', { name: /Đóng báo cáo/i })
    fireEvent.click(closeBtn)
    expect(screen.queryByText('Báo cáo Đánh giá AI Tổng quan')).not.toBeInTheDocument()
  })

  it('supports teacher grading mode with teacher controls and review submission', async () => {
    mockSearchParamsMode = 'grade'
    mockGetExamResultById.mockResolvedValueOnce(mockResultData)
    mockSubmitTeacherGradingReview.mockResolvedValueOnce({ success: true })

    const params = Promise.resolve({ id: 'sub-1' })
    await act(async () => {
      render(
        <Suspense fallback={<div>Loading...</div>}>
          <ExamResultPage params={params} />
        </Suspense>
      )
    })

    await waitFor(() => {
      expect(screen.getByText('Giáo viên chấm điểm câu này:')).toBeInTheDocument()
    })

    // Save and complete grading button in footer
    const saveBtn = screen.getByRole('button', { name: /Lưu & Hoàn tất chấm/i })
    expect(saveBtn).toBeInTheDocument()

    fireEvent.click(saveBtn)
    await waitFor(() => {
      expect(mockSubmitTeacherGradingReview).toHaveBeenCalled()
    })
  })
})
