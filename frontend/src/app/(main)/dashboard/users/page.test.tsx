import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import UsersPage from './page'

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn((key: string) => (key === 'page' ? '1' : '')),
    toString: () => '',
  }),
}))

vi.mock('@/components/users/UserFilters', () => ({
  default: () => <div data-testid="user-filters">Filters</div>
}))
vi.mock('@/components/users/UserHeader', () => ({
  default: () => <div data-testid="user-header">Header</div>
}))
vi.mock('@/components/users/UserTable', () => ({
  default: () => <div data-testid="user-table">Table</div>
}))
vi.mock('@/components/ui/Pagination', () => ({
  Pagination: () => <div data-testid="user-pagination">Pagination</div>
}))
vi.mock('@/lib/api', () => ({
  apiFetch: vi.fn().mockResolvedValue([]),
}))

describe('UsersPage', () => {
  it('renders all sections', async () => {
    render(<UsersPage />)
    expect(screen.getByTestId('user-header')).toBeInTheDocument()
    expect(await screen.findByTestId('user-table')).toBeInTheDocument()
  })
})
