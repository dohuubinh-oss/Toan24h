import React from 'react'
import Sidebar from '@/components/layout/Sidebar'

export default function DashboardStudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-1 max-w-7xl mx-auto w-full gap-4">
      <Sidebar role="student" />
      <main className="flex-1 bg-slate-50 py-4 pr-4 min-w-0">
        {children}
      </main>
    </div>
  )
}
