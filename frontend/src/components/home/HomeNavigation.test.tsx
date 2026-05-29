import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import HomeNavigation from './HomeNavigation'

describe('HomeNavigation', () => {
  it('renders logo and links', () => {
    render(<HomeNavigation />)
    expect(screen.getByText(/Math/i)).toBeInTheDocument()
    expect(screen.getByText(/AI/i)).toBeInTheDocument()
    expect(screen.getByText('Tính năng')).toBeInTheDocument()
    expect(screen.getByText('Đăng nhập')).toBeInTheDocument()
    expect(screen.getByText('Học ngay')).toBeInTheDocument()
  })
})
