'use client'

import React, { useEffect, useState } from 'react'
import { AlertCircle, Clock } from 'lucide-react'
import { useRouter, usePathname } from 'next/navigation'

export default function SubscriptionBanner({ hideVisuals = false }: { hideVisuals?: boolean }) {
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null)
  const [isExpired, setIsExpired] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        const user = JSON.parse(userStr)
        // Trừ admin hoặc teacher
        if (user.role !== 'admin' && user.role !== 'teacher') {
          if (!user.expiresAt) {
            setIsExpired(true)
            setDaysRemaining(0)
          } else {
            const expiresDate = new Date(user.expiresAt)
            const now = new Date()
            const diffTime = expiresDate.getTime() - now.getTime()
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

            if (diffDays <= 0) {
              setIsExpired(true)
              setDaysRemaining(0)
            } else {
              setIsExpired(false)
              if (diffDays <= 3) {
                setDaysRemaining(diffDays)
              } else {
                setDaysRemaining(null)
              }
            }
          }
        } else {
          setIsExpired(false)
          setDaysRemaining(null)
        }
      }
    } catch (e) {
      console.error('Failed to parse user for subscription banner', e)
    }
  }, [pathname])

  useEffect(() => {
    // Trừ trang chủ ('/') và trang nâng cấp ('/upgrade') ra, khi vào bất kỳ trang nào cũng bị chuyển hướng sang /upgrade
    const allowedPages = ['/', '/upgrade', '/login', '/register', '/forgot-password']
    if (isExpired && !allowedPages.includes(pathname)) {
      router.push('/upgrade')
    }
  }, [isExpired, pathname, router])

  if (isExpired && !hideVisuals) {
    return (
      <div className="bg-rose-50 border-b border-rose-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 text-rose-700 text-sm font-medium">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>Tài khoản của bạn đã hết hạn. Vui lòng gia hạn để tiếp tục sử dụng bài giảng và làm đề thi.</span>
          </div>
          <button
            onClick={() => router.push('/upgrade')}
            className="px-3.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-colors shrink-0 cursor-pointer shadow-sm"
          >
            Gia hạn ngay
          </button>
        </div>
      </div>
    )
  }

  if (!hideVisuals && daysRemaining !== null && daysRemaining > 0 && daysRemaining <= 3) {
    return (
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 text-amber-800 text-sm font-medium">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 shrink-0 text-amber-600" />
            <span>Tài khoản của bạn sẽ hết hạn sau {daysRemaining} ngày nữa. Vui lòng gia hạn để không bị gián đoạn.</span>
          </div>
          <button
            onClick={() => router.push('/upgrade')}
            className="px-3.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition-colors shrink-0 cursor-pointer shadow-sm"
          >
            Gia hạn
          </button>
        </div>
      </div>
    )
  }

  return null
}
