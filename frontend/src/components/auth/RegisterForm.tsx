'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Gift } from 'lucide-react'
import { Input } from '../ui/Input'
import { Label } from '../ui/Label'
import { Button } from '../ui/Button'

import { registerUser } from '@/lib/authApi'
import GoogleSignInButton from './GoogleSignInButton'
import toast from 'react-hot-toast'

type RegisterFormValues = {
  fullname: string
  identity: string
  password: string
  confirmPassword: string
  voucherCode?: string
}

export default function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const router = useRouter()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<RegisterFormValues>({
    mode: 'onTouched'
  })

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true)
    setErrorMessage('')
    try {
      const res = await registerUser({
        fullName: data.fullname,
        email: data.identity,
        password: data.password,
        voucherCode: data.voucherCode?.trim() || undefined
      })
      if (res?.freeMonths && res.freeMonths > 0) {
        toast.success(`Đăng ký thành công! Bạn nhận được ${res.freeMonths} tháng VIP miễn phí. Vui lòng kích hoạt email để bắt đầu.`)
      } else {
        toast.success('Đăng ký thành công! Vui lòng kiểm tra email để kích hoạt tài khoản.')
      }
      if (res?.requireEmailVerification) {
        router.push(`/verify-email?email=${encodeURIComponent(data.identity)}`)
      } else {
        router.push('/login?registered=true')
      }
    } catch (error: any) {
      let msg = error.message
      if (msg.includes('Email already in use') || msg.includes('email')) {
        msg = 'Đăng ký thất bại. Email này đã được sử dụng.'
      }
      setErrorMessage(msg || 'Đăng ký thất bại. Vui lòng thử lại sau.')
      toast.error(msg || 'Đăng ký thất bại.')
    } finally {
      setIsLoading(false)
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
        {/* Title */}
        <div className="mb-8 text-center flex flex-col items-center">
          <h2 className="text-3xl font-bold text-slate-800 mb-2">Đăng ký</h2>
          <p className="text-slate-500 text-base">Tạo tài khoản để bắt đầu học tập.</p>
        </div>

        {/* Form */}
        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate>
          {errorMessage && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {errorMessage}
            </div>
          )}
          
          <div>
            <Label htmlFor="fullname">Họ và Tên</Label>
            <Input
              {...register('fullname', { required: 'Vui lòng nhập họ tên' })}
              id="fullname"
              placeholder="Nhập họ và tên của bạn"
              type="text"
              error={!!errors.fullname}
            />
            {errors.fullname && (
              <p className="text-red-500 text-xs mt-1 font-medium">{errors.fullname.message}</p>
            )}
          </div>

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
              error={!!errors.identity}
            />
            {errors.identity && (
              <p className="text-red-500 text-xs mt-1 font-medium">{errors.identity.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="password">Mật khẩu</Label>
            <div className="relative mt-2">
              <Input
                {...register('password', {
                  required: 'Vui lòng nhập mật khẩu',
                  minLength: { value: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' },
                  pattern: {
                    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{6,}$/,
                    message: 'Mật khẩu phải chứa chữ hoa, chữ thường, số và ký tự đặc biệt'
                  }
                })}
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

          <div>
            <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
            <div className="relative mt-2">
              <Input
                {...register('confirmPassword', {
                  required: 'Vui lòng xác nhận mật khẩu',
                  validate: (val: string) => {
                    if (watch('password') != val) {
                      return "Mật khẩu không khớp"
                    }
                  }
                })}
                id="confirmPassword"
                placeholder="••••••••"
                type={showConfirmPassword ? 'text' : 'password'}
                error={!!errors.confirmPassword}
              />
              <button
                type="button"
                data-testid="toggle-confirm-password"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-red-500 text-xs mt-1 font-medium">{errors.confirmPassword.message}</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <Label htmlFor="voucherCode" className="flex items-center gap-1.5 text-slate-700">
                <Gift className="w-4 h-4 text-emerald-600" />
                Mã giới thiệu / Khuyến mãi
              </Label>
              <span className="text-xs text-slate-400 font-normal">Không bắt buộc</span>
            </div>
            <div className="relative mt-2">
              <Input
                {...register('voucherCode')}
                id="voucherCode"
                placeholder="Nhập mã (ví dụ: CHAOMUNG1M)"
                type="text"
                className="uppercase tracking-wider placeholder:normal-case placeholder:tracking-normal font-medium"
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full gap-2 text-lg"
            isLoading={isLoading}
          >
            Đăng ký
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
        </div>

        {/* Footer */}
        <p className="text-center mt-10 text-slate-500 text-sm">
          Bạn đã có tài khoản?
          <a className="text-primary font-bold hover:underline ml-1 transition-all duration-200" href="/login">Đăng nhập</a>
        </p>
      </div>
    </div>
  )
}
