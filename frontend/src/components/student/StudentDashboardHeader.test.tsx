import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import StudentDashboardHeader from './StudentDashboardHeader'
import { mockStudentDashboardData } from '@/data/mockStudentData'

describe('StudentDashboardHeader Component', () => {
  it('renders student greeting and pro badge', () => {
    render(<StudentDashboardHeader user={mockStudentDashboardData.user} />)
    expect(screen.getByText(/Chào mừng trở lại/i)).toBeInTheDocument()
    expect(screen.getAllByText(/PRO/i)[0]).toBeInTheDocument()
  })

  it('renders stats (Level, XP, Chuỗi học)', () => {
    render(<StudentDashboardHeader user={mockStudentDashboardData.user} />)
    expect(screen.getByText(/Cấp độ/i)).toBeInTheDocument()
    expect(screen.getByText(/XP/i)).toBeInTheDocument()
    expect(screen.getByText(/Chuỗi học/i)).toBeInTheDocument()
  })
})
