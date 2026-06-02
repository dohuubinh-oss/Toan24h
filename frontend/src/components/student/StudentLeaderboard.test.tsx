import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import StudentLeaderboard from './StudentLeaderboard'
import { mockStudentDashboardData } from '@/data/mockStudentData'

describe('StudentLeaderboard Component', () => {
  it('renders leaderboard title', () => {
    render(<StudentLeaderboard leaderboard={mockStudentDashboardData.leaderboard} currentUser={mockStudentDashboardData.currentUserRank} />)
    expect(screen.getByText(/Bảng xếp hạng/i)).toBeInTheDocument()
  })

  it('renders top students', () => {
    render(<StudentLeaderboard leaderboard={mockStudentDashboardData.leaderboard} currentUser={mockStudentDashboardData.currentUserRank} />)
    expect(screen.getByText(/Minh Anh/i)).toBeInTheDocument()
    expect(screen.getAllByText(/Bạn/i)[0]).toBeInTheDocument()
  })
})
