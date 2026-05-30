'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import { Input } from '../ui/Input'
import { Label } from '../ui/Label'
import { Button } from '../ui/Button'
import { cn } from '../../lib/utils'

type ForgotPasswordFormValues = {
  identity: string
  otp?: string
  newPassword?: string
  confirmNewPassword?: string
}

export default function ForgotPasswordForm() {
  const [activeTab, setActiveTab] = useState<'email' | 'phone'>('email')
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [isLoading, setIsLoading] = useState(false)
  
  // States for step 3 password visibility
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const router = useRouter()

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    formState: { errors }
  } = useForm<ForgotPasswordFormValues>({
    mode: 'onTouched'
  })

  const onSubmitStep1 = async () => {
    const isIdentityValid = await trigger('identity')
    if (!isIdentityValid) return

    setIsLoading(true)
    await new Promise(r => setTimeout(r, 1000))
    setIsLoading(false)
    setStep(2)
  }

  const onSubmitStep2 = async () => {
    const isOtpValid = await trigger('otp')
    if (!isOtpValid) return

    setIsLoading(true)
    await new Promise(r => setTimeout(r, 1000))
    setIsLoading(false)
    setStep(3)
  }

  const onSubmitStep3 = async () => {
    const isPasswordValid = await trigger(['newPassword', 'confirmNewPassword'])
    if (!isPasswordValid) return

    setIsLoading(true)
    await new Promise(r => setTimeout(r, 1000))
    setIsLoading(false)
    
    // Redirect or show success toast
    router.push('/login')
  }

  const handleGoBack = () => {
    if (step > 1) setStep((prev) => (prev - 1) as 1 | 2 | 3)
  }

  return (
    <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16 bg-white">
      <div className="w-full max-w-[520px]">
        {/* Title */}
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold text-slate-800 mb-2">Quên mật khẩu</h2>
          <p className="text-slate-500 text-base">
            {step === 1 && "Vui lòng chọn phương thức và nhập thông tin để khôi phục."}
            {step === 2 && "Nhập mã OTP 6 số vừa được gửi đến bạn."}
            {step === 3 && "Vui lòng đặt lại mật khẩu mới cho tài khoản của bạn."}
          </p>
        </div>

        <form className="space-y-6" onSubmit={(e) => e.preventDefault()} noValidate>
          {/* STEP 1: IDENTITY */}
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
              {/* Tabs */}
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  className={cn(
                    "flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200",
                    activeTab === 'email' 
                      ? "bg-white text-primary shadow-sm" 
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                  )}
                  onClick={() => setActiveTab('email')}
                >
                  Email
                </button>
                <button
                  type="button"
                  className={cn(
                    "flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200",
                    activeTab === 'phone' 
                      ? "bg-white text-primary shadow-sm" 
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                  )}
                  onClick={() => setActiveTab('phone')}
                >
                  Số điện thoại
                </button>
              </div>

              <div>
                <Label htmlFor="identity">
                  {activeTab === 'email' ? 'Địa chỉ Email' : 'Số điện thoại'}
                </Label>
                <Input
                  {...register('identity', {
                    required: 'Vui lòng nhập thông tin',
                    validate: (val: string) => {
                      if (activeTab === 'email') {
                        const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)
                        return isValid || "Email không hợp lệ"
                      } else {
                        const isValid = /^(84|0[3|5|7|8|9])+([0-9]{8})\b/.test(val)
                        return isValid || "Số điện thoại không hợp lệ"
                      }
                    }
                  })}
                  id="identity"
                  placeholder={activeTab === 'email' ? 'Nhập email của bạn' : 'Nhập số điện thoại của bạn'}
                  type={activeTab === 'email' ? 'email' : 'tel'}
                  error={!!errors.identity}
                />
                {errors.identity && (
                  <p className="text-red-500 text-xs mt-1 font-medium">{errors.identity.message}</p>
                )}
              </div>

              <Button
                type="button"
                className="w-full gap-2 text-lg"
                onClick={onSubmitStep1}
                isLoading={isLoading}
              >
                Gửi mã khôi phục
              </Button>
            </div>
          )}

          {/* STEP 2: OTP */}
          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
              <div>
                <Label htmlFor="otp">Mã xác nhận (OTP)</Label>
                <Input
                  {...register('otp', {
                    required: 'Vui lòng nhập mã OTP',
                    pattern: {
                      value: /^\d{6}$/,
                      message: 'Mã OTP phải bao gồm 6 chữ số'
                    }
                  })}
                  id="otp"
                  placeholder="Nhập mã 6 chữ số"
                  type="text"
                  maxLength={6}
                  className="text-center tracking-[0.5em] font-bold text-lg"
                  error={!!errors.otp}
                />
                {errors.otp && (
                  <p className="text-red-500 text-xs mt-1 font-medium text-center">{errors.otp?.message}</p>
                )}
              </div>
              <div className="flex gap-4">
                <Button type="button" variant="outline" className="flex-1" onClick={handleGoBack} disabled={isLoading}>
                  Quay lại
                </Button>
                <Button type="button" className="flex-1" onClick={onSubmitStep2} isLoading={isLoading}>
                  Xác nhận
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
                      required: 'Vui lòng nhập mật khẩu',
                      minLength: { value: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' },
                      pattern: {
                        value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/,
                        message: 'Mật khẩu phải chứa chữ hoa, chữ thường, số và ký tự đặc biệt'
                      }
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
                      required: 'Vui lòng xác nhận mật khẩu',
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
