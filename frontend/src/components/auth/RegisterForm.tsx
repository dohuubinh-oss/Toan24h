'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, Gift, GraduationCap, ArrowLeft, ShieldCheck } from 'lucide-react'
import { Input } from '../ui/Input'
import { Label } from '../ui/Label'
import { Button } from '../ui/Button'

import { registerUser } from '@/lib/authApi'
import GoogleSignInButton from './GoogleSignInButton'
import { toast } from '@/components/ui/ToastProvider'

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
  const searchParams = useSearchParams()
  const refParam = searchParams.get('ref') || ''

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<RegisterFormValues>({
    mode: 'onTouched',
    defaultValues: {
      voucherCode: refParam ? refParam.toUpperCase() : ''
    }
  })

  const password = watch('password') || ''

  const passwordStrength = useMemo(() => {
    if (!password) return 0
    let score = 0
    if (password.length >= 6) score++
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++
    if (/\d/.test(password)) score++
    if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password)) score++
    return score
  }, [password])

  const strengthLabel = useMemo(() => {
    switch (passwordStrength) {
      case 1:
        return { label: 'Yếu', color: 'text-rose-600', bar: 'bg-rose-500' }
      case 2:
        return { label: 'Trung bình', color: 'text-amber-500', bar: 'bg-amber-500' }
      case 3:
        return { label: 'Khá', color: 'text-blue-500', bar: 'bg-blue-500' }
      case 4:
        return { label: 'Rất mạnh', color: 'text-emerald-600', bar: 'bg-emerald-500' }
      default:
        return { label: '', color: '', bar: '' }
    }
  }, [passwordStrength])

  useEffect(() => {
    if (refParam) {
      setValue('voucherCode', refParam.toUpperCase())
    }
  }, [refParam, setValue])

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
        if (typeof window !== 'undefined') {
          localStorage.setItem('promo_reward_months', String(res.freeMonths))
        }
        toast.success(`Đăng ký thành công! Bạn nhận được ${res.freeMonths} tháng VIP miễn phí. Vui lòng kích hoạt email để bắt đầu.`)
      } else {
        toast.success('Đăng ký thành công! Vui lòng kiểm tra email để kích hoạt tài khoản.')
      }
      if (res?.requireEmailVerification) {
        const promoParam = res?.freeMonths ? `&promoMonths=${res.freeMonths}` : ''
        router.push(`/verify-email?email=${encodeURIComponent(data.identity)}${promoParam}`)
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
    <div className="w-full lg:w-1/2 min-h-screen flex flex-col justify-center items-center py-6 sm:py-10 px-4 sm:px-6 lg:p-16">
      <div className="w-full max-w-[480px] sm:max-w-[540px] bg-white dark:bg-slate-900 sm:rounded-3xl sm:border sm:border-slate-100 dark:sm:border-slate-800 sm:shadow-xl sm:shadow-slate-200/50 dark:sm:shadow-none p-5 sm:p-8 md:p-9 lg:border-0 lg:shadow-none lg:p-0 lg:bg-transparent my-auto">
        {/* Mobile / Tablet Top Header (Chỉ hiển thị trên thiết bị < lg) */}
        <div className="flex lg:hidden items-center justify-between w-full pb-3 mb-5 border-b border-slate-100 dark:border-slate-800">
          <Link href="/" className="flex items-center gap-2 text-slate-900 dark:text-white hover:opacity-90 transition">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <GraduationCap className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
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
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-blue-600 px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition min-h-[36px]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Trang chủ</span>
          </Link>
        </div>

        {/* Title */}
        <div className="mb-5 sm:mb-6 text-center flex flex-col items-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-white mb-1.5 tracking-tight">Đăng ký</h2>
          <p className="text-slate-600 text-sm sm:text-base">Tạo tài khoản để bắt đầu học tập cùng Toan6789.</p>
        </div>

        {/* Form */}
        <form className="space-y-3.5 sm:space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
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
              autoComplete="name"
              autoCapitalize="words"
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
              autoComplete="email"
              inputMode="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              error={!!errors.identity}
            />
            {errors.identity && (
              <p className="text-red-500 text-xs mt-1 font-medium">{errors.identity.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="password">Mật khẩu</Label>
            <div className="relative mt-1.5">
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
                autoComplete="new-password"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                error={!!errors.password}
              />
              <button
                type="button"
                data-testid="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 rounded-md transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Thước Đo Password Strength Meter */}
            {password && (
              <div data-testid="password-strength-meter" className="space-y-1.5 pt-2">
                <div className="grid grid-cols-4 gap-1.5 pt-0.5">
                  {[1, 2, 3, 4].map((step) => (
                    <div
                      key={step}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        step <= passwordStrength ? strengthLabel.bar : 'bg-slate-200 dark:bg-slate-800'
                      }`}
                    />
                  ))}
                </div>
                {strengthLabel.label && (
                  <div className="flex items-center justify-between text-xs px-0.5">
                    <span className="text-slate-500">Độ an toàn:</span>
                    <span className={`font-semibold ${strengthLabel.color}`}>{strengthLabel.label}</span>
                  </div>
                )}
              </div>
            )}

            {errors.password && (
              <p className="text-red-500 text-xs mt-1 font-medium">{errors.password.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
            <div className="relative mt-1.5">
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
                autoComplete="new-password"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                error={!!errors.confirmPassword}
              />
              <button
                type="button"
                data-testid="toggle-confirm-password"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 rounded-md transition-colors"
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
              <Label htmlFor="voucherCode" className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                <Gift className="w-4 h-4 text-emerald-600" />
                Mã giới thiệu / Khuyến mãi
              </Label>
              <span className="text-xs text-slate-500 font-normal">Không bắt buộc</span>
            </div>
            <div className="relative mt-1.5">
              <Input
                {...register('voucherCode')}
                id="voucherCode"
                placeholder="Nhập mã (ví dụ: CHAOMUNG1M)"
                type="text"
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck={false}
                className="uppercase tracking-wider placeholder:normal-case placeholder:tracking-normal font-medium"
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full gap-2 text-base sm:text-lg h-12 font-semibold shadow-sm mt-1"
            isLoading={isLoading}
          >
            Đăng ký
          </Button>
        </form>

        {/* Divider */}
        <div className="relative my-4 sm:my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white dark:bg-slate-900 text-slate-600 text-xs sm:text-sm">Hoặc tiếp tục với</span>
          </div>
        </div>

        <div className="grid gap-3">
          <GoogleSignInButton
            onSuccess={handleGoogleSuccess}
            refCode={watch('voucherCode')?.trim() || refParam.trim()}
          />
          {/* Trust Badge (Cam Kết Bảo Mật) */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 pt-0.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Bảo mật SSL 256-bit • Dữ liệu học tập được mã hóa an toàn</span>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center mt-5 sm:mt-6 text-slate-600 text-sm">
          Bạn đã có tài khoản?
          <a className="text-primary font-bold hover:underline ml-1 transition-all duration-200" href="/login">Đăng nhập</a>
        </p>
      </div>
    </div>
  )
}
