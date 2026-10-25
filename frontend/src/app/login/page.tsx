import React from 'react'
import type { Metadata } from 'next'
import LoginBranding from '../../components/auth/LoginBranding'
import LoginForm from '../../components/auth/LoginForm'

export const metadata: Metadata = {
  title: 'Đăng Nhập Tài Khoản',
  description: 'Đăng nhập toan6789.vn để tiếp tục lộ trình học tập, làm đề thi thử và theo dõi điểm kinh nghiệm XP.',
  alternates: {
    canonical: '/login',
  },
}

export default function LoginPage() {
  return (
    <div className="flex w-full min-h-screen bg-white">
      <LoginBranding />
      <LoginForm />
    </div>
  )
}
