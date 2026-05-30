import React from 'react'
import LoginBranding from '../../components/auth/LoginBranding'
import ForgotPasswordForm from '../../components/auth/ForgotPasswordForm'

export default function ForgotPasswordPage() {
  return (
    <div className="flex w-full min-h-screen bg-white">
      <LoginBranding />
      <ForgotPasswordForm />
    </div>
  )
}
