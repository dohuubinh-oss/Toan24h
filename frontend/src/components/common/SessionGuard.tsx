'use client'

import { useSessionGuard } from '@/hooks/useSessionGuard'

/**
 * SessionGuard component mounts globally to monitor single-device concurrent login status.
 * If the user logs in from another device, this tab is promptly kicked out.
 */
export default function SessionGuard() {
  useSessionGuard()
  return null
}
