import React, { Suspense } from 'react'
import type { Metadata } from 'next'
import LoginBranding from '../../components/auth/LoginBranding'
import RegisterForm from '../../components/auth/RegisterForm'

export const metadata: Metadata = {
  title: 'Đăng Ký Tài Khoản Học Sinh Mới',
  description: 'Tạo tài khoản toan6789.vn miễn phí để bắt đầu học Toán THCS từ lớp 6 đến lớp 9, nhận ngay ngân hàng đề thi thử có đáp án chi tiết.',
  alternates: {
    canonical: '/register',
  },
}

export default function RegisterPage() {
  return (
    <div className="flex w-full min-h-screen bg-white">
      <LoginBranding />
      <Suspense fallback={<div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white" />}>
        <RegisterForm />
      </Suspense>
    </div>
  )
}
