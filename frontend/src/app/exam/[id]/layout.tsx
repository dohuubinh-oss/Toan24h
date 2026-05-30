import React from 'react'
import Link from 'next/link'
import { GraduationCap, User } from 'lucide-react'

export default function ExamLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href="/dashboard" className="flex items-center gap-2">
                <div className="bg-primary text-white p-1.5 rounded-lg flex items-center justify-center">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold tracking-tight text-primary">Toán 24h</h2>
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-semibold">Học sinh</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-slate-200 border-2 border-primary/20 overflow-hidden flex items-center justify-center">
                  <User className="w-6 h-6 text-slate-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        {children}
      </main>
    </div>
  )
}
