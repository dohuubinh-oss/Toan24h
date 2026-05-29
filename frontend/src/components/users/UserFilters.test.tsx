import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import UserFilters from './UserFilters'

describe('UserFilters', () => {
  it('renders filter sections', () => {
    render(<UserFilters />)
    expect(screen.getByText('Vai trò')).toBeInTheDocument()
    expect(screen.getByText('Khối lớp')).toBeInTheDocument()
    expect(screen.getByText('Tất cả vai trò')).toBeInTheDocument()
    expect(screen.getByText('Lớp 1-5')).toBeInTheDocument()
    expect(screen.getByText('Xóa bộ lọc')).toBeInTheDocument()
  })
})
