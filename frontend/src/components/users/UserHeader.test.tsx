import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import UserHeader from './UserHeader'

describe('UserHeader', () => {
  it('renders header elements', () => {
    render(<UserHeader />)
    expect(screen.getAllByText('Quản lý người dùng').length).toBeGreaterThan(0)
    expect(screen.getByPlaceholderText(/Tìm kiếm/i)).toBeInTheDocument()
    expect(screen.getByText('Thêm người dùng mới')).toBeInTheDocument()
  })
})
