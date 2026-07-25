'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { X, CheckCircle, AlertCircle } from 'lucide-react'

export interface ToastMessage {
  id: string
  type: 'success' | 'error' | 'info'
  message: string
}

interface ToastContextType {
  toast: {
    success: (msg: string) => void
    error: (msg: string) => void
    info: (msg: string) => void
  }
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

let toastFn: ToastContextType['toast'] | null = null

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const addToast = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts(prev => [...prev, { id, type, message }])
    
    // 6 seconds delay for errors, 3 seconds for others (if any remain)
    const delay = type === 'error' ? 6000 : 3000
    
    setTimeout(() => {
      removeToast(id)
    }, delay)
  }, [removeToast])

  const toastMethods = React.useMemo(() => ({
    success: (msg: string) => addToast('success', msg),
    error: (msg: string) => addToast('error', msg),
    info: (msg: string) => addToast('info', msg),
  }), [addToast])

  React.useEffect(() => {
    toastFn = toastMethods
  }, [toastMethods])

  return (
    <ToastContext.Provider value={{ toast: toastMethods }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div 
            key={t.id} 
            className="pointer-events-auto flex items-center gap-3 bg-white p-4 rounded-xl shadow-xl border border-slate-100 min-w-[300px] animate-in slide-in-from-right-8 fade-in duration-300"
          >
            {t.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-500" />}
            {t.type === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
            {t.type === 'info' && <AlertCircle className="w-5 h-5 text-blue-500" />}
            <span className="text-slate-700 font-medium text-sm flex-1">{t.message}</span>
            <button 
              onClick={() => removeToast(t.id)}
              className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
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

export const toast = {
  success: (msg: string) => toastFn?.success(msg),
  error: (msg: string) => toastFn?.error(msg),
  info: (msg: string) => toastFn?.info(msg),
}
