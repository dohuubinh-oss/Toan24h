import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import GradeSelectionModal from './GradeSelectionModal'
import * as authApi from '@/lib/authApi'

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
}))

vi.mock('@/lib/authApi', () => ({
  updateGrade: vi.fn(),
}))

describe('GradeSelectionModal Component', () => {
  beforeEach(() => {
    // Clear cookies
    document.cookie = 'userRole=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
    document.cookie = 'userGrade=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
    vi.clearAllMocks()
  })

  it('does NOT render modal for admin role', () => {
    document.cookie = 'userRole=admin; path=/;'
    render(<GradeSelectionModal />)
    expect(screen.queryByText(/Chào mừng bạn!/i)).not.toBeInTheDocument()
  })

  it('does NOT render modal for teacher role', () => {
    document.cookie = 'userRole=teacher; path=/;'
    render(<GradeSelectionModal />)
    expect(screen.queryByText(/Chào mừng bạn!/i)).not.toBeInTheDocument()
  })

  it('does NOT render modal for student role if grade is already set', () => {
    document.cookie = 'userRole=student; path=/;'
    document.cookie = 'userGrade=9; path=/;'
    render(<GradeSelectionModal />)
    expect(screen.queryByText(/Chào mừng bạn!/i)).not.toBeInTheDocument()
  })

  it('renders modal for student role when grade is missing', () => {
    document.cookie = 'userRole=student; path=/;'
    render(<GradeSelectionModal />)
    expect(screen.getByText(/Chào mừng bạn!/i)).toBeInTheDocument()
    expect(screen.getByText(/Vui lòng chọn khối lớp của bạn/i)).toBeInTheDocument()
  })

  it('calls updateGrade and updates cookies when student selects grade and submits', async () => {
    document.cookie = 'userRole=student; path=/;'
    vi.mocked(authApi.updateGrade).mockResolvedValue({ message: 'Success', grade: '9' } as any)
    
    // Mock window.location
    const originalLocation = window.location
    delete (window as any).location
    window.location = { ...originalLocation, href: '' } as any

    render(<GradeSelectionModal />)

    const grade9Btn = screen.getByRole('button', { name: /Khối 9/i })
    fireEvent.click(grade9Btn)

    const submitBtn = screen.getByRole('button', { name: /Bắt đầu học ngay/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(authApi.updateGrade).toHaveBeenCalledWith('9')
      expect(document.cookie).toContain('userGrade=9')
    })

    ;(window as any).location = originalLocation
  })
})
