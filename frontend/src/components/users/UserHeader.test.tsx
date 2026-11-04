import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import UserHeader from './UserHeader'

describe('UserHeader', () => {
  it('renders header elements and user count', () => {
    render(<UserHeader totalUsers={10} />)
    expect(screen.getAllByText('Quản lý người dùng').length).toBeGreaterThan(0)
    expect(screen.getByText(/Danh sách người dùng/i)).toBeInTheDocument()
    expect(screen.getByText(/10 người dùng/i)).toBeInTheDocument()
  })
})
