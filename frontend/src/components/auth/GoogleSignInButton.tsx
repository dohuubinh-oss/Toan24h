'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { loginWithGoogle } from '@/lib/authApi'
import { toast } from '@/components/ui/ToastProvider'

interface GoogleSignInButtonProps {
  onSuccess?: (user: any) => void
  text?: string
  className?: string
  refCode?: string
}

declare global {
  interface Window {
    google?: any
  }
}

export default function GoogleSignInButton({
  onSuccess,
  text = 'Tiếp tục với Google',
  className = '',
  refCode,
}: GoogleSignInButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isGisLoaded, setIsGisLoaded] = useState(false)
  const googleBtnRef = useRef<HTMLDivElement>(null)
  const refCodeRef = useRef(refCode)

  useEffect(() => {
    refCodeRef.current = refCode
  }, [refCode])

  const handleCredentialResponse = useCallback(async (response: any) => {
    if (!response || !response.credential) {
      toast.error('Không nhận được mã xác thực từ Google')
      return
    }

    setIsLoading(true)
    try {
      const res = await loginWithGoogle(response.credential, refCodeRef.current)
      if (res && res.user) {
        if (res.freeMonths && res.freeMonths > 0) {
          if (typeof window !== 'undefined') {
            localStorage.setItem('promo_reward_months', String(res.freeMonths))
          }
        }
        toast.success(`Đăng nhập Google thành công! Xin chào ${res.user.fullName || 'bạn'}`)
        if (onSuccess) {
          onSuccess(res.user)
        } else {
          setTimeout(() => {
            if (res.user.role === 'admin' || res.user.role === 'teacher') {
              window.location.href = '/dashboard/lectures'
            } else {
              window.location.href = '/lectures'
            }
          }, 400)
        }
      }
    } catch (err: any) {
      const msg = err?.message || 'Đăng nhập với Google thất bại. Vui lòng thử lại.'
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }, [onSuccess])

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''
    if (!clientId) return

    let isMounted = true

    // Function to initialize Google GIS and render official button
    const initializeGis = () => {
      if (!isMounted) return
      if (window.google?.accounts?.id && clientId) {
        try {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: handleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
          })

          if (googleBtnRef.current) {
            googleBtnRef.current.innerHTML = ''
            const containerWidth = Math.min(Math.max(googleBtnRef.current.offsetWidth || 380, 200), 400)
            window.google.accounts.id.renderButton(googleBtnRef.current, {
              type: 'standard',
              theme: 'outline',
              size: 'large',
              text: 'continue_with',
              shape: 'rectangular',
              logo_alignment: 'left',
              width: containerWidth,
              locale: 'vi',
            })
            setIsGisLoaded(true)
          }
        } catch (e) {
          console.error('Failed to initialize Google Sign-In:', e)
        }
      }
    }

    // Check if script is already loaded
    if (window.google?.accounts?.id) {
      initializeGis()
    } else {
      const scriptId = 'google-gsi-client'
      let script = document.getElementById(scriptId) as HTMLScriptElement
      if (!script) {
        script = document.createElement('script')
        script.id = scriptId
        script.src = 'https://accounts.google.com/gsi/client'
        script.async = true
        script.defer = true
        script.onload = initializeGis
        document.body.appendChild(script)
      } else {
        script.addEventListener('load', initializeGis)
      }
    }

    return () => {
      isMounted = false
      if (window.google?.accounts?.id?.cancel) {
        try {
          window.google.accounts.id.cancel()
        } catch {
          // ignore cleanup errors on unmount
        }
      }
    }
  }, [handleCredentialResponse])

  const handleCustomButtonClick = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

    if (!clientId) {
      toast('Hệ thống đang cấu hình Google Client ID. Vui lòng thử lại sau hoặc đăng nhập bằng Email.', {
        icon: 'ℹ️',
      })
      return
    }

    if (window.google?.accounts?.id) {
      try {
        if (googleBtnRef.current) {
          googleBtnRef.current.innerHTML = ''
          window.google.accounts.id.renderButton(googleBtnRef.current, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text: 'continue_with',
            shape: 'rectangular',
            logo_alignment: 'left',
            width: Math.min(Math.max(googleBtnRef.current.offsetWidth || 380, 200), 400),
            locale: 'vi',
          })
          setIsGisLoaded(true)
        }
        window.google.accounts.id.prompt((notification: any) => {
          if (notification?.isNotDisplayed?.() || notification?.isSkippedMoment?.()) {
            console.debug('GIS prompt notification:', notification.getNotDisplayedReason?.())
          }
        })
      } catch (e) {
        console.warn('GIS prompt error:', e)
      }
    }
  }

  return (
    <div className="w-full flex flex-col items-center">
      {/* Container for Google's official rendered button */}
      <div
        ref={googleBtnRef}
        className={`w-full flex justify-center ${isGisLoaded ? 'min-h-[44px]' : 'hidden'} ${className}`}
      />

      {/* Fallback custom button (shown when GIS is loading or in test environments) */}
      {!isGisLoaded && (
        <button
          type="button"
          onClick={handleCustomButtonClick}
          disabled={isLoading}
          className={`w-full flex items-center justify-center gap-3 px-4 py-3 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-medium shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 ${className}`}
        >
          <svg
            data-testid="google-icon"
            className="w-5 h-5 shrink-0"
            viewBox="0 0 24 24"
          >
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>{isLoading ? 'Đang xác thực...' : text}</span>
        </button>
      )}
    </div>
  )
}
