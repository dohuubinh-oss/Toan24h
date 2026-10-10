import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ForgotPasswordForm from './ForgotPasswordForm'
import * as api from '../../lib/api'

const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: mockPush,
  })),
}))

vi.mock('../../lib/api', () => ({
  apiFetch: vi.fn(),
}))

describe('ForgotPasswordForm Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders Step 1 with email input and submit button', () => {
    render(<ForgotPasswordForm />)
    expect(screen.getByRole('heading', { name: /Quên mật khẩu/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/Địa chỉ Email/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Gửi mã khôi phục qua Email/i })).toBeInTheDocument()
  })

  it('validates invalid email on Step 1', async () => {
    render(<ForgotPasswordForm />)
    const emailInput = screen.getByLabelText(/Địa chỉ Email/i)
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
    fireEvent.click(screen.getByRole('button', { name: /Gửi mã khôi phục qua Email/i }))

    await waitFor(() => {
      expect(screen.getByText(/Địa chỉ Email không hợp lệ/i)).toBeInTheDocument()
    })
  })

  it('submits Step 1 and advances to Step 2 upon success', async () => {
    vi.mocked(api.apiFetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Mã OTP đã được gửi đến email của bạn.' }),
    } as any)

    render(<ForgotPasswordForm />)
    const emailInput = screen.getByLabelText(/Địa chỉ Email/i)
    fireEvent.change(emailInput, { target: { value: 'user@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: /Gửi mã khôi phục qua Email/i }))

    await waitFor(() => {
      expect(api.apiFetch).toHaveBeenCalledWith('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: 'user@example.com' }),
      })
      expect(screen.getByText(/Nhập mã xác thực \(OTP\)/i)).toBeInTheDocument()
    })
  })

  it('completes the 3-step recovery flow end-to-end', async () => {
    // 1. Step 1 API mock
    vi.mocked(api.apiFetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Mã OTP đã được gửi đến email của bạn.' }),
    } as any)

    render(<ForgotPasswordForm />)
    fireEvent.change(screen.getByLabelText(/Địa chỉ Email/i), { target: { value: 'user@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: /Gửi mã khôi phục qua Email/i }))

    await waitFor(() => {
      expect(screen.getByText(/Nhập mã xác thực \(OTP\)/i)).toBeInTheDocument()
    })

    // 2. Step 2 OTP verification
    vi.mocked(api.apiFetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'OTP hợp lệ' }),
    } as any)

    const digitInputs = screen.getAllByRole('textbox')
    expect(digitInputs.length).toBe(6)

    // Simulate entering 1 2 3 4 5 6
    for (let i = 0; i < 6; i++) {
      fireEvent.change(digitInputs[i], { target: { value: String(i + 1) } })
    }

    fireEvent.click(screen.getByRole('button', { name: /Xác nhận OTP/i }))

    await waitFor(() => {
      expect(api.apiFetch).toHaveBeenCalledWith('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ email: 'user@example.com', otp: '123456' }),
      })
      expect(screen.getByLabelText(/^Mật khẩu mới$/i)).toBeInTheDocument()
    })

    // 3. Step 3 Set new password
    vi.mocked(api.apiFetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Đổi mật khẩu thành công' }),
    } as any)

    fireEvent.change(screen.getByLabelText(/^Mật khẩu mới$/i), { target: { value: 'newsecret123' } })
    fireEvent.change(screen.getByLabelText(/^Xác nhận mật khẩu mới$/i), { target: { value: 'newsecret123' } })

    fireEvent.click(screen.getByRole('button', { name: /Lưu mật khẩu/i }))

    await waitFor(() => {
      expect(api.apiFetch).toHaveBeenCalledWith('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email: 'user@example.com', otp: '123456', newPassword: 'newsecret123' }),
      })
    })
  })

  it('allows going back to previous step', async () => {
    vi.mocked(api.apiFetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'OTP sent' }),
    } as any)

    render(<ForgotPasswordForm />)
    fireEvent.change(screen.getByLabelText(/Địa chỉ Email/i), { target: { value: 'user@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: /Gửi mã khôi phục qua Email/i }))

    await waitFor(() => {
      expect(screen.getByText(/Nhập mã xác thực \(OTP\)/i)).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /Quay lại/i }))

    await waitFor(() => {
      expect(screen.getByLabelText(/Địa chỉ Email/i)).toBeInTheDocument()
    })
  })
})
