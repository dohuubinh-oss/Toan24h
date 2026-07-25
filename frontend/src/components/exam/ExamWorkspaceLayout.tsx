import React from 'react'

interface ExamWorkspaceLayoutProps {
  sidebarTopContent?: React.ReactNode
  sidebarGrid: React.ReactNode
  mainContent: React.ReactNode
  footerContent?: React.ReactNode
}

export default function ExamWorkspaceLayout({
  sidebarTopContent,
  sidebarGrid,
  mainContent,
  footerContent,
}: ExamWorkspaceLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen relative overflow-x-hidden bg-background-light dark:bg-background-dark">
      {sidebarTopContent}
      <div className="flex-1 flex overflow-hidden relative pb-[88px] w-full">
        {mainContent}
        {sidebarGrid}
      </div>
      {footerContent && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)]">
          {footerContent}
        </div>
      )}
    </div>
  )
}
