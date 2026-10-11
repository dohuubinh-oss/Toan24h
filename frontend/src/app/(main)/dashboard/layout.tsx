import React from 'react'
import { cookies } from 'next/headers'
import Sidebar, { SidebarRole } from '@/components/layout/Sidebar'
import { TeacherFilterManager } from '@/components/filters/TeacherFilterManager'

export default async function DashboardTeacherLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const role = (cookieStore.get('userRole')?.value || 'teacher') as SidebarRole

  return (
    <div className="flex flex-1 max-w-7xl mx-auto w-full gap-4">
      <Sidebar role={role} filterNode={<TeacherFilterManager />} />
      <main className="flex-1 bg-slate-50 py-4 pr-4 min-w-0">
        {children}
      </main>
    </div>
  )
}
