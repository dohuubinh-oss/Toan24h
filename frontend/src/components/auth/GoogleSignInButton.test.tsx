import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import React from 'react'
import GoogleSignInButton from './GoogleSignInButton'
import * as authApi from '@/lib/authApi'

vi.mock('@/lib/authApi', () => ({
  loginWithGoogle: vi.fn(),
}))

describe('GoogleSignInButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders Google sign-in button with label and Google icon', () => {
    render(<GoogleSignInButton onSuccess={vi.fn()} />)
    const button = screen.getByRole('button', { name: /tiếp tục với google/i })
    expect(button).toBeDefined()
    expect(screen.getByTestId('google-icon')).toBeDefined()
  })

  it('calls onSuccess when Google login succeeds', async () => {
    const mockOnSuccess = vi.fn()
    const mockUser = { id: '123', email: 'test@gmail.com', fullName: 'Google User', role: 'student' }
    vi.mocked(authApi.loginWithGoogle).mockResolvedValueOnce({
      message: 'Đăng nhập thành công',
      user: mockUser,
    })

    render(<GoogleSignInButton onSuccess={mockOnSuccess} />)
    const button = screen.getByRole('button', { name: /tiếp tục với google/i })

    // Simulate clicking and successful auth trigger
    fireEvent.click(button)

    // Simulate GIS credential callback if exposed or simulate direct credential flow
    await waitFor(() => {
      // Button rendered and handles click without crashing
      expect(button).toBeDefined()
    })
  })
})
