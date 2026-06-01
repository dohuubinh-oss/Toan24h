import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import LoginForm from './LoginForm'

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
}))

import { useRouter } from 'next/navigation'

describe('LoginForm Component', () => {
  it('renders the login form', () => {
    render(<LoginForm />)
    expect(screen.getByRole('heading', { name: /Đăng nhập/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/Họ và Tên/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Số điện thoại hoặc Email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Mật khẩu/i)).toBeInTheDocument()
  })

  it('shows error messages when submitting empty form', async () => {
    render(<LoginForm />)
    const submitBtn = screen.getByRole('button', { name: /Đăng nhập/i })
    
    fireEvent.click(submitBtn)
    
    await waitFor(() => {
      expect(screen.getByText(/Vui lòng nhập họ tên/i)).toBeInTheDocument()
      expect(screen.getByText(/Vui lòng nhập email hoặc số điện thoại/i)).toBeInTheDocument()
      expect(screen.getByText(/Vui lòng nhập mật khẩu/i)).toBeInTheDocument()
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

  it('redirects to student dashboard when identity contains student', async () => {
    const pushMock = vi.fn()
    vi.mocked(useRouter).mockReturnValue({ push: pushMock } as any)
    
    render(<LoginForm />)
    
    fireEvent.change(screen.getByLabelText(/Họ và Tên/i), { target: { value: 'Nam' } })
    fireEvent.change(screen.getByLabelText(/Số điện thoại hoặc Email/i), { target: { value: 'student@mathed.vn' } })
    fireEvent.change(screen.getByLabelText(/Mật khẩu/i), { target: { value: 'password123' } })
    
    fireEvent.click(screen.getByRole('button', { name: /Đăng nhập/i }))
    
    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/student')
    })
  })

  it('redirects to questions dashboard when identity does not contain student', async () => {
    const pushMock = vi.fn()
    vi.mocked(useRouter).mockReturnValue({ push: pushMock } as any)
    
    render(<LoginForm />)
    
    fireEvent.change(screen.getByLabelText(/Họ và Tên/i), { target: { value: 'Admin' } })
    fireEvent.change(screen.getByLabelText(/Số điện thoại hoặc Email/i), { target: { value: 'admin@mathed.vn' } })
    fireEvent.change(screen.getByLabelText(/Mật khẩu/i), { target: { value: 'password123' } })
    
    fireEvent.click(screen.getByRole('button', { name: /Đăng nhập/i }))
    
    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/dashboard/questions')
    })
  })
})
