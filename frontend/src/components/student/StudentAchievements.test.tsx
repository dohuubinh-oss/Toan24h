import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import StudentAchievements from './StudentAchievements'

describe('StudentAchievements Component', () => {
  it('renders achievements title', () => {
    render(<StudentAchievements />)
    expect(screen.getByText(/Thành tích/i)).toBeInTheDocument()
  })

  it('renders achievement cards', () => {
    render(<StudentAchievements />)
    expect(screen.getByText(/Logic Master/i)).toBeInTheDocument()
    expect(screen.getByText(/100 Streak/i)).toBeInTheDocument()
  })
})
