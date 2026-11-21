'use client'

import { useEffect, useRef } from 'react'
import { apiFetch } from '@/lib/api'

interface UseSessionGuardOptions {
  checkIntervalMs?: number // Default: 30,000ms (30 seconds)
  enabled?: boolean
}

/**
 * useSessionGuard actively detects if another device has logged into this account.
 * When a concurrent session replaces the current token, the check will receive a 401
 * with CONCURRENT_SESSION_TERMINATED, immediately kicking the user back to /login.
 */
export function useSessionGuard(options: UseSessionGuardOptions = {}) {
  const { checkIntervalMs = 30000, enabled = true } = options
  const lastCheckTimeRef = useRef<number>(0)

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return

    // Only run if user is logged in
    const userStr = localStorage.getItem('user')
    if (!userStr) return

    const verifySession = async () => {
      // Throttle checks to at least 5 seconds apart
      const now = Date.now()
      if (now - lastCheckTimeRef.current < 5000) return
      lastCheckTimeRef.current = now

      try {
        await apiFetch('/auth/session-check')
      } catch (err: any) {
        // apiFetch already handles redirect on CONCURRENT_SESSION_TERMINATED
      }
    }

    // 1. Initial check after 2 seconds
    const initialTimer = setTimeout(verifySession, 2000)

    // 2. Periodic background heartbeat
    const intervalTimer = setInterval(verifySession, checkIntervalMs)

    // 3. Check immediately when the tab regains focus or visibility
    const handleVisibilityOrFocus = () => {
      if (!document.hidden) {
        verifySession()
      }
    }

    window.addEventListener('focus', handleVisibilityOrFocus)
    document.addEventListener('visibilitychange', handleVisibilityOrFocus)

    return () => {
      clearTimeout(initialTimer)
      clearInterval(intervalTimer)
      window.removeEventListener('focus', handleVisibilityOrFocus)
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus)
    }
  }, [checkIntervalMs, enabled])
}
