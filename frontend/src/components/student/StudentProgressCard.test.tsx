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
})
