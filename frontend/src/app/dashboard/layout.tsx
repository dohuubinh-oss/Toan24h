'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import Sidebar from '../../components/layout/Sidebar'
import TopBar from '../../components/layout/TopBar'
import { ExamProvider } from '../../contexts/ExamContext'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();
  const isCreatePage = pathname === '/dashboard/questions/create' || pathname === '/dashboard/exams/create';

  return (
    <ExamProvider>
      <div className="flex flex-col min-h-screen bg-slate-50">
        {!isCreatePage && <TopBar />}
        
        {isCreatePage ? (
          <main className="flex-1 min-w-0">
            {children}
          </main>
        ) : (
          <div className="flex flex-1 max-w-7xl mx-auto w-full gap-4">
            <Sidebar />
            <main className="flex-1 bg-slate-50 py-4 pr-4 min-w-0">
              {children}
            </main>
          </div>
        )}
      </div>
    </ExamProvider>
  )
}
