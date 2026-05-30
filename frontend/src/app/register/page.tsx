import React from 'react'
import LoginBranding from '../../components/auth/LoginBranding'
import RegisterForm from '../../components/auth/RegisterForm'

export default function RegisterPage() {
  return (
    <div className="flex w-full min-h-screen bg-white">
      <LoginBranding />
      <RegisterForm />
    </div>
  )
}
