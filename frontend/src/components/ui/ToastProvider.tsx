'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode, useRef } from 'react'
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info, Loader2 } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export type ToastContent = ReactNode | ((t: { id: string }) => ReactNode)

export interface ToastOptions {
  type?: ToastType
  duration?: number
  id?: string
  icon?: ReactNode | string
}

export interface ToastMessage {
  id: string
  type: ToastType
  content: ToastContent
  icon?: ReactNode | string
  duration?: number
}

export interface ToastMethods {
  success: (msg: ToastContent, options?: ToastOptions) => string
  error: (msg: ToastContent, options?: ToastOptions) => string
  info: (msg: ToastContent, options?: ToastOptions) => string
  warning: (msg: ToastContent, options?: ToastOptions) => string
  loading: (msg: ToastContent, options?: ToastOptions) => string
  dismiss: (id?: string) => void
  (msg: ToastContent, options?: ToastOptions): string
}

interface ToastContextType {
  toast: ToastMethods
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

let globalToastMethods: ToastMethods | null = null

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const timerMapRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const removeToast = useCallback((id: string) => {
    const existingTimer = timerMapRef.current.get(id)
    if (existingTimer) {
      clearTimeout(existingTimer)
      timerMapRef.current.delete(id)
    }
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const startTimer = useCallback((id: string, type: ToastType, customDuration?: number) => {
    // If customDuration is explicitly 0, do not auto dismiss
    if (customDuration === 0) return

    const delay = customDuration !== undefined 
      ? customDuration 
      : (type === 'error' ? 6000 : type === 'warning' ? 4500 : 3500)

    const timer = setTimeout(() => {
      removeToast(id)
    }, delay)
    timerMapRef.current.set(id, timer)
  }, [removeToast])

  const pauseTimer = useCallback((id: string) => {
    const timer = timerMapRef.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timerMapRef.current.delete(id)
    }
  }, [])

  const addToast = useCallback((type: ToastType, content: ToastContent, options?: ToastOptions) => {
    const id = options?.id || Math.random().toString(36).substring(2, 9)

    // Clear previous timer if reusing same id
    const existingTimer = timerMapRef.current.get(id)
    if (existingTimer) {
      clearTimeout(existingTimer)
      timerMapRef.current.delete(id)
    }

    setToasts((prev) => {
      const filtered = prev.filter((t) => t.id !== id)
      return [...filtered, { id, type, content, icon: options?.icon, duration: options?.duration }]
    })

    startTimer(id, type, options?.duration)
    return id
  }, [startTimer])

  const toastMethods = React.useMemo<ToastMethods>(() => {
    const fn = ((msg: ToastContent, options?: ToastOptions) => {
      return addToast(options?.type || 'info', msg, options)
    }) as unknown as ToastMethods

    fn.success = (msg: ToastContent, options?: ToastOptions) => addToast('success', msg, options)
    fn.error = (msg: ToastContent, options?: ToastOptions) => addToast('error', msg, options)
    fn.info = (msg: ToastContent, options?: ToastOptions) => addToast('info', msg, options)
    fn.warning = (msg: ToastContent, options?: ToastOptions) => addToast('warning', msg, options)
    fn.loading = (msg: ToastContent, options?: ToastOptions) => addToast('info', msg, { ...options, duration: 0 })
    fn.dismiss = (id?: string) => {
      if (id) {
        removeToast(id)
      } else {
        setToasts([])
        timerMapRef.current.forEach((t) => clearTimeout(t))
        timerMapRef.current.clear()
      }
    }

    return fn
  }, [addToast, removeToast])

  React.useEffect(() => {
    globalToastMethods = toastMethods
  }, [toastMethods])

  return (
    <ToastContext.Provider value={{ toast: toastMethods }}>
      {children}
      {/* Toast Notification Viewport */}
      <div 
        aria-live="polite"
        aria-label="Thông báo hệ thống"
        className="fixed top-4 inset-x-4 sm:inset-x-auto sm:right-6 sm:top-6 z-[9999] flex flex-col gap-2.5 pointer-events-none items-center sm:items-end font-sans"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            onMouseEnter={() => pauseTimer(t.id)}
            onMouseLeave={() => startTimer(t.id, t.type, t.duration)}
            className="pointer-events-auto flex items-start sm:items-center gap-3 bg-white/95 backdrop-blur-md px-4 py-3 rounded-2xl shadow-xl shadow-slate-900/10 border border-slate-200/90 w-full sm:w-auto sm:min-w-[340px] sm:max-w-md animate-in slide-in-from-top-3 sm:slide-in-from-right-6 fade-in duration-200 transition-all select-none"
          >
            {/* Custom Icon or Semantic Icon Badge */}
            {t.icon ? (
              <div className="shrink-0 text-lg flex items-center justify-center">
                {typeof t.icon === 'string' ? <span>{t.icon}</span> : t.icon}
              </div>
            ) : (
              <>
                {t.duration === 0 && (
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-primary border border-blue-100 flex items-center justify-center shrink-0 shadow-xs">
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  </div>
                )}
                {t.duration !== 0 && t.type === 'success' && (
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0 shadow-xs">
                    <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                  </div>
                )}
                {t.duration !== 0 && t.type === 'error' && (
                  <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shrink-0 shadow-xs">
                    <AlertCircle className="w-4 h-4" aria-hidden="true" />
                  </div>
                )}
                {t.duration !== 0 && t.type === 'warning' && (
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0 shadow-xs">
                    <AlertTriangle className="w-4 h-4" aria-hidden="true" />
                  </div>
                )}
                {t.duration !== 0 && t.type === 'info' && (
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-primary border border-blue-100 flex items-center justify-center shrink-0 shadow-xs">
                    <Info className="w-4 h-4" aria-hidden="true" />
                  </div>
                )}
              </>
            )}

            {/* Message Content */}
            <div className="flex-1 min-w-0 pr-1 text-slate-800 font-medium text-xs sm:text-sm leading-snug break-words">
              {typeof t.content === 'function' ? (t.content as (props: { id: string }) => ReactNode)({ id: t.id }) : t.content}
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => removeToast(t.id)}
              aria-label="Đóng thông báo"
              className="p-1.5 -mr-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors shrink-0 cursor-pointer min-w-[32px] min-h-[32px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context.toast
}

export const toast: ToastMethods = Object.assign(
  (msg: ToastContent, options?: ToastOptions) => {
    return globalToastMethods ? globalToastMethods(msg, options) : ''
  },
  {
    success: (msg: ToastContent, options?: ToastOptions) => globalToastMethods ? globalToastMethods.success(msg, options) : '',
    error: (msg: ToastContent, options?: ToastOptions) => globalToastMethods ? globalToastMethods.error(msg, options) : '',
    info: (msg: ToastContent, options?: ToastOptions) => globalToastMethods ? globalToastMethods.info(msg, options) : '',
    warning: (msg: ToastContent, options?: ToastOptions) => globalToastMethods ? globalToastMethods.warning(msg, options) : '',
    loading: (msg: ToastContent, options?: ToastOptions) => globalToastMethods ? globalToastMethods.loading(msg, options) : '',
    dismiss: (id?: string) => {
      if (globalToastMethods) globalToastMethods.dismiss(id)
    },
  }
) as unknown as ToastMethods

export default ToastProvider
