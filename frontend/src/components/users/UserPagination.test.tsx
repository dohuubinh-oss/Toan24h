import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import UserPagination from './UserPagination'

describe('UserPagination', () => {
  it('renders pagination info', () => {
    render(<UserPagination />)
    expect(screen.getByText(/Hiển thị/i)).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
  })
})
