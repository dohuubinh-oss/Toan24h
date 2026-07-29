'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import { Input } from '../ui/Input'
import { Label } from '../ui/Label'
import { Button } from '../ui/Button'
import { Checkbox } from '../ui/Checkbox'
import { login } from '@/lib/authApi'
import TelegramLoginWidget, { TelegramUser } from './TelegramLoginWidget'

type LoginFormValues = {
  identity: string
  password: string
  rememberMe: boolean
}

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormValues>({
    mode: 'onTouched',
    defaultValues: {
      identity: '',
      password: '',
      rememberMe: false
    }
  })

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true)
    setErrorMessage('')
    try {
      const res = await login({
        email: data.identity,
        password: data.password
      })
      
      // Note: The backend now sets HttpOnly cookies automatically, and regular cookies for userRole/userGrade
      // so Next.js middleware will read them seamlessly.

      // Update user state in local storage (optional, for UI)
      if (res.user) {
        localStorage.setItem('user', JSON.stringify(res.user))
      }
      
      if (res.user?.role === 'admin') {
        router.push('/dashboard')
      } else {
        router.push('/lectures')
      }
    } catch (error: any) {
      let msg = error.message
      if (msg.includes('Invalid email or password')) {
        msg = 'Email hoặc mật khẩu không chính xác.'
      }
      setErrorMessage(msg || 'Đăng nhập thất bại. Vui lòng kiểm tra lại email và mật khẩu.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleTelegramAuth = async (user: TelegramUser) => {
    setIsLoading(true)
    setErrorMessage('')
    try {
      const response = await fetch('http://localhost:8080/api/v1/auth/telegram-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(user),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Đăng nhập Telegram thất bại')
      }

      const res = await response.json()
      
      if (res.user) {
        localStorage.setItem('user', JSON.stringify(res.user))
      }
      
      if (res.user?.role === 'admin') {
        router.push('/dashboard')
      } else {
        router.push('/lectures')
      }
    } catch (error: any) {
      setErrorMessage(error.message || 'Lỗi kết nối máy chủ.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16 bg-white">
      <div className="w-full max-w-[520px]">
        {/* Title */}
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold text-slate-800 mb-2">Đăng nhập</h2>
          <p className="text-slate-500 text-base">Vui lòng nhập thông tin để truy cập bài học của bạn.</p>
        </div>

        {/* Form */}
        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate>
          {errorMessage && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {errorMessage}
            </div>
          )}
          
          <div>
            <Label htmlFor="identity">Số điện thoại hoặc Email</Label>
            <Input
              {...register('identity', { 
                required: 'Vui lòng nhập email hoặc số điện thoại',
                pattern: {
                  value: /^([^\s@]+@[^\s@]+\.[^\s@]+|(84|0[3|5|7|8|9])+([0-9]{8})\b)$/,
                  message: 'Email hoặc số điện thoại không hợp lệ'
                }
              })}
              id="identity"
              placeholder="Nhập email hoặc số điện thoại"
              type="text"
              error={!!errors.identity}
            />
            {errors.identity && (
              <p className="text-red-500 text-xs mt-1 font-medium">{errors.identity.message}</p>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <Label htmlFor="password" className="mb-0">Mật khẩu</Label>
              <a className="text-sm font-medium text-primary hover:underline transition-all duration-200" href="/forgot-password">
                Quên mật khẩu?
              </a>
            </div>
            <div className="relative">
              <Input
                {...register('password', { required: 'Vui lòng nhập mật khẩu' })}
                id="password"
                placeholder="••••••••"
                type={showPassword ? 'text' : 'password'}
                error={!!errors.password}
              />
              <button
                type="button"
                data-testid="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-xs mt-1 font-medium">{errors.password.message}</p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <Checkbox
              {...register('rememberMe')}
              id="rememberMe"
              label="Ghi nhớ đăng nhập"
            />
          </div>

          <Button
            type="submit"
            className="w-full gap-2 text-lg"
            isLoading={isLoading}
          >
            Đăng nhập
          </Button>
        </form>

        {/* Divider */}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-slate-500">Hoặc tiếp tục với</span>
          </div>
        </div>

        <div className="grid gap-4">
          {process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ? (
            <div className="flex flex-col items-center mt-2">
              <TelegramLoginWidget
                botName={process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME}
                onAuthCallback={handleTelegramAuth}
              />
              <span className="text-xs text-slate-400 mt-2">Sử dụng tài khoản Telegram của bạn</span>
            </div>
          ) : (
             <div className="text-center text-red-500 text-sm p-4 bg-red-50 rounded-lg border border-red-100">
               Lỗi: Chưa cấu hình Telegram Bot. Vui lòng cập nhật biến môi trường NEXT_PUBLIC_TELEGRAM_BOT_USERNAME.
             </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center mt-10 text-slate-500 text-sm">
          Bạn chưa có tài khoản?
          <a className="text-primary font-bold hover:underline ml-1 transition-all duration-200" href="/register">Đăng ký ngay</a>
        </p>
      </div>
    </div>
  )
}
