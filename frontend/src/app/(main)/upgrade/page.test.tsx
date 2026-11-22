import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import UpgradePage from './page'
import * as api from '@/lib/api'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

vi.mock('@/components/ui/ToastProvider', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
  },
}))

vi.mock('@/lib/api', () => ({
  apiFetch: vi.fn(),
}))

describe('UpgradePage Component (Terms & Legal Compliance)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.setItem('user', JSON.stringify({ id: 'user-123', email: 'test@toan6789.vn' }))
  })

  it('renders terms and refund policy checkbox and education tax disclaimer', () => {
    render(<UpgradePage />)

    // Terms checkbox should be present and unticked by default
    const checkbox = screen.getByRole('checkbox', {
      name: /Tôi đã đọc, hiểu và đồng ý với/i,
    }) as HTMLInputElement
    expect(checkbox).toBeInTheDocument()
    expect(checkbox.checked).toBe(false)

    // Link to /terms should be present
    const termsLink = screen.getByRole('link', { name: /^Điều khoản dịch vụ$/i })
    expect(termsLink).toHaveAttribute('href', '/terms')

    // Helper prompt message is visible
    expect(screen.getByText(/\* Vui lòng tích chọn ô trên để mở khóa nút thanh toán\./i)).toBeInTheDocument()

    // Tax policy note & link to terms
    const taxPolicyLink = screen.getByRole('link', {
      name: /Xem chi tiết Chính sách định danh dịch vụ & Hóa đơn học phí/i,
    })
    expect(taxPolicyLink).toBeInTheDocument()
    expect(taxPolicyLink).toHaveAttribute('href', '/terms#dieu-5')
  })

  it('disables payment buttons when terms consent checkbox is unticked', () => {
    render(<UpgradePage />)

    const paymentButtons = screen.getAllByRole('button', { name: /Thanh toán VietQR/i })
    expect(paymentButtons.length).toBe(4)

    // All 4 payment buttons should be disabled
    paymentButtons.forEach((btn) => {
      expect(btn).toBeDisabled()
    })
  })

  it('enables payment buttons when terms consent is checked, and calls apiFetch with termsAgreedAt', async () => {
    vi.mocked(api.apiFetch).mockResolvedValueOnce({
      transactionId: 'tx-123',
      orderCode: 987654321,
      amount: 450000,
      plan: '3_months',
      qrCode: 'vietqr://mock-qr',
    })

    render(<UpgradePage />)

    const checkbox = screen.getByRole('checkbox', {
      name: /Tôi đã đọc, hiểu và đồng ý với/i,
    })
    const paymentButtons = screen.getAllByRole('button', { name: /Thanh toán VietQR/i })

    // Check the box
    fireEvent.click(checkbox)

    // Helper text should disappear
    expect(screen.queryByText(/\* Vui lòng tích chọn ô trên để mở khóa nút thanh toán\./i)).not.toBeInTheDocument()

    // Buttons should now be enabled
    expect(paymentButtons[1]).not.toBeDisabled()

    // Click 3_months plan payment button
    fireEvent.click(paymentButtons[1])

    await waitFor(() => {
      expect(api.apiFetch).toHaveBeenCalledWith('/payments/create', {
        method: 'POST',
        body: expect.stringContaining('"termsAgreedAt"'),
      })
    })

    const callBody = JSON.parse(vi.mocked(api.apiFetch).mock.calls[0][1]?.body as string)
    expect(callBody.plan).toBe('3_months')
    expect(callBody.termsAgreedAt).toBeDefined()
  })

  it('renders footer with copyright and essential links', () => {
    render(<UpgradePage />)
    expect(screen.getByText(/© 2026 toan6789\.vn/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Về chúng tôi/i })).toBeInTheDocument()
  })
})
