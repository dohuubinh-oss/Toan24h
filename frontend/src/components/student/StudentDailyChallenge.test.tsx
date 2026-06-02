import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import StudentDailyChallenge from './StudentDailyChallenge'
import { mockStudentDashboardData } from '@/data/mockStudentData'

describe('StudentDailyChallenge Component', () => {
  it('renders daily challenge details', () => {
    render(<StudentDailyChallenge challenge={mockStudentDashboardData.dailyChallenge} />)
    expect(screen.getByText(/Thử thách hàng ngày/i)).toBeInTheDocument()
    expect(screen.getByText(/Hoàn thành 3 bài kiểm tra/i)).toBeInTheDocument()
  })

  it('renders progress text', () => {
    render(<StudentDailyChallenge challenge={mockStudentDashboardData.dailyChallenge} />)
    expect(screen.getByText(/1\/3/i)).toBeInTheDocument()
  })
})
