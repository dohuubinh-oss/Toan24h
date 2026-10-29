import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import VerifyEmailPage from './page';
import * as authApi from '@/lib/authApi';

vi.mock('@/lib/authApi', () => ({
  verifyEmail: vi.fn(),
  resendVerification: vi.fn(),
}));

// Mock useSearchParams
const mockGet = vi.fn();
vi.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: mockGet,
  }),
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe('VerifyEmailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays error if no token is provided in URL', () => {
    mockGet.mockReturnValue(null);
    render(<VerifyEmailPage />);

    expect(screen.getByText(/Không tìm thấy mã kích hoạt/i)).toBeInTheDocument();
  });

  it('shows success message when token verification succeeds', async () => {
    mockGet.mockReturnValue('valid-token-123');
    vi.mocked(authApi.verifyEmail).mockResolvedValueOnce({
      message: 'Kích hoạt tài khoản thành công',
      email: 'student@example.com',
    });

    render(<VerifyEmailPage />);

    await waitFor(() => {
      expect(screen.getByText(/Kích hoạt tài khoản thành công/i)).toBeInTheDocument();
    });
    expect(screen.getByRole('link', { name: /Đăng nhập ngay/i })).toHaveAttribute(
      'href',
      '/login'
    );
  });

  it('shows error state and resend form when token verification fails', async () => {
    mockGet.mockReturnValue('expired-token');
    vi.mocked(authApi.verifyEmail).mockRejectedValueOnce(
      new Error('Mã kích hoạt đã hết hạn')
    );

    render(<VerifyEmailPage />);

    await waitFor(() => {
      expect(screen.getByText(/Kích hoạt không thành công/i)).toBeInTheDocument();
    });
    expect(screen.getByPlaceholderText(/Nhập email của bạn/i)).toBeInTheDocument();
  });
});
