import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import GradeLecturesPage from './page'
import * as lectureApi from '@/lib/lectureApi'
import * as api from '@/lib/api'
import { cookies } from 'next/headers'

// Mock next/headers
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}))

// Mock next/navigation
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/lectures/lop/6',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock APIs
vi.mock('@/lib/lectureApi', () => ({
  getLecturesByGrade: vi.fn(),
}))

vi.mock('@/lib/api', () => ({
  getExams: vi.fn(),
  getMyExamResults: vi.fn(),
}))

vi.mock('@/components/lectures/GradeLectureList', () => ({
  GradeLectureList: ({ lectures }: any) => (
    <div data-testid="grade-lecture-list">
      {lectures.map((l: any) => (
        <div key={l.id} data-testid="lecture-item">
          {l.title}
        </div>
      ))}
    </div>
  ),
}))

describe('GradeLecturesPage (/lectures/lop/[grade])', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockImplementation((name: string) => {
        if (name === 'userRole') return { value: 'student' }
        if (name === 'userGrade') return { value: '6' }
        if (name === 'accessToken') return { value: 'mock-token' }
        return undefined
      }),
    } as any)

    vi.mocked(api.getExams).mockResolvedValue([])
    vi.mocked(api.getMyExamResults).mockResolvedValue([])
    vi.mocked(lectureApi.getLecturesByGrade).mockResolvedValue({
      data: [
        { id: 'lec-1', title: 'Bài 1: Tập hợp' },
        { id: 'lec-2', title: 'Bài 2: Phép cộng' },
        { id: 'lec-3', title: 'Bài 3: Phép nhân' },
        { id: 'lec-4', title: 'Bài 4: Lũy thừa' },
        { id: 'lec-5', title: 'Bài 5: Thứ tự thực hiện' },
        { id: 'lec-6', title: 'Bài 6: Chia hết' },
      ],
      currentPage: 1,
      totalPages: 3,
      totalItems: 18,
      startIndex: 1,
      endIndex: 6,
    } as any)
  })

  it('fetches lectures with limit of 6 items per page by default', async () => {
    const pageJSX = await GradeLecturesPage({
      params: Promise.resolve({ grade: '6' }),
      searchParams: Promise.resolve({}),
    })

    render(pageJSX)

    expect(lectureApi.getLecturesByGrade).toHaveBeenCalledWith('6', 1, 6)
    expect(screen.getByText('Danh sách Bài giảng Toán Lớp 6')).toBeInTheDocument()
    expect(screen.getAllByTestId('lecture-item')).toHaveLength(6)
  })

  it('passes requested page number with limit of 6 when page parameter is provided', async () => {
    const pageJSX = await GradeLecturesPage({
      params: Promise.resolve({ grade: '6' }),
      searchParams: Promise.resolve({ page: '2' }),
    })

    render(pageJSX)

    expect(lectureApi.getLecturesByGrade).toHaveBeenCalledWith('6', 2, 6)
  })
})
