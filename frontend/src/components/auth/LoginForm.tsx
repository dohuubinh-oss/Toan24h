'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { Eye, EyeOff, GraduationCap, ArrowLeft, ShieldCheck } from 'lucide-react'
import { Input } from '../ui/Input'
import { Label } from '../ui/Label'
import { Button } from '../ui/Button'
import { Checkbox } from '../ui/Checkbox'
import { login, syncAuthSession, resendVerification } from '@/lib/authApi'
import GoogleSignInButton from './GoogleSignInButton'
import { toast } from '@/components/ui/ToastProvider'

type LoginFormValues = {
  identity: string
  password: string
  rememberMe: boolean
}

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null)
  const [isResending, setIsResending] = useState(false)

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

      if (res?.user) {
        syncAuthSession(res)
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
      if (msg.includes('chưa được kích hoạt')) {
        setUnverifiedEmail(data.identity)
      } else {
        setUnverifiedEmail(null)
      }
      if (msg.includes('Invalid email or password') || msg.includes('401')) {
        msg = 'Email hoặc mật khẩu không chính xác.'
      }
      setErrorMessage(msg || 'Đăng nhập thất bại. Vui lòng kiểm tra lại email và mật khẩu.')
      toast.error(msg || 'Đăng nhập thất bại')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    if (!unverifiedEmail) return
    setIsResending(true)
    try {
      await resendVerification(unverifiedEmail)
      toast.success('Đã gửi lại liên kết kích hoạt vào email của bạn!')
    } catch (err: any) {
      toast.error(err.message || 'Không thể gửi lại email kích hoạt')
    } finally {
      setIsResending(false)
    }
  }

  const handleGoogleSuccess = (user: any) => {
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
        {/* Mobile Top Header (Chỉ hiển thị trên thiết bị di động < lg) */}
        <div className="flex lg:hidden items-center justify-between w-full pb-3 mb-6 border-b border-slate-100 dark:border-slate-800">
          <Link href="/" className="flex items-center gap-2 text-slate-900 dark:text-white hover:opacity-90 transition">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight block leading-tight">Toan6789</span>
              <span className="text-[10px] tracking-wider text-blue-600 dark:text-blue-400 uppercase font-semibold block">
                Nền tảng Toán THCS
              </span>
            </div>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-blue-600 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Trang chủ</span>
          </Link>
        </div>

        {/* Title */}
        <div className="mb-8 text-center flex flex-col items-center">
          <h2 className="text-3xl font-bold text-slate-800 mb-2">Đăng nhập</h2>
          <p className="text-slate-500 text-base">Vui lòng nhập thông tin để truy cập bài học của bạn.</p>
        </div>

        {/* Form */}
        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate>
          {errorMessage && (
            <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl space-y-2">
              <p>{errorMessage}</p>
              {unverifiedEmail && (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isResending}
                  className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {isResending ? 'Đang gửi lại email...' : '→ Nhấn vào đây để gửi lại email kích hoạt'}
                </button>
              )}
            </div>
          )}

          <div>
            <Label htmlFor="identity">Email</Label>
            <Input
              {...register('identity', {
                required: 'Vui lòng nhập địa chỉ email',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Địa chỉ email không hợp lệ (ví dụ: name@gmail.com)'
                }
              })}
              id="identity"
              placeholder="name@example.com"
              type="email"
              autoComplete="username"
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
                autoComplete="current-password"
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
          <GoogleSignInButton onSuccess={handleGoogleSuccess} />
          {/* Trust Badge (Cam Kết Bảo Mật) */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500 pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Bảo mật SSL 256-bit • Dữ liệu học tập được mã hóa an toàn</span>
          </div>
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
