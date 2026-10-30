'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, BookOpen, ClipboardList } from 'lucide-react'

const BOTTOM_NAV_ITEMS = [
  { href: '/student', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/lectures', label: 'Bài giảng', icon: BookOpen, exact: false },
  { href: '/exams', label: 'Đề thi', icon: ClipboardList, exact: false },
]

export default function StudentBottomNav() {
  const pathname = usePathname()

  // Hide on exam taking fullscreen pages if any
  if (pathname?.includes('/take') || pathname?.includes('/exam/')) {
    return null
  }

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-2px_10px_rgba(0,0,0,0.04)] px-2 py-1.5"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {BOTTOM_NAV_ITEMS.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname?.startsWith(item.href)

          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 min-h-[44px] min-w-[44px] flex flex-col items-center justify-center gap-1 py-1 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                isActive
                  ? 'text-primary font-bold'
                  : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
            >
              <Icon className="w-5 h-5" aria-hidden="true" />
              <span className="text-xs leading-none tracking-tight">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
