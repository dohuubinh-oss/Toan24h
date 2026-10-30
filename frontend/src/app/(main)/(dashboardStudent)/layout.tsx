import React from 'react'
import Sidebar from '@/components/layout/Sidebar'
import { cookies } from 'next/headers'
import GradeSelectionModal from '@/components/student/GradeSelectionModal'
import PromotionRewardModal from '@/components/student/PromotionRewardModal'
import { StudentLectureFilterProvider } from '@/context/StudentLectureFilterContext'
import StudentFilterManager from '@/components/student/StudentFilterManager'
import StudentBottomNav from '@/components/layout/StudentBottomNav'

export default async function DashboardStudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const userRoleCookie = cookieStore.get('userRole')?.value
  const userGradeCookie = cookieStore.get('userGrade')?.value
  
  const isStudent = userRoleCookie === 'student'
  const hasGrade = !!userGradeCookie && userGradeCookie.trim() !== ''
  const showModal = isStudent && !hasGrade

  return (
    <StudentLectureFilterProvider>
      <div className="flex flex-1 max-w-7xl mx-auto w-full gap-4">
        <Sidebar role="student" filterNode={<StudentFilterManager />} />
        <main className="flex-1 bg-slate-50 p-4 md:py-4 md:pr-4 md:pl-0 pb-20 md:pb-4 min-w-0">
          {children}
        </main>
        {showModal && <GradeSelectionModal show={true} />}
        <PromotionRewardModal />
        <StudentBottomNav />
      </div>
    </StudentLectureFilterProvider>
  )
}
