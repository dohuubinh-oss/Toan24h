import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import LoginForm from './LoginForm'
import * as authApi from '@/lib/authApi'

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
}))

vi.mock('@/lib/authApi', () => ({
  login: vi.fn(),
}))

describe('LoginForm Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the login form', () => {
    render(<LoginForm />)
    expect(screen.getByRole('heading', { name: /Đăng nhập/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/^Email$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Mật khẩu/i)).toBeInTheDocument()
  })

  it('shows error messages when submitting empty form', async () => {
    render(<LoginForm />)
    const submitBtn = screen.getByRole('button', { name: /^Đăng nhập$/i })
    
    fireEvent.click(submitBtn)
    
    await waitFor(() => {
      expect(screen.getByText(/Vui lòng nhập địa chỉ email/i)).toBeInTheDocument()
      expect(screen.getByText(/Vui lòng nhập mật khẩu/i)).toBeInTheDocument()
    })
  })

  it('validates invalid email format', async () => {
    render(<LoginForm />)
    const emailInput = screen.getByLabelText(/^Email$/i)
    fireEvent.change(emailInput, { target: { value: 'invalid-email-format' } })
    fireEvent.click(screen.getByRole('button', { name: /^Đăng nhập$/i }))

    await waitFor(() => {
      expect(screen.getByText(/Địa chỉ email không hợp lệ/i)).toBeInTheDocument()
    })
  })

  it('toggles password visibility', () => {
    render(<LoginForm />)
    const passwordInput = screen.getByLabelText(/Mật khẩu/i)
    const toggleBtn = screen.getByTestId('toggle-password')
    
    expect(passwordInput).toHaveAttribute('type', 'password')
    
    fireEvent.click(toggleBtn)
    expect(passwordInput).toHaveAttribute('type', 'text')
    
    fireEvent.click(toggleBtn)
    expect(passwordInput).toHaveAttribute('type', 'password')
  })

  it('redirects to lectures and sets cookies when identity contains student', async () => {
    vi.mocked(authApi.login).mockResolvedValue({
      user: { role: 'student', grade: 8 }
    } as any)
    
    render(<LoginForm />)
    
    fireEvent.change(screen.getByLabelText(/^Email$/i), { target: { value: 'student@mathed.vn' } })
    fireEvent.change(screen.getByLabelText(/Mật khẩu/i), { target: { value: 'password123' } })
    
    fireEvent.click(screen.getByRole('button', { name: /^Đăng nhập$/i }))
    
    await waitFor(() => {
      expect(authApi.login).toHaveBeenCalledWith({
        email: 'student@mathed.vn',
        password: 'password123',
      })
      expect(document.cookie).toContain('userRole=student')
    })
  })

  it('redirects to dashboard/lectures and sets cookies when identity does not contain student', async () => {
    vi.mocked(authApi.login).mockResolvedValue({
      user: { role: 'teacher', grade: 0 }
    } as any)
    
    render(<LoginForm />)
    
    fireEvent.change(screen.getByLabelText(/^Email$/i), { target: { value: 'admin@mathed.vn' } })
    fireEvent.change(screen.getByLabelText(/Mật khẩu/i), { target: { value: 'password123' } })
    
    fireEvent.click(screen.getByRole('button', { name: /^Đăng nhập$/i }))
    
    await waitFor(() => {
      expect(authApi.login).toHaveBeenCalledWith({
        email: 'admin@mathed.vn',
        password: 'password123',
      })
      expect(document.cookie).toContain('userRole=teacher')
    })
  })

  it('renders Google sign-in button and does not render Telegram widget', () => {
    render(<LoginForm />)
    expect(screen.getByRole('button', { name: /tiếp tục với google/i })).toBeInTheDocument()
    expect(screen.queryByTestId('telegram-login-widget')).not.toBeInTheDocument()
  })
})

