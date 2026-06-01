'use client'

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, Database, ClipboardList, Users, BookOpen, Trophy, PenTool
} from 'lucide-react';

export type SidebarRole = 'student' | 'teacher';

export interface SidebarProps {
  role: SidebarRole;
  filterNode?: React.ReactNode;
}

const STUDENT_LINKS = [
  { href: '/student', icon: LayoutDashboard, label: 'Dashboard', matchPrefix: false },
  { href: '/lectures', icon: BookOpen, label: 'Bài học', matchPrefix: true },
  { href: '/practices', icon: PenTool, label: 'Luyện tập', matchPrefix: true },
  { href: '/leaderboard', icon: Trophy, label: 'Bảng xếp hạng', matchPrefix: true },
];

const TEACHER_LINKS = [
  { href: '/dashboard/questions', icon: Database, label: 'Ngân hàng câu hỏi', matchPrefix: true },
  { href: '/dashboard/exams', icon: ClipboardList, label: 'Ngân hàng đề thi', matchPrefix: true },
  { href: '/dashboard/users', icon: Users, label: 'Quản lý người dùng', matchPrefix: true },
];

export default function Sidebar({ role, filterNode }: SidebarProps) {
  const pathname = usePathname();

  // Hide sidebar on specific "create" pages to maximize focus area
  if (pathname === '/dashboard/questions/create' || pathname === '/dashboard/exams/create') {
    return null;
  }
  
  const links = role === 'student' ? STUDENT_LINKS : TEACHER_LINKS;

  return (
    <aside className="w-64 border-r border-slate-200 hidden md:block bg-white shrink-0">
      <nav className="p-4 space-y-6">
        <div className="space-y-1">
          {links.map(link => {
            const isActive = link.matchPrefix 
              ? pathname?.startsWith(link.href) 
              : pathname === link.href;
            
            const Icon = link.icon;

            return (
              <Link 
                key={link.href}
                href={link.href} 
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${isActive ? 'bg-primary/5 text-primary border-r-4 border-primary font-bold' : 'text-slate-600 hover:bg-slate-50 font-medium'}`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm">{link.label}</span>
              </Link>
            );
          })}
        </div>
        
        {filterNode && (
          <React.Suspense fallback={<div className="h-10 animate-pulse bg-slate-100 rounded-md m-3"></div>}>
            {filterNode}
          </React.Suspense>
        )}
      </nav>
    </aside>
  );
}
