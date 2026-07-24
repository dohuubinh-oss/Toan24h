'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import { Input } from '../ui/Input'
import { Label } from '../ui/Label'
import { Button } from '../ui/Button'
import { registerUser } from '@/lib/authApi'

type RegisterFormValues = {
  fullname: string
  identity: string
  password: string
  confirmPassword: string
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
      await registerUser({
        fullName: data.fullname,
        email: data.identity,
        password: data.password
      })
      router.push('/login?registered=true')
    } catch (error: any) {
      let msg = error.message
      if (msg.includes('Email already in use') || msg.includes('email')) {
        msg = 'Đăng ký thất bại. Email hoặc số điện thoại có thể đã tồn tại.'
      }
      setErrorMessage(msg || 'Đăng ký thất bại. Vui lòng thử lại sau.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16 bg-white">
      <div className="w-full max-w-[520px]">
        {/* Title */}
        <div className="mb-10 text-center">
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
            <Label htmlFor="password">Mật khẩu</Label>
            <div className="relative mt-2">
              <Input
                {...register('password', {
                  required: 'Vui lòng nhập mật khẩu',
                  minLength: { value: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' },
                  pattern: {
                    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/,
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
          <Button variant="outline" className="w-full gap-3 h-12 group">
            <svg className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"></path>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
            </svg>
            <span className="text-sm font-semibold text-slate-700">Google</span>
          </Button>
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
