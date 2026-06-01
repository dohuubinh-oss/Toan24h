import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import UsersPage from './page'

vi.mock('@/components/users/UserFilters', () => ({
  default: () => <div data-testid="user-filters">Filters</div>
}))
vi.mock('@/components/users/UserHeader', () => ({
  default: () => <div data-testid="user-header">Header</div>
}))
vi.mock('@/components/users/UserTable', () => ({
  default: () => <div data-testid="user-table">Table</div>
}))
vi.mock('@/components/users/UserPagination', () => ({
  default: () => <div data-testid="user-pagination">Pagination</div>
}))

describe('UsersPage', () => {
  it('renders all sections', () => {
    render(<UsersPage />)
    expect(screen.getByTestId('user-filters')).toBeInTheDocument()
    expect(screen.getByTestId('user-header')).toBeInTheDocument()
    expect(screen.getByTestId('user-table')).toBeInTheDocument()
    expect(screen.getByTestId('user-pagination')).toBeInTheDocument()
  })
})
