import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { UserFilter } from './UserFilter'

const mockSetFilter = vi.fn()

vi.mock('@/hooks/useSidebarFilter', () => ({
  useSidebarFilter: () => ({
    currentRole: 'teacher',
    setFilter: mockSetFilter,
    resetFilters: vi.fn(),
  }),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/dashboard/users',
}))

describe('UserFilter Component', () => {
  it('renders standard roles (Học sinh, Giáo viên, Affiliate) and excludes Admin', () => {
    render(<UserFilter />)
    expect(screen.getByText('Vai trò')).toBeInTheDocument()
    expect(screen.getByText('Học sinh')).toBeInTheDocument()
    expect(screen.getByText('Giáo viên')).toBeInTheDocument()
    expect(screen.getByText('Affiliate')).toBeInTheDocument()
    expect(screen.queryByText('Admin')).not.toBeInTheDocument()
  })

  it('handles role selection and toggling', () => {
    render(<UserFilter />)
    const studentRadio = screen.getByLabelText('Học sinh')
    fireEvent.click(studentRadio)
    expect(mockSetFilter).toHaveBeenCalledWith('role', 'student')

    // Click on already selected role ('teacher') triggers toggle
    const teacherRadio = screen.getByLabelText('Giáo viên')
    fireEvent.click(teacherRadio)
    expect(mockSetFilter).toHaveBeenCalledWith('role', 'teacher')
  })
})
