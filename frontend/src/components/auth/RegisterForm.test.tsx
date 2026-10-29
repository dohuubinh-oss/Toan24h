import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import RegisterForm from './RegisterForm'
import * as authApi from '@/lib/authApi'

// Mock dependencies
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('./GoogleSignInButton', () => ({
  default: () => <button type="button">Mock Google Sign In</button>,
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
})
