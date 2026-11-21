import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import CookieConsentBanner, { COOKIE_CONSENT_KEY } from './CookieConsentBanner'

describe('CookieConsentBanner Component', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders cookie consent popup for first-time visitors', () => {
    render(<CookieConsentBanner />)

    // Initially not visible before timer
    expect(screen.queryByTestId('cookie-consent-banner')).not.toBeInTheDocument()

    // Advance past entrance delay
    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(screen.getByTestId('cookie-consent-banner')).toBeInTheDocument()
    expect(
      screen.getByText(/Trang web này sử dụng Cookies và các công cụ đo lường để tối ưu trải nghiệm học tập của bạn/i)
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Chính sách bảo mật/i })).toHaveAttribute('href', '/privacy')
    expect(screen.getByRole('button', { name: /Đồng ý/i })).toBeInTheDocument()
  })

  it('saves consent to localStorage and hides popup when clicking [Đồng ý]', () => {
    render(<CookieConsentBanner />)

    act(() => {
      vi.advanceTimersByTime(500)
    })

    const acceptBtn = screen.getByRole('button', { name: /Đồng ý/i })
    fireEvent.click(acceptBtn)

    // Should disappear immediately
    expect(screen.queryByTestId('cookie-consent-banner')).not.toBeInTheDocument()

    // Should be saved in localStorage
    const saved = localStorage.getItem(COOKIE_CONSENT_KEY)
    expect(saved).not.toBeNull()
    const parsed = JSON.parse(saved!)
    expect(parsed.accepted).toBe(true)
  })

  it('does not render if user has already accepted cookies previously', () => {
    localStorage.setItem(
      COOKIE_CONSENT_KEY,
      JSON.stringify({ accepted: true, timestamp: new Date().toISOString() })
    )

    render(<CookieConsentBanner />)

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(screen.queryByTestId('cookie-consent-banner')).not.toBeInTheDocument()
  })
})
