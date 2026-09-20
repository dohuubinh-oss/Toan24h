import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import HomePricing from './HomePricing'

const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

describe('HomePricing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('renders pricing section', () => {
    render(<HomePricing />)
    expect(screen.getByText('Lựa chọn gói học phù hợp')).toBeInTheDocument()
    expect(screen.getByText('Gói Cơ Bản')).toBeInTheDocument()
    expect(screen.getByText(/Gói Pro/)).toBeInTheDocument()
  })

  it('redirects to /login when unauthenticated user clicks plan button', () => {
    render(<HomePricing />)
    const proBtn = screen.getByText(/Nâng cấp Pro ngay/)
    fireEvent.click(proBtn)
    expect(mockPush).toHaveBeenCalledWith('/login?redirect=/upgrade')
  })

  it('redirects to /upgrade when authenticated user clicks plan button', () => {
    localStorage.setItem('user', JSON.stringify({ id: '123', name: 'Hoc Vien' }))
    render(<HomePricing />)
    const proBtn = screen.getByText(/Nâng cấp Pro ngay/)
    fireEvent.click(proBtn)
    expect(mockPush).toHaveBeenCalledWith('/upgrade')
  })
})
