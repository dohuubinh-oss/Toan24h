import React from 'react'
import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import Sidebar, { SidebarRole } from '@/components/layout/Sidebar'
import { TeacherFilterManager } from '@/components/filters/TeacherFilterManager'

export const metadata: Metadata = {
  title: 'Quản trị hệ thống',
  robots: {
    index: false,
    follow: false,
  },
}

export default async function DashboardTeacherLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const rawRole = cookieStore.get('userRole')?.value
  const role: SidebarRole = (rawRole === 'admin' || rawRole === 'teacher') ? rawRole : 'student'

  return (
    <div className="flex flex-1 max-w-7xl mx-auto w-full gap-4">
      <Sidebar role={role} filterNode={<TeacherFilterManager />} />
      <main className="flex-1 bg-slate-50 py-4 pr-4 min-w-0">
        {children}
      </main>
    </div>
  )
}
