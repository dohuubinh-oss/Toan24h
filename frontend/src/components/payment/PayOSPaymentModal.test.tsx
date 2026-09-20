import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import PayOSPaymentModal, { PayOSPaymentData } from './PayOSPaymentModal'

const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

vi.mock('@/lib/api', () => ({
  apiFetch: vi.fn().mockResolvedValue([]),
}))

describe('PayOSPaymentModal', () => {
  const sampleData: PayOSPaymentData = {
    transactionId: 'tx-123456',
    orderCode: 1710900000000,
    amount: 450000,
    plan: '3_months',
    planName: 'Gói 3 Tháng',
    accountNumber: '99998888',
    accountName: 'TOAN24H EDUCATION',
    content: 'T24H 1710900000000',
    checkoutUrl: 'https://pay.payos.vn/web/test',
    qrCode: 'https://img.vietqr.io/image/MB-99998888-compact2.png',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <PayOSPaymentModal isOpen={false} onClose={vi.fn()} paymentData={sampleData} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders payment details when open', () => {
    render(
      <PayOSPaymentModal isOpen={true} onClose={vi.fn()} paymentData={sampleData} />
    )
    expect(screen.getByText('Thanh Toán PayOS (VietQR)')).toBeInTheDocument()
    expect(screen.getByText('99998888')).toBeInTheDocument()
    expect(screen.getByText('TOAN24H EDUCATION')).toBeInTheDocument()
    expect(screen.getByText(/450\.000\s*đ/)).toBeInTheDocument()
    expect(screen.getByText('T24H 1710900000000')).toBeInTheDocument()
    expect(screen.getByText('Mở trang thanh toán PayOS')).toBeInTheDocument()
  })

  it('calls onClose when close button clicked', () => {
    const handleClose = vi.fn()
    render(
      <PayOSPaymentModal isOpen={true} onClose={handleClose} paymentData={sampleData} />
    )
    const closeBtn = screen.getByText('Đóng')
    fireEvent.click(closeBtn)
    expect(handleClose).toHaveBeenCalled()
  })
})
