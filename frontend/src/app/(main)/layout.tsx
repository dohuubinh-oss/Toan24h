import React from 'react'
import HomeNavigation from '@/components/home/HomeNavigation'
import { ExamProvider } from '@/contexts/ExamContext'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ExamProvider>
      <div className="flex flex-col min-h-screen bg-slate-50">
        <HomeNavigation isLoggedIn={true} />
        {children}
      </div>
    </ExamProvider>
  )
}
