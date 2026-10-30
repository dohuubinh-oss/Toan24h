import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import GradeExamsPage from './page'
import * as api from '@/lib/api'
import { cookies } from 'next/headers'
import * as navigation from 'next/navigation'

// Mock next/headers
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}))

// Mock next/navigation
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/exams/lop/6',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock API
vi.mock('@/lib/api', () => ({
  getExams: vi.fn(),
  getMyExamResults: vi.fn(),
}))

describe('GradeExamsPage Component (/exams/lop/[grade])', () => {
  const sampleExamsGrade6 = [
    {
      id: 'exam-gk1-1',
      title: 'Đề thi Giữa kì 1 Toán 6 - Đề 1',
      examCode: 'GK1-01',
      type: 'Giữa kì 1',
      grade: '6',
      duration: 60,
      questionIds: ['q1', 'q2'],
    },
    {
      id: 'exam-gk1-2',
      title: 'Đề thi Giữa kì 1 Toán 6 - Đề 2',
      examCode: 'GK1-02',
      type: 'Giữa kì 1',
      grade: '6',
      duration: 60,
      questionIds: ['q1', 'q2', 'q3'],
    },
    {
      id: 'exam-ck1-1',
      title: 'Đề thi Cuối kì 1 Toán 6 - Đề 1',
      examCode: 'CK1-01',
      type: 'Cuối kì 1',
      grade: '6',
      duration: 90,
      questionIds: ['q1', 'q2', 'q3', 'q4'],
    },
    {
      id: 'exam-topic-1',
      title: 'Chuyên đề Số học & Ước số',
      examCode: 'CD-01',
      type: 'Chuyên đề',
      grade: '6',
      duration: 45,
      questionIds: ['q1', 'q2'],
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn((key: string) => {
        if (key === 'userGrade') return { value: '6' }
        if (key === 'userRole') return { value: 'student' }
        if (key === 'accessToken') return { value: 'fake-jwt-token' }
        return undefined
      }),
    } as any)

    vi.mocked(api.getExams).mockResolvedValue(sampleExamsGrade6 as any)
    vi.mocked(api.getMyExamResults).mockResolvedValue([] as any)
  })

  it('fetches exams for the correct grade and renders the page heading', async () => {
    const pageJSX = await GradeExamsPage({
      params: Promise.resolve({ grade: '6' }),
    })
    render(pageJSX)

    expect(api.getExams).toHaveBeenCalledWith({ grade: '6' })
    expect(screen.getByRole('heading', { level: 1, name: /Toán Lớp 6/i })).toBeInTheDocument()
  })

  it('renders exams of current milestone (midterm_1 by default) and shows exam cards', async () => {
    const pageJSX = await GradeExamsPage({
      params: Promise.resolve({ grade: '6' }),
    })
    render(pageJSX)

    // Midterm 1 tab should be active by default when no submissions
    expect(screen.getByText('Đề thi Giữa kì 1 Toán 6 - Đề 1')).toBeInTheDocument()
    expect(screen.getByText('Đề thi Giữa kì 1 Toán 6 - Đề 2')).toBeInTheDocument()
    // CK1 exam should not be displayed under midterm_1 tab
    expect(screen.queryByText('Đề thi Cuối kì 1 Toán 6 - Đề 1')).not.toBeInTheDocument()
  })

  it('switches milestone tab and displays the corresponding exams', async () => {
    const pageJSX = await GradeExamsPage({
      params: Promise.resolve({ grade: '6' }),
    })
    render(pageJSX)

    // Initial state: Midterm 1
    expect(screen.getByText('Đề thi Giữa kì 1 Toán 6 - Đề 1')).toBeInTheDocument()

    // Switch to Cuối kì 1 tab
    const ck1Tab = screen.getByRole('tab', { name: /Cuối kì 1/i })
    fireEvent.click(ck1Tab)

    // Now Cuối kì 1 exam is visible, GK1 exams are hidden
    expect(screen.getByText('Đề thi Cuối kì 1 Toán 6 - Đề 1')).toBeInTheDocument()
    expect(screen.queryByText('Đề thi Giữa kì 1 Toán 6 - Đề 1')).not.toBeInTheDocument()
  })

  it('automatically selects the progressed milestone when student completed prior milestone exams', async () => {
    // Student already finished midterm_1 exam
    vi.mocked(api.getMyExamResults).mockResolvedValueOnce([
      {
        id: 'sub-1',
        examId: 'exam-gk1-1',
        status: 'graded',
        totalScore: 9.5,
      },
    ] as any)

    const pageJSX = await GradeExamsPage({
      params: Promise.resolve({ grade: '6' }),
    })
    render(pageJSX)

    // Milestone progression advances to final_1 (Cuối kì 1)
    expect(screen.getByText('Đề thi Cuối kì 1 Toán 6 - Đề 1')).toBeInTheDocument()
    expect(screen.queryByText('Đề thi Giữa kì 1 Toán 6 - Đề 1')).not.toBeInTheDocument()
  })

  it('redirects student to their registered grade if accessing a different grade', async () => {
    vi.mocked(cookies).mockResolvedValueOnce({
      get: vi.fn((key: string) => {
        if (key === 'userGrade') return { value: '8' }
        if (key === 'userRole') return { value: 'student' }
        return undefined
      }),
    } as any)

    await GradeExamsPage({
      params: Promise.resolve({ grade: '6' }),
    })

    expect(navigation.redirect).toHaveBeenCalledWith('/exams/lop/8')
  })

  it('renders exams table within active tab', async () => {
    const pageJSX = await GradeExamsPage({
      params: Promise.resolve({ grade: '6' }),
    })
    render(pageJSX)

    expect(screen.getByText('Đề thi Giữa kì 1 Toán 6 - Đề 1')).toBeInTheDocument()
    expect(screen.getByText('Đề thi Giữa kì 1 Toán 6 - Đề 2')).toBeInTheDocument()
  })
})
