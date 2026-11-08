import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import RegisterForm from './RegisterForm'
import * as authApi from '@/lib/authApi'

// Mock dependencies
const mockGetSearchParams = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  useSearchParams: () => ({
    get: (key: string) => mockGetSearchParams(key),
  }),
}))

vi.mock('@/components/ui/ToastProvider', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}))

vi.mock('./GoogleSignInButton', () => ({
  default: ({ refCode }: { refCode?: string }) => (
    <button type="button" data-testid="mock-google-btn" data-refcode={refCode || ''}>
      Mock Google Sign In
    </button>
  ),
}))

vi.mock('@/lib/authApi', () => ({
  registerUser: vi.fn(),
}))

describe('RegisterForm Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders all form fields including voucher code input', () => {
    render(<RegisterForm />)

    expect(screen.getByLabelText(/Họ và Tên/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^Mật khẩu/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Xác nhận mật khẩu/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Mã giới thiệu \/ Khuyến mãi/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Nhập mã \(ví dụ: CHAOMUNG1M\)/i)).toBeInTheDocument()
  })

  it('submits form without voucher code when left empty', async () => {
    vi.mocked(authApi.registerUser).mockResolvedValueOnce({ message: 'User registered successfully', id: 'user-1' })

    render(<RegisterForm />)

    fireEvent.change(screen.getByLabelText(/Họ và Tên/i), { target: { value: 'Nguyen Van A' } })
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'nguyenvana@gmail.com' } })
    fireEvent.change(screen.getByLabelText(/^Mật khẩu/i), { target: { value: 'StrongPass123@' } })
    fireEvent.change(screen.getByLabelText(/Xác nhận mật khẩu/i), { target: { value: 'StrongPass123@' } })

    fireEvent.click(screen.getByRole('button', { name: 'Đăng ký' }))

    await waitFor(() => {
      expect(authApi.registerUser).toHaveBeenCalledWith({
        fullName: 'Nguyen Van A',
        email: 'nguyenvana@gmail.com',
        password: 'StrongPass123@',
        voucherCode: undefined,
      })
    })
  })

  it('submits form with voucher code when provided', async () => {
    vi.mocked(authApi.registerUser).mockResolvedValueOnce({
      message: 'User registered successfully',
      id: 'user-2',
      freeMonths: 3,
    })

    render(<RegisterForm />)

    fireEvent.change(screen.getByLabelText(/Họ và Tên/i), { target: { value: 'Tran Thi B' } })
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'tranthib@gmail.com' } })
    fireEvent.change(screen.getByLabelText(/^Mật khẩu/i), { target: { value: 'StrongPass123@' } })
    fireEvent.change(screen.getByLabelText(/Xác nhận mật khẩu/i), { target: { value: 'StrongPass123@' } })
    fireEvent.change(screen.getByPlaceholderText(/Nhập mã \(ví dụ: CHAOMUNG1M\)/i), { target: { value: 'TOANVIP3M' } })

    fireEvent.click(screen.getByRole('button', { name: 'Đăng ký' }))

    await waitFor(() => {
      expect(authApi.registerUser).toHaveBeenCalledWith({
        fullName: 'Tran Thi B',
        email: 'tranthib@gmail.com',
        password: 'StrongPass123@',
        voucherCode: 'TOANVIP3M',
      })
    })
  })

  it('prefills voucherCode input from URL query param ?ref=GT123456', () => {
    mockGetSearchParams.mockImplementation((k: string) => (k === 'ref' ? 'GT123456' : null))

    render(<RegisterForm />)

    const voucherInput = screen.getByPlaceholderText(/Nhập mã \(ví dụ: CHAOMUNG1M\)/i) as HTMLInputElement
    expect(voucherInput.value).toBe('GT123456')
  })

  it('passes refCode prop to GoogleSignInButton when URL has ref param', () => {
    mockGetSearchParams.mockImplementation((k: string) => (k === 'ref' ? 'GT999888' : null))

    render(<RegisterForm />)

    const googleBtn = screen.getByTestId('mock-google-btn')
    expect(googleBtn).toHaveAttribute('data-refcode', 'GT999888')
  })

  it('renders mobile top header and security trust badge', () => {
    render(<RegisterForm />)
    expect(screen.getByText('Toan6789')).toBeInTheDocument()
    expect(screen.getByText('Trang chủ')).toBeInTheDocument()
    expect(screen.getByText(/Bảo mật SSL 256-bit • Dữ liệu học tập được mã hóa an toàn/i)).toBeInTheDocument()
  })

  it('calculates and shows password strength levels', () => {
    render(<RegisterForm />)
    const passwordInput = screen.getByLabelText(/^Mật khẩu/i)

    // Empty - no meter
    expect(screen.queryByTestId('password-strength-meter')).not.toBeInTheDocument()

    // Level 1: Yếu (length >= 6)
    fireEvent.change(passwordInput, { target: { value: 'abcdef' } })
    expect(screen.getByTestId('password-strength-meter')).toBeInTheDocument()
    expect(screen.getByText('Yếu')).toBeInTheDocument()

    // Level 2: Trung bình (length >= 6 + digit)
    fireEvent.change(passwordInput, { target: { value: 'abcdef1' } })
    expect(screen.getByText('Trung bình')).toBeInTheDocument()

    // Level 3: Khá (length >= 6 + upper + lower + digit)
    fireEvent.change(passwordInput, { target: { value: 'Abcdef1' } })
    expect(screen.getByText('Khá')).toBeInTheDocument()

    // Level 4: Rất mạnh (length >= 6 + upper + lower + digit + special)
    fireEvent.change(passwordInput, { target: { value: 'Abcdef1@' } })
    expect(screen.getByText('Rất mạnh')).toBeInTheDocument()
  })
})
