import React from 'react'
import Sidebar from '@/components/layout/Sidebar'

import { cookies } from 'next/headers'
import GradeSelectionModal from '@/components/student/GradeSelectionModal'

export default async function DashboardStudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const userGradeCookie = cookieStore.get('userGrade')?.value
  const hasGrade = !!userGradeCookie && userGradeCookie.trim() !== ''

  return (
    <div className="flex flex-1 max-w-7xl mx-auto w-full gap-4">
      <Sidebar role="student" />
      <main className="flex-1 bg-slate-50 py-4 pr-4 min-w-0">
        {children}
      </main>
      <GradeSelectionModal show={!hasGrade} />
    </div>
  )
}
