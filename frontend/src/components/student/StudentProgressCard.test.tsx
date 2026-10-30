import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import StudentProgressCard from './StudentProgressCard'
import { mockStudentDashboardData } from '@/data/mockStudentData'

describe('StudentProgressCard Component', () => {
  it('renders progress card details', () => {
    render(<StudentProgressCard progress={mockStudentDashboardData.progress} />)
    expect(screen.getByText(/Đang học tiếp/i)).toBeInTheDocument()
    expect(screen.getByText(/Phương trình bậc hai/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Học tiếp ngay/i })).toBeInTheDocument()
  })

  it('renders progress bar', () => {
    render(<StudentProgressCard progress={mockStudentDashboardData.progress} />)
    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toBeInTheDocument()
  })

  it('renders milestone tracker when provided', () => {
    render(<StudentProgressCard progress={mockStudentDashboardData.progress} />)
    expect(screen.getByText(/Chặng mục tiêu: Ôn thi Giữa kì 1/i)).toBeInTheDocument()
    expect(screen.getByText(/Hoàn thành 4\/6 bài học • 1\/2 đề thi thử/i)).toBeInTheDocument()
  })
})
