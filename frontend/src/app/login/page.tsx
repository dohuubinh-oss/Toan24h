import React from 'react'
import LoginBranding from '../../components/auth/LoginBranding'
import LoginForm from '../../components/auth/LoginForm'

export default function LoginPage() {
  return (
    <div className="flex w-full min-h-screen bg-white">
      <LoginBranding />
      <LoginForm />
    </div>
  )
}
