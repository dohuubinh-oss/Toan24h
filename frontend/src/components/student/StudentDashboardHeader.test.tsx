import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import StudentDashboardHeader from './StudentDashboardHeader'

describe('StudentDashboardHeader Component', () => {
  it('renders student greeting and pro badge', () => {
    render(<StudentDashboardHeader />)
    expect(screen.getByText(/Chào mừng trở lại/i)).toBeInTheDocument()
    expect(screen.getAllByText(/PRO/i)[0]).toBeInTheDocument()
  })

  it('renders stats (Level, XP, Chuỗi học)', () => {
    render(<StudentDashboardHeader />)
    expect(screen.getByText(/Cấp độ/i)).toBeInTheDocument()
    expect(screen.getByText(/XP/i)).toBeInTheDocument()
    expect(screen.getByText(/Chuỗi học/i)).toBeInTheDocument()
  })
})
