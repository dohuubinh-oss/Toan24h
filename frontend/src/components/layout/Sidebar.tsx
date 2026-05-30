'use client'

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, Database, ClipboardList, Users
} from 'lucide-react';
import SidebarFilter from '../shared/SidebarFilter';

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-slate-200 hidden md:block bg-white shrink-0">
      <nav className="p-4 space-y-6">
        <div className="space-y-1">
          <Link href="/dashboard/questions" className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${pathname?.startsWith('/dashboard/questions') ? 'bg-primary/5 text-primary border-r-4 border-primary font-bold' : 'text-slate-600 hover:bg-slate-50 font-medium'}`}>
            <Database className="w-5 h-5" />
            <span className="text-sm">Ngân hàng câu hỏi</span>
          </Link>
          <Link href="/dashboard/exams" className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${pathname?.startsWith('/dashboard/exams') ? 'bg-primary/5 text-primary border-r-4 border-primary font-bold' : 'text-slate-600 hover:bg-slate-50 font-medium'}`}>
            <ClipboardList className="w-5 h-5" />
            <span className="text-sm">Ngân hàng đề thi</span>
          </Link>
          <Link href="/dashboard/users" className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${pathname?.startsWith('/dashboard/users') ? 'bg-primary/5 text-primary border-r-4 border-primary font-bold' : 'text-slate-600 hover:bg-slate-50 font-medium'}`}>
            <Users className="w-5 h-5" />
            <span className="text-sm">Quản lý người dùng</span>
          </Link>
        </div>
        
        {(pathname?.startsWith('/dashboard/questions') || pathname?.startsWith('/dashboard/exams') || pathname?.startsWith('/dashboard/users')) && (
          <div className="px-3 py-4 mt-2 border-t border-slate-100 dark:border-slate-800">
            <React.Suspense fallback={<div className="h-10 animate-pulse bg-slate-100 rounded-md m-3"></div>}>
              <SidebarFilter />
            </React.Suspense>
          </div>
        )}
      </nav>
    </aside>
  );
}
