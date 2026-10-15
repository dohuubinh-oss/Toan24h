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

  it('renders avatar initials using first letter of the last word (Vietnamese naming)', () => {
    render(<StudentLeaderboard leaderboard={mockStudentDashboardData.leaderboard} currentUser={mockStudentDashboardData.currentUserRank} />)
    // "Minh Anh" -> 'A', "Hà Phương" -> 'P', "Bạn (Nam)" -> 'N'
    expect(screen.getByText('A')).toBeInTheDocument()
    expect(screen.getByText('P')).toBeInTheDocument()
    expect(screen.getByText('N')).toBeInTheDocument()
  })
})
