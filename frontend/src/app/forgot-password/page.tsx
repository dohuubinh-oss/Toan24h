import React from 'react'
import type { Metadata } from 'next'
import LoginBranding from '../../components/auth/LoginBranding'
import ForgotPasswordForm from '../../components/auth/ForgotPasswordForm'

export const metadata: Metadata = {
  title: 'Khôi Phục Mật Khẩu',
  description: 'Nhập email hoặc số điện thoại để nhận mã xác thực và khôi phục mật khẩu tài khoản toan6789.vn.',
  alternates: {
    canonical: '/forgot-password',
  },
  robots: {
    index: false,
    follow: false,
  },
}

export default function ForgotPasswordPage() {
  return (
    <div className="flex w-full min-h-screen bg-white">
      <LoginBranding />
      <ForgotPasswordForm />
    </div>
  )
}
