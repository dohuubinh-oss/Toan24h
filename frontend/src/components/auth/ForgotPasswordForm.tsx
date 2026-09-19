'use client'

import React, { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react'
import { Input } from '../ui/Input'
import { Label } from '../ui/Label'
import { Button } from '../ui/Button'
import { apiFetch } from '../../lib/api'

type ForgotPasswordFormValues = {
  email: string
  otp?: string
  newPassword?: string
  confirmNewPassword?: string
}

export default function ForgotPasswordForm() {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [isLoading, setIsLoading] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [serverSuccess, setServerSuccess] = useState<string | null>(null)
  
  // 6 separate OTP input boxes state
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', ''])
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // States for step 3 password visibility
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const router = useRouter()

  const {
    register,
    watch,
    trigger,
    getValues,
    setValue,
    formState: { errors }
  } = useForm<ForgotPasswordFormValues>({
    mode: 'onTouched'
  })

  // Handle individual OTP box change
  const handleOtpDigitChange = (index: number, val: string) => {
    // Keep only numbers
    const cleanVal = val.replace(/\D/g, '')
    const digit = cleanVal.slice(-1)

    const newDigits = [...otpDigits]
    newDigits[index] = digit
    setOtpDigits(newDigits)
    
    const combinedOtp = newDigits.join('')
    setValue('otp', combinedOtp, { shouldValidate: true })

    // Auto-focus next box if digit entered
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  // Handle Backspace navigation
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  // Handle pasting 6 digits
  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').trim()
    if (pastedData.length === 6) {
      const digits = pastedData.split('')
      setOtpDigits(digits)
      setValue('otp', pastedData, { shouldValidate: true })
      inputRefs.current[5]?.focus()
    }
  }

  const onSubmitStep1 = async () => {
    setServerError(null)
    setServerSuccess(null)

    const isEmailValid = await trigger('email')
    if (!isEmailValid) return

    const email = getValues('email')
    setIsLoading(true)

    try {
      const res = await apiFetch('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email })
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setServerError(data.error || 'Không thể gửi mã OTP. Vui lòng thử lại sau.')
        setIsLoading(false)
        return
      }

      const data = await res.json()
      setServerSuccess(data.message || 'Mã OTP đã được gửi đến email của bạn.')
      setStep(2)
    } catch (err: any) {
      setServerError(err.message || 'Lỗi hệ thống. Vui lòng thử lại.')
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmitStep2 = async () => {
    setServerError(null)
    setServerSuccess(null)

    const combinedOtp = otpDigits.join('')
    setValue('otp', combinedOtp)

    if (combinedOtp.length < 6) {
      setServerError('Vui lòng nhập đủ 6 chữ số mã OTP')
      return
    }

    const email = getValues('email')
    setIsLoading(true)

    try {
      const res = await apiFetch('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ email, otp: combinedOtp })
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setServerError(data.error || 'Mã OTP không đúng hoặc đã hết hạn.')
        setIsLoading(false)
        return
      }

      setServerSuccess('Xác thực OTP thành công. Vui lòng đặt mật khẩu mới.')
      setStep(3)
    } catch (err: any) {
      setServerError(err.message || 'Lỗi hệ thống khi xác thực OTP.')
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmitStep3 = async () => {
    setServerError(null)
    setServerSuccess(null)

    const isPasswordValid = await trigger(['newPassword', 'confirmNewPassword'])
    if (!isPasswordValid) return

    const email = getValues('email')
    const combinedOtp = otpDigits.join('')
    const newPassword = getValues('newPassword')
    setIsLoading(true)

    try {
      const res = await apiFetch('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email, otp: combinedOtp, newPassword })
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setServerError(data.error || 'Không thể đặt lại mật khẩu. Vui lòng thử lại.')
        setIsLoading(false)
        return
      }

      setServerSuccess('Đặt lại mật khẩu thành công! Đang chuyển đến trang đăng nhập...')
      setTimeout(() => {
        router.push('/login')
      }, 1500)
    } catch (err: any) {
      setServerError(err.message || 'Lỗi hệ thống khi đổi mật khẩu.')
      setIsLoading(false)
    }
  }

  const handleGoBack = () => {
    setServerError(null)
    setServerSuccess(null)
    if (step > 1) setStep((prev) => (prev - 1) as 1 | 2 | 3)
  }

  return (
    <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16 bg-white">
      <div className="w-full max-w-[520px]">
        {/* Title */}
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-slate-800 mb-2">Quên mật khẩu</h2>
          <p className="text-slate-500 text-base">
            {step === 1 && "Nhập địa chỉ Email đăng ký để nhận mã khôi phục OTP."}
            {step === 2 && `Mã OTP 6 chữ số đã gửi tới ${watch('email') || 'email của bạn'}.`}
            {step === 3 && "Vui lòng đặt lại mật khẩu mới cho tài khoản của bạn."}
          </p>
        </div>

        {/* Global Server Messages */}
        {serverError && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3 text-red-700 text-sm font-medium animate-in fade-in duration-200">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        {serverSuccess && (
          <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-200 flex items-center gap-3 text-green-700 text-sm font-medium animate-in fade-in duration-200">
            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
            <span>{serverSuccess}</span>
          </div>
        )}

        <form className="space-y-6" onSubmit={(e) => e.preventDefault()} noValidate>
          {/* STEP 1: EMAIL */}
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
              <div>
                <Label htmlFor="email">Địa chỉ Email</Label>
                <Input
                  {...register('email', {
                    required: 'Vui lòng nhập địa chỉ Email',
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: 'Địa chỉ Email không hợp lệ'
                    }
                  })}
                  id="email"
                  placeholder="Nhập email của bạn (ví dụ: student@gmail.com)"
                  type="email"
                  error={!!errors.email}
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1 font-medium">{errors.email.message}</p>
                )}
              </div>

              <Button
                type="button"
                className="w-full gap-2 text-lg"
                onClick={onSubmitStep1}
                isLoading={isLoading}
              >
                Gửi mã khôi phục qua Email
              </Button>
            </div>
          )}

          {/* STEP 2: 6 MODERN OTP BOXES */}
          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
              <div>
                <Label className="text-center block mb-4 text-slate-700 font-semibold text-base">
                  Nhập mã xác thực (OTP)
                </Label>
                <div className="flex justify-between items-center gap-2 sm:gap-3 my-2">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        inputRefs.current[idx] = el
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      onPaste={handleOtpPaste}
                      className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold rounded-xl border-2 border-slate-200 bg-slate-50/50 text-slate-800 transition-all duration-200 outline-none focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 shadow-sm"
                      autoFocus={idx === 0}
                    />
                  ))}
                </div>
                <p className="text-xs text-slate-400 text-center mt-3">
                  Bạn có thể dán (paste) trực tiếp mã 6 số vào các ô trên.
                </p>
              </div>

              <div className="flex gap-4">
                <Button type="button" variant="outline" className="flex-1" onClick={handleGoBack} disabled={isLoading}>
                  Quay lại
                </Button>
                <Button type="button" className="flex-1" onClick={onSubmitStep2} isLoading={isLoading}>
                  Xác nhận OTP
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: NEW PASSWORD */}
          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
              <div>
                <Label htmlFor="newPassword">Mật khẩu mới</Label>
                <div className="relative mt-2">
                  <Input
                    {...register('newPassword', {
                      required: 'Vui lòng nhập mật khẩu mới',
                      minLength: { value: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' },
                    })}
                    id="newPassword"
                    placeholder="••••••••"
                    type={showPassword ? 'text' : 'password'}
                    error={!!errors.newPassword}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.newPassword && (
                  <p className="text-red-500 text-xs mt-1 font-medium">{errors.newPassword?.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="confirmNewPassword">Xác nhận mật khẩu mới</Label>
                <div className="relative mt-2">
                  <Input
                    {...register('confirmNewPassword', {
                      required: 'Vui lòng xác nhận mật khẩu mới',
                      validate: (val: string | undefined) => {
                        if (watch('newPassword') !== val) {
                          return "Mật khẩu không khớp"
                        }
                      }
                    })}
                    id="confirmNewPassword"
                    placeholder="••••••••"
                    type={showConfirmPassword ? 'text' : 'password'}
                    error={!!errors.confirmNewPassword}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.confirmNewPassword && (
                  <p className="text-red-500 text-xs mt-1 font-medium">{errors.confirmNewPassword?.message}</p>
                )}
              </div>

              <div className="flex gap-4">
                <Button type="button" variant="outline" className="flex-1" onClick={handleGoBack} disabled={isLoading}>
                  Quay lại
                </Button>
                <Button type="button" className="flex-1" onClick={onSubmitStep3} isLoading={isLoading}>
                  Lưu mật khẩu
                </Button>
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <p className="text-center mt-10 text-slate-500 text-sm">
          Nhớ mật khẩu rồi?
          <a className="text-primary font-bold hover:underline ml-1 transition-all duration-200" href="/login">Đăng nhập</a>
        </p>
      </div>
    </div>
  )
}
