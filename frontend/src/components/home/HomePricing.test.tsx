import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import HomePricing from './HomePricing'
import * as api from '@/lib/api'
import { toast } from 'react-hot-toast'

const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: mockPush,
  })),
}))

vi.mock('@/lib/api', () => ({
  apiFetch: vi.fn(),
}))

vi.mock('react-hot-toast', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    loading: vi.fn(),
  },
}))

describe('HomePricing Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('renders the 2 pricing options correctly', () => {
    render(<HomePricing />)
    expect(screen.getByRole('heading', { name: /Chọn Gói Học Phù Hợp Với Bạn/i })).toBeInTheDocument()
    expect(screen.getByText('Gói 3 Tháng')).toBeInTheDocument()
    expect(screen.getByText('Gói 1 Năm')).toBeInTheDocument()
    expect(screen.getByText('PHỔ BIẾN NHẤT')).toBeInTheDocument()
    expect(screen.getByText('TIẾT KIỆM NHẤT')).toBeInTheDocument()
    expect(screen.getByText('450.000đ')).toBeInTheDocument()
    expect(screen.getByText('1.200.000đ')).toBeInTheDocument()
  })

  it('prompts user to log in if not logged in when clicking payment button', () => {
    render(<HomePricing />)
    const buttons = screen.getAllByRole('button', { name: /Tạo mã thanh toán PayOS/i })
    fireEvent.click(buttons[0])

    expect(toast.error).toHaveBeenCalledWith('Vui lòng đăng nhập để nâng cấp gói học')
    expect(mockPush).toHaveBeenCalledWith('/login?redirect=/upgrade')
  })

  it('initiates payment creation if user is logged in', async () => {
    localStorage.setItem('user', JSON.stringify({ id: 'user-1', name: 'Test User' }))
    vi.mocked(api.apiFetch).mockResolvedValueOnce({
      transactionId: 'tx-123',
      orderCode: 9999,
      amount: 450000,
      plan: '3_months',
      accountNumber: '1234567890',
      accountName: 'TOAN24H EDUCATION',
    } as any)

    render(<HomePricing />)
    const buttons = screen.getAllByRole('button', { name: /Tạo mã thanh toán PayOS/i })
    fireEvent.click(buttons[0])

    await waitFor(() => {
      expect(api.apiFetch).toHaveBeenCalledWith('/payments/create', {
        method: 'POST',
        body: JSON.stringify({ plan: '3_months' }),
      })
    })
  })
})
