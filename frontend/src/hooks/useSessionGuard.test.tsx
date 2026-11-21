import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useSessionGuard } from './useSessionGuard'
import * as api from '@/lib/api'

vi.mock('@/lib/api', () => ({
  apiFetch: vi.fn(),
}))

describe('useSessionGuard hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-17T12:00:00Z'))
    localStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('does nothing when no user is logged in', () => {
    renderHook(() => useSessionGuard())

    act(() => {
      vi.advanceTimersByTime(35000)
    })

    expect(api.apiFetch).not.toHaveBeenCalled()
  })

  it('calls /auth/session-check periodically when user is logged in', async () => {
    localStorage.setItem('user', JSON.stringify({ id: 'user-1', email: 'test@toan6789.vn' }))
    vi.mocked(api.apiFetch).mockResolvedValue({ status: 'active' })

    renderHook(() => useSessionGuard({ checkIntervalMs: 10000 }))

    // Initial check fires at 2s
    act(() => {
      vi.advanceTimersByTime(2500)
    })

    expect(api.apiFetch).toHaveBeenCalledTimes(1)
    expect(api.apiFetch).toHaveBeenCalledWith('/auth/session-check')

    // Periodic check fires at 10s
    act(() => {
      vi.advanceTimersByTime(10000)
    })

    expect(api.apiFetch).toHaveBeenCalledTimes(2)
  })

  it('triggers session check when window receives focus', async () => {
    localStorage.setItem('user', JSON.stringify({ id: 'user-1', email: 'test@toan6789.vn' }))
    vi.mocked(api.apiFetch).mockResolvedValue({ status: 'active' })

    renderHook(() => useSessionGuard())

    // Advance past initial timer and throttle window
    act(() => {
      vi.advanceTimersByTime(2500)
    })
    expect(api.apiFetch).toHaveBeenCalledTimes(1)

    // Advance system time past 5s throttle
    act(() => {
      vi.setSystemTime(new Date('2026-11-17T12:00:10Z'))
      vi.advanceTimersByTime(6000)
    })

    // Trigger focus event
    act(() => {
      window.dispatchEvent(new Event('focus'))
    })

    expect(api.apiFetch).toHaveBeenCalledTimes(2)
  })
})
