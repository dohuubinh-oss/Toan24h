import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import StudentDashboardPage from './page'
import * as api from '@/lib/api'
import * as authApi from '@/lib/authApi'
import * as lectureApi from '@/lib/lectureApi'
import { cookies } from 'next/headers'

// Mock cookies
vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue(undefined)
  })
}))

describe('StudentDashboardPage Component', () => {
  it('renders main layout components with default database state', async () => {
    vi.spyOn(api, 'getExams').mockResolvedValueOnce([])
    vi.spyOn(api, 'getWeeklyLeaderboard').mockResolvedValueOnce({ leaderboard: [], currentUserRank: null })

    const Page = await StudentDashboardPage()
    render(Page)
    
    // Main column elements
    expect(screen.getByText(/Chào bạn/i)).toBeInTheDocument()
    expect(screen.getByText(/Đang học tiếp/i)).toBeInTheDocument()
    expect(screen.getByText(/Chủ đề toán học/i)).toBeInTheDocument()
    
    // Sidebar elements
    expect(screen.getByText('Bảng xếp hạng')).toBeInTheDocument()
    expect(screen.getByText(/Thành tích/i)).toBeInTheDocument()
    expect(screen.getByText(/Thử thách/i)).toBeInTheDocument()

    // When no competitors in DB, mock users should NOT exist
    expect(screen.queryByText('Minh Anh')).not.toBeInTheDocument()
    expect(screen.queryByText('Hà Phương')).not.toBeInTheDocument()
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

  it('renders real user profile and real leaderboard from database API', async () => {
    vi.mocked(cookies).mockResolvedValueOnce({
      get: vi.fn((key: string) => {
        if (key === 'userGrade') return { value: '9' }
        if (key === 'accessToken') return { value: 'real-user-token' }
        return undefined
      })
    } as any)

    vi.spyOn(authApi, 'getUserProfile').mockResolvedValueOnce({
      data: {
        id: 'usr-123',
        fullName: 'Nguyễn Văn Hoàng',
        grade: '9',
        points: 350,
        expiresAt: new Date(Date.now() + 86400000).toISOString(), // active PRO
        role: 'student',
      }
    } as any)

    vi.spyOn(api, 'getWeeklyLeaderboard').mockResolvedValueOnce({
      leaderboard: [
        { id: 'u1', rank: 1, name: 'Trần Minh Châu', weeklyXp: 850, isCurrentUser: false },
        { id: 'u2', rank: 2, name: 'Lê Quang', weeklyXp: 720, isCurrentUser: false },
      ],
      currentUserRank: {
        id: 'usr-123',
        rank: 3,
        name: 'Nguyễn Văn Hoàng',
        weeklyXp: 350,
        lifetimeXp: 350,
        currentStreak: 5,
        isCurrentUser: true,
      }
    } as any)

    vi.spyOn(lectureApi, 'getLecturesByGrade').mockResolvedValueOnce({
      data: [
        { id: 'lec-1', title: 'Căn bậc hai', category: 'Đại số thực chiến' },
        { id: 'lec-2', title: 'Hệ thức lượng trong tam giác vuông', category: 'Hình học phẳng' },
      ]
    } as any)

    vi.spyOn(api, 'getExams').mockResolvedValueOnce([
      { id: 'exam-1', title: 'Đề thi Khảo sát Toán 9', grade: '9' }
    ] as any)
    vi.spyOn(api, 'getMyExamResults').mockResolvedValueOnce([] as any)

    const Page = await StudentDashboardPage()
    render(Page)

    // User Profile
    expect(screen.getAllByText(/Nguyễn Văn Hoàng/i).length).toBeGreaterThanOrEqual(2)
    expect(screen.getByText('PRO')).toBeInTheDocument()
    expect(screen.getByText('Toán Lớp 9')).toBeInTheDocument()
    expect(screen.getAllByText(/350 XP/i).length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('5 Ngày')).toBeInTheDocument()

    // Real Leaderboard
    expect(screen.getByText('Trần Minh Châu')).toBeInTheDocument()
    expect(screen.getByText('850 XP')).toBeInTheDocument()
    expect(screen.getByText('Lê Quang')).toBeInTheDocument()
    expect(screen.getByText('720 XP')).toBeInTheDocument()

    // Real Topics
    expect(screen.getByText('Đại số thực chiến')).toBeInTheDocument()
    expect(screen.getByText('Hình học phẳng')).toBeInTheDocument()

    // Verify mock data is absent
    expect(screen.queryByText('Minh Anh')).not.toBeInTheDocument()
    expect(screen.queryByText('Hà Phương')).not.toBeInTheDocument()
  })
})
