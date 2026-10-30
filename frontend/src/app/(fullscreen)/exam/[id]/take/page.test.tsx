import React, { Suspense, act } from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import ExamTakePage from './page'

const mockRouter = {
  push: vi.fn(),
  back: vi.fn(),
  replace: vi.fn(),
}
vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}))

const mockExamDataPractice = {
  id: 'exam-practice-1',
  title: 'Đề Luyện Tập Đại Số 9',
  grade: '9',
  cate: 'practice',
  duration: 45,
  questionIds: ['q-1']
}

const mockExamDataExam = {
  id: 'exam-real-1',
  title: 'Đề Thi Thử Học Kì 1 Toán 9',
  grade: '9',
  cate: 'exam',
  duration: 45,
  questionIds: ['q-1']
}

const mockQuestionsData = [
  {
    id: 'q-1',
    type_question: 'single',
    type: 'Trắc nghiệm',
    topic: 'Căn bậc hai',
    content: 'Tính căn bậc hai của 16',
    options: ['4', '-4', '16', '2'],
    answer: '4'
  }
]

const mockSendCheatWarning = vi.fn()

vi.mock('@/lib/api', () => ({
  getExamById: vi.fn((id: string) => {
    if (id === 'exam-practice-1') return Promise.resolve(mockExamDataPractice)
    return Promise.resolve(mockExamDataExam)
  }),
  getQuestions: vi.fn(() => Promise.resolve({ data: mockQuestionsData })),
  submitExam: vi.fn(() => Promise.resolve({ status: 'graded' })),
  sendCheatWarning: (...args: any[]) => mockSendCheatWarning(...args),
}))

vi.mock('@/lib/authApi', () => ({
  getUserProfile: vi.fn().mockResolvedValue({ data: { points: 100 } }),
  deductPoints: vi.fn().mockResolvedValue({ points: 90 })
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

describe('ExamTakePage - Practice vs Exam Mode (/exam/[id]/take)', () => {
  let isHidden = false

  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
    isHidden = false
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => isHidden,
    })
  })

  afterEach(() => {
    sessionStorage.clear()
  })

  const triggerVisibilityChange = (hidden: boolean) => {
    act(() => {
      isHidden = hidden
      document.dispatchEvent(new Event('visibilitychange'))
    })
  }

  it('renders practice mode header indicator and relaxes anti-cheat on tab switch', async () => {
    const params = Promise.resolve({ id: 'exam-practice-1' })
    await act(async () => {
      render(
        <Suspense fallback={<div>Loading...</div>}>
          <ExamTakePage params={params} />
        </Suspense>
      )
    })

    // Exam content loaded
    expect(screen.getByText('Đề Luyện Tập Đại Số 9')).toBeInTheDocument()

    // Header indicator for practice mode must be visible
    expect(
      screen.getByText(/Chế độ Luyện tập: Cho phép mở tab bài giảng tra cứu lý thuyết/i)
    ).toBeInTheDocument()

    // Theory reference link should be accessible
    const lectureLink = screen.getByRole('link', { name: /Mở bài giảng tra cứu lý thuyết/i })
    expect(lectureLink).toBeInTheDocument()
    expect(lectureLink).toHaveAttribute('target', '_blank')

    // Simulate student leaving page / switching to a theory lecture tab multiple times
    triggerVisibilityChange(true)
    triggerVisibilityChange(false)
    triggerVisibilityChange(true)
    triggerVisibilityChange(false)

    // Anti-cheat modal should NEVER be shown in practice mode
    expect(screen.queryByText(/Cảnh báo gian lận/i)).not.toBeInTheDocument()
    expect(mockSendCheatWarning).not.toHaveBeenCalled()
  })

  it('renders exam mode header indicator and triggers anti-cheat modal on tab switch', async () => {
    const params = Promise.resolve({ id: 'exam-real-1' })
    await act(async () => {
      render(
        <Suspense fallback={<div>Loading...</div>}>
          <ExamTakePage params={params} />
        </Suspense>
      )
    })

    // Exam content loaded
    expect(screen.getByText('Đề Thi Thử Học Kì 1 Toán 9')).toBeInTheDocument()

    // Header indicator for exam mode must be visible
    expect(
      screen.getByText(/Chế độ Thi thử: Giám sát tập trung, không rời phòng thi/i)
    ).toBeInTheDocument()

    // First violation: student switches tab
    triggerVisibilityChange(true)
    triggerVisibilityChange(false)

    // Level 1 anti-cheat modal should be displayed
    await waitFor(() => {
      expect(screen.getByText('Cảnh báo gian lận (Lần 1)')).toBeInTheDocument()
    })

    // Student acknowledges the warning
    const confirmButton = screen.getByRole('button', { name: /Tôi đã hiểu/i })
    act(() => {
      fireEvent.click(confirmButton)
    })

    // Modal is closed
    expect(screen.queryByText('Cảnh báo gian lận (Lần 1)')).not.toBeInTheDocument()

    // Second violation: student leaves again
    triggerVisibilityChange(true)
    triggerVisibilityChange(false)

    // Level 2 warning modal should be displayed and warning sent
    await waitFor(() => {
      expect(screen.getByText('Cảnh báo gian lận nghiêm trọng (Lần 2)')).toBeInTheDocument()
    })
    expect(mockSendCheatWarning).toHaveBeenCalledWith('exam-real-1', 2)
  })

  it('resets any corrupted cheat count in sessionStorage when loading practice mode', async () => {
    // Simulate corrupted/leftover cheat count in storage
    sessionStorage.setItem('exam_state_exam-practice-1', JSON.stringify({
      cheatCount: 2,
      totalAwayTime: 120000
    }))

    const params = Promise.resolve({ id: 'exam-practice-1' })
    await act(async () => {
      render(
        <Suspense fallback={<div>Loading...</div>}>
          <ExamTakePage params={params} />
        </Suspense>
      )
    })

    await waitFor(() => {
      expect(screen.getByText('Đề Luyện Tập Đại Số 9')).toBeInTheDocument()
    })

    // Should not show cheat warning modal
    expect(screen.queryByText(/Cảnh báo gian lận/i)).not.toBeInTheDocument()
  })
})
