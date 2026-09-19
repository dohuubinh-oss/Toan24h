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
import TelegramLoginWidget from './TelegramLoginWidget'
import toast from 'react-hot-toast'

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

      if (res.user) {
        localStorage.setItem('user', JSON.stringify(res.user))
        document.cookie = `userRole=${res.user.role}; path=/; max-age=86400; SameSite=Lax`
        if (res.user.grade) {
          document.cookie = `userGrade=${res.user.grade}; path=/; max-age=86400; SameSite=Lax`
        }
      }

      toast.success('Đăng nhập thành công! Đang chuyển hướng...')
      setTimeout(() => {
        if (res.user?.role === 'admin' || res.user?.role === 'teacher') {
          window.location.href = '/dashboard/lectures'
        } else {
          window.location.href = '/lectures'
        }
      }, 500)
    } catch (error: any) {
      let msg = error.message
      if (msg.includes('Invalid email or password') || msg.includes('401')) {
        msg = 'Email hoặc mật khẩu không chính xác.'
      }
      setErrorMessage(msg || 'Đăng nhập thất bại. Vui lòng kiểm tra lại email và mật khẩu.')
      toast.error(msg || 'Đăng nhập thất bại')
    } finally {
      setIsLoading(false)
    }
  }

  const handleTelegramSuccess = (user: any) => {
    toast.success(`Đăng nhập thành công! Xin chào ${user.fullName || 'bạn'}`)
    setTimeout(() => {
      if (user.role === 'admin' || user.role === 'teacher') {
        window.location.href = '/dashboard/lectures'
      } else {
        window.location.href = '/lectures'
      }
    }, 400)
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
          {(() => {
            const telegramBotName = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'toan6789_bot';
            return (
              <div className="flex flex-col items-center mt-2">
                <TelegramLoginWidget
                  botName={telegramBotName}
                  onAuthSuccess={handleTelegramSuccess}
                />
              </div>
            );
          })()}
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
