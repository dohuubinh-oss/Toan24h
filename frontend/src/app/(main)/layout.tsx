import React from 'react'
import TopBar from '@/components/layout/TopBar'
import { ExamProvider } from '@/contexts/ExamContext'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ExamProvider>
      <div className="flex flex-col min-h-screen bg-slate-50">
        <TopBar />
        {children}
      </div>
    </ExamProvider>
  )
}
