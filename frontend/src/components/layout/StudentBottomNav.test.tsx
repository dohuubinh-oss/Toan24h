import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import StudentBottomNav from './StudentBottomNav'

vi.mock('next/navigation', () => ({
  usePathname: () => '/student',
}))

describe('StudentBottomNav Component', () => {
  it('renders 3 core mobile navigation items and excludes leaderboard', () => {
    render(<StudentBottomNav />)
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Bài giảng')).toBeInTheDocument()
    expect(screen.getByText('Đề thi')).toBeInTheDocument()
    expect(screen.queryByText('Xếp hạng')).not.toBeInTheDocument()

    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(3)
    links.forEach((link) => {
      expect(link.className).toContain('min-h-[44px]')
      expect(link).not.toHaveAttribute('href', '/leaderboard')
    })
  })
})
