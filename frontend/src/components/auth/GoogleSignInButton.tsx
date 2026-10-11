'use client'

import React, { useEffect, useRef, useState } from 'react'
import { loginWithGoogle } from '@/lib/authApi'
import toast from 'react-hot-toast'

interface GoogleSignInButtonProps {
  onSuccess?: (user: any) => void
  text?: string
  className?: string
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
}: GoogleSignInButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const googleBtnContainerRef = useRef<HTMLDivElement>(null)

  const handleCredentialResponse = async (response: any) => {
    if (!response || !response.credential) {
      toast.error('Không nhận được mã xác thực từ Google')
      return
    }

    setIsLoading(true)
    try {
      const res = await loginWithGoogle(response.credential)
      if (res && res.user) {
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
  }

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''

    // Function to initialize Google GIS
    const initializeGis = () => {
      if (window.google?.accounts?.id && clientId) {
        try {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: handleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
          })

          if (googleBtnContainerRef.current) {
            // Render hidden/native Google button if desired, or use prompt()
            window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
              theme: 'outline',
              size: 'large',
              width: 320,
              text: 'continue_with',
              shape: 'pill',
            })
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
      // Load Google Identity Services script
      const scriptId = 'google-gsi-client'
      if (!document.getElementById(scriptId)) {
        const script = document.createElement('script')
        script.id = scriptId
        script.src = 'https://accounts.google.com/gsi/client'
        script.async = true
        script.defer = true
        script.onload = initializeGis
        document.body.appendChild(script)
      }
    }
  }, [])

  const handleCustomButtonClick = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

    if (window.google?.accounts?.id && clientId) {
      try {
        window.google.accounts.id.prompt()
        return
      } catch (e) {
        console.warn('GIS prompt error, falling back:', e)
      }
    }

    // If client ID is missing or script didn't load in dev/test, warn informatively
    if (!clientId) {
      toast('Hệ thống đang cấu hình Google Client ID. Vui lòng thử lại sau hoặc đăng nhập bằng Email.', {
        icon: 'ℹ️',
      })
    }
  }

  return (
    <div className="w-full flex flex-col items-center">
      {/* Custom Styled Button matching brand design */}
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

      {/* Hidden container where official GIS button can mount if rendered */}
      <div ref={googleBtnContainerRef} className="hidden" aria-hidden="true" />
    </div>
  )
}
