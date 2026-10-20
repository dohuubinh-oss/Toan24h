import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import MobileQrUploadModal from './MobileQrUploadModal'
import { apiFetch } from '@/lib/api'

// Mock apiFetch
vi.mock('@/lib/api', () => ({
  apiFetch: vi.fn(),
}))

// Mock Toast
vi.mock('@/components/ui/ToastProvider', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
  }),
}))

describe('MobileQrUploadModal Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders modal with QR code and 10-minute countdown indicator', () => {
    ;(apiFetch as any).mockResolvedValue({ status: 'waiting' })

    render(
      <MobileQrUploadModal
        isOpen={true}
        onClose={vi.fn()}
        onUploadSuccess={vi.fn()}
        sessionId="sess-test-123"
      />
    )

    expect(screen.getByText('Chụp bài làm bằng điện thoại')).toBeInTheDocument()
    expect(screen.getByText(/Mã QR có hiệu lực/i)).toBeInTheDocument()
    expect(screen.getByText('10:00')).toBeInTheDocument()
  })

  it('counts down the timer each second', () => {
    ;(apiFetch as any).mockResolvedValue({ status: 'waiting' })

    render(
      <MobileQrUploadModal
        isOpen={true}
        onClose={vi.fn()}
        onUploadSuccess={vi.fn()}
        sessionId="sess-test-123"
      />
    )

    act(() => {
      vi.advanceTimersByTime(5000) // 5 seconds
    })

    expect(screen.getByText('09:55')).toBeInTheDocument()
  })

  it('displays expired message when session expires', async () => {
    ;(apiFetch as any).mockResolvedValue({ status: 'expired' })

    render(
      <MobileQrUploadModal
        isOpen={true}
        onClose={vi.fn()}
        onUploadSuccess={vi.fn()}
        sessionId="sess-test-123"
      />
    )

    await act(async () => {
      vi.advanceTimersByTime(2000)
    })

    expect(screen.getByText(/Mã QR đã hết hạn bảo mật/i)).toBeInTheDocument()
    expect(screen.getByText('Tạo mã QR mới')).toBeInTheDocument()
  })

  it('allows regenerating QR code after expiration', async () => {
    ;(apiFetch as any).mockResolvedValue({ status: 'expired' })

    render(
      <MobileQrUploadModal
        isOpen={true}
        onClose={vi.fn()}
        onUploadSuccess={vi.fn()}
        sessionId="sess-test-123"
      />
    )

    await act(async () => {
      vi.advanceTimersByTime(2000)
    })

    expect(screen.getByText('Tạo mã QR mới')).toBeInTheDocument()

    // Click recreate
    ;(apiFetch as any).mockResolvedValue({ status: 'waiting' })
    await act(async () => {
      fireEvent.click(screen.getByText('Tạo mã QR mới'))
    })

    expect(screen.getByText('10:00')).toBeInTheDocument()
  })
})
