import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import StudentDashboardPage from './page'
import * as api from '@/lib/api'
import { cookies } from 'next/headers'

// Mock cookies
vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue(undefined)
  })
}))

describe('StudentDashboardPage Component', () => {
  it('renders main layout components', async () => {
    const Page = await StudentDashboardPage()
    render(Page)
    
    // Main column elements
    expect(screen.getByText(/Chào bạn/i)).toBeInTheDocument()
    expect(screen.getByText(/Đang học tiếp/i)).toBeInTheDocument()
    expect(screen.getByText(/Chủ đề toán học/i)).toBeInTheDocument()
    
    // Sidebar elements
    expect(screen.getByText(/Bảng xếp hạng/i)).toBeInTheDocument()
    expect(screen.getByText(/Thành tích/i)).toBeInTheDocument()
    expect(screen.getByText(/Thử thách/i)).toBeInTheDocument()
  })

  it('renders mastery tag when student achieves 9.0 or higher score', async () => {
    vi.mocked(cookies).mockResolvedValueOnce({
      get: vi.fn((key: string) => {
        if (key === 'userGrade') return { value: '8' }
        if (key === 'accessToken') return { value: 'mock-token' }
        return undefined
      })
    } as any)

    vi.spyOn(api, 'getMyExamResults').mockResolvedValueOnce([
      {
        id: 'sub-1',
        examId: 'exam-1',
        status: 'graded',
        totalScore: 10,
        createdAt: new Date().toISOString(),
      }
    ] as any)

    vi.spyOn(api, 'getExams').mockResolvedValueOnce([
      { id: 'exam-1', title: 'Đề thi Khảo sát Toán 8', grade: '8' }
    ] as any)

    const Page = await StudentDashboardPage()
    render(Page)

    expect(screen.getByText('Đã làm chủ')).toBeInTheDocument()
    expect(screen.getByText('Chinh phục đề mới')).toBeInTheDocument()
    expect(screen.getByText(/Xuất sắc! Bạn đạt 10\/10 điểm/i)).toBeInTheDocument()
  })
})
