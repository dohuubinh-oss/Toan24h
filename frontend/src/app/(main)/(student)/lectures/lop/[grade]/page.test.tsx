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
  GradeLectureList: ({ lectures, allLectures }: any) => (
    <div data-testid="grade-lecture-list" data-total-all={allLectures?.length}>
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

    // 12 sample lectures
    const mockData = Array.from({ length: 12 }).map((_, i) => ({
      id: `lec-${i + 1}`,
      title: `Bài ${i + 1}: Nội dung toán ${i + 1}`,
      chapter: i < 7 ? 'Tập hợp số tự nhiên' : 'Tính chất chia hết',
    }))

    vi.mocked(lectureApi.getLecturesByGrade).mockResolvedValue({
      data: mockData,
      currentPage: 1,
      totalPages: 1,
      totalItems: 12,
      startIndex: 1,
      endIndex: 12,
    } as any)
  })

  it('fetches all grade lectures and slices 6 items for page 1 with full curriculum passed to sidebar', async () => {
    const pageJSX = await GradeLecturesPage({
      params: Promise.resolve({ grade: '6' }),
      searchParams: Promise.resolve({}),
    })

    render(pageJSX)

    expect(lectureApi.getLecturesByGrade).toHaveBeenCalledWith('6', 1, 100, 'mock-token')
    expect(screen.getByText('Danh sách Bài giảng Toán Lớp 6')).toBeInTheDocument()
    expect(screen.getAllByTestId('lecture-item')).toHaveLength(6)
    expect(screen.getByTestId('grade-lecture-list')).toHaveAttribute('data-total-all', '12')
    expect(screen.getByText('Bài 1: Nội dung toán 1')).toBeInTheDocument()
    expect(screen.getByText('Bài 6: Nội dung toán 6')).toBeInTheDocument()
  })

  it('slices items 7 to 12 when page 2 is requested', async () => {
    const pageJSX = await GradeLecturesPage({
      params: Promise.resolve({ grade: '6' }),
      searchParams: Promise.resolve({ page: '2' }),
    })

    render(pageJSX)

    expect(screen.getAllByTestId('lecture-item')).toHaveLength(6)
    expect(screen.getByText('Bài 7: Nội dung toán 7')).toBeInTheDocument()
    expect(screen.getByText('Bài 12: Nội dung toán 12')).toBeInTheDocument()
  })
})
