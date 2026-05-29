'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Eye, EyeOff, FunctionSquare } from 'lucide-react'

const loginSchema = z.object({
  fullname: z.string().min(1, 'Vui lòng nhập họ tên'),
  identity: z.string().min(1, 'Vui lòng nhập email hoặc số điện thoại'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu')
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)

  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema)
  })

  const onSubmit = (data: LoginFormValues) => {
    // [TODO: WARNING] Hiện tại dùng logic giả lập để phân quyền dựa vào text nhập ở Identity.
    // KHI CÓ API THẬT, PHẢI THAY THẾ BẰNG RESPONSE PHÂN QUYỀN TỪ SERVER (roles/permissions).
    // Nếu quên cập nhật phần này sẽ sinh lỗi nghiêm trọng về bảo mật & luồng dữ liệu!
    
    if (data.identity.toLowerCase().includes('student')) {
      router.push('/dashboard/student')
    } else {
      router.push('/dashboard/questions')
    }
  }

  return (
    <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16 bg-white">
      <div className="w-full max-w-[520px]">
        {/* Logo */}
        <div className="flex flex-col items-center gap-4 mb-10">
          <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
            <FunctionSquare className="text-white w-7 h-7" />
          </div>
          <span className="text-2xl font-bold text-slate-800 tracking-tight">MathGenius</span>
        </div>

        {/* Title */}
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold text-slate-800 mb-2">Đăng nhập</h2>
          <p className="text-slate-500 text-base">Vui lòng nhập thông tin để truy cập bài học của bạn.</p>
        </div>

        {/* Form */}
        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2" htmlFor="fullname">
              Họ và Tên
            </label>
            <input
              {...register('fullname')}
              className={`w-full px-4 h-12 rounded-lg border bg-white text-slate-900 focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 outline-none ${
                errors.fullname ? 'border-red-500' : 'border-slate-200'
              }`}
              id="fullname"
              placeholder="Nhập họ và tên của bạn"
              type="text"
            />
            {errors.fullname && (
              <p className="text-red-500 text-xs mt-1 font-medium">{errors.fullname.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2" htmlFor="identity">
              Số điện thoại hoặc Email
            </label>
            <input
              {...register('identity')}
              className={`w-full px-4 h-12 rounded-lg border bg-white text-slate-900 focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 outline-none ${
                errors.identity ? 'border-red-500' : 'border-slate-200'
              }`}
              id="identity"
              placeholder="Nhập email hoặc số điện thoại"
              type="text"
            />
            {errors.identity && (
              <p className="text-red-500 text-xs mt-1 font-medium">{errors.identity.message}</p>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-semibold text-slate-700" htmlFor="password">
                Mật khẩu
              </label>
              <a className="text-sm font-medium text-primary hover:underline transition-all duration-200" href="#">
                Quên mật khẩu?
              </a>
            </div>
            <div className="relative">
              <input
                {...register('password')}
                className={`w-full px-4 h-12 rounded-lg border bg-white text-slate-900 focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 outline-none ${
                  errors.password ? 'border-red-500' : 'border-slate-200'
                }`}
                id="password"
                placeholder="••••••••"
                type={showPassword ? 'text' : 'password'}
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

          <button
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-12 rounded-lg transition-all duration-300 shadow-lg shadow-primary/20 flex items-center justify-center gap-2 text-lg"
            type="submit"
          >
            Đăng nhập
          </button>
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

        {/* Social Logins */}
        <div className="grid gap-4">
          <button className="flex items-center justify-center gap-3 px-4 h-12 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 transition-all duration-300 group">
            <svg className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"></path>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
            </svg>
            <span className="text-sm font-semibold text-slate-700">Google</span>
          </button>
        </div>

        {/* Footer */}
        <p className="text-center mt-10 text-slate-500 text-sm">
          Bạn chưa có tài khoản?
          <a className="text-primary font-bold hover:underline ml-1 transition-all duration-200" href="#">Đăng ký ngay</a>
        </p>
      </div>
    </div>
  )
}
