'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { User, Shield, AlertCircle, CheckCircle2 } from 'lucide-react'
import TelegramLoginWidget, { TelegramUser } from '@/components/auth/TelegramLoginWidget'
import { apiFetch } from '@/lib/api'

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [linkStatus, setLinkStatus] = useState<{type: 'success' | 'error', message: string} | null>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Dùng apiFetch để có tích hợp HttpOnly cookie và retry logic
        const res = await apiFetch('/users/me')
        if (res.error) {
          router.push('/login')
          return
        }
        
        if (res.data) {
          setUser(res.data)
        } else {
          router.push('/login')
        }
      } catch (e) {
        console.error(e)
        router.push('/login')
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [router])

  const handleTelegramAuth = async (telegramUser: TelegramUser) => {
    try {
      const res = await apiFetch('/users/me/link-telegram', {
        method: 'POST',
        body: JSON.stringify(telegramUser)
      })

      if (res.message) {
        setLinkStatus({ type: 'success', message: 'Liên kết Telegram thành công!' })
        // Tải lại thông tin user
        const newRes = await apiFetch('/users/me')
        if (newRes.data) {
          setUser(newRes.data)
        }
      } else {
        setLinkStatus({ type: 'error', message: res.error || 'Liên kết thất bại' })
      }
    } catch (e: any) {
      setLinkStatus({ type: 'error', message: e.message || 'Lỗi kết nối máy chủ' })
    }
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-[60vh]">Đang tải...</div>
  }

  if (!user) return null

  return (
    <div className="max-w-3xl mx-auto py-12 px-6">
      <h1 className="text-3xl font-bold text-slate-800 mb-8">Hồ sơ cá nhân</h1>
      
      <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm mb-8">
        <div className="flex items-center gap-6 mb-8 pb-8 border-b border-slate-100 flex-wrap">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary text-3xl font-bold uppercase shrink-0">
            {user.fullName ? user.fullName.charAt(0) : <User size={40} />}
          </div>
          <div className="flex-1 min-w-[200px]">
            <h2 className="text-2xl font-bold text-slate-800">{user.fullName || 'Người dùng'}</h2>
            <p className="text-slate-500 mt-1">{user.email || user.phone || 'Chưa cập nhật thông tin liên hệ'}</p>
          </div>
          
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col gap-2 min-w-[240px]">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-600">Trạng thái tài khoản:</span>
              {user.expiresAt && new Date(user.expiresAt) > new Date() ? (
                <span className="px-2.5 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-bold">Đang hoạt động</span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-bold">Hết hạn</span>
              )}
            </div>
            {user.expiresAt ? (
              <div className="text-sm text-slate-600">
                Sử dụng đến: <span className="font-bold text-slate-800">{new Date(user.expiresAt).toLocaleDateString('vi-VN')}</span>
              </div>
            ) : (
              <div className="text-sm text-slate-600">Tài khoản chưa được kích hoạt gói</div>
            )}
            
            <button 
              onClick={() => router.push('/upgrade')}
              className="mt-2 w-full py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary/90 transition-colors"
            >
              Gia hạn ngay
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Shield className="text-primary" size={20} />
            Bảo mật & Liên kết
          </h3>
          
          <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h4 className="font-semibold text-slate-800 text-lg">Tài khoản Telegram</h4>
                <p className="text-slate-500 text-sm mt-1 max-w-md">
                  Liên kết tài khoản Telegram để nhận thông báo lịch học, kết quả bài thi và cập nhật mới nhất từ hệ thống.
                </p>
              </div>
              
              <div className="flex-shrink-0">
                {user.telegramUsername || user.telegramId ? (
                  <div className="bg-green-100 text-green-700 px-4 py-2 rounded-lg flex items-center gap-2 font-medium">
                    <CheckCircle2 size={18} />
                    Đã liên kết (@{user.telegramUsername || user.telegramId})
                  </div>
                ) : (
                  <div>
                    {process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ? (
                      <TelegramLoginWidget 
                        botName={process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME}
                        buttonSize="large"
                        onAuthCallback={handleTelegramAuth}
                      />
                    ) : (
                      <div className="text-sm text-red-500">Chưa cấu hình Telegram Bot</div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {linkStatus && (
              <div className={`mt-4 p-3 rounded-lg flex items-center gap-2 text-sm ${linkStatus.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {linkStatus.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                {linkStatus.message}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
