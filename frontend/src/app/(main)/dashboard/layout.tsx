import React from 'react'
import Sidebar from '@/components/layout/Sidebar'
import { TeacherFilterManager } from '@/components/filters/TeacherFilterManager'

export default function DashboardTeacherLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-1 max-w-7xl mx-auto w-full gap-4">
      <Sidebar role="teacher" filterNode={<TeacherFilterManager />} />
      <main className="flex-1 bg-slate-50 py-4 pr-4 min-w-0">
        {children}
      </main>
    </div>
  )
}
