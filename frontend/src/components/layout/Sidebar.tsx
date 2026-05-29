'use client'

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, Database, ClipboardList, Users, 
  GraduationCap, ChevronDown, Shapes, BarChart2 
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-72 border-r border-slate-100 overflow-y-auto hidden md:block bg-page-bg shrink-0">
      <nav className="p-4 space-y-6">
        <div className="space-y-1">
          <Link href="/dashboard" className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${pathname === '/dashboard' ? 'bg-primary/5 text-primary border-r-4 border-primary font-bold' : 'text-slate-600 hover:bg-slate-50 font-medium'}`}>
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-sm">Bảng điều khiển</span>
          </Link>
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
        
        <hr className="border-slate-100" />
        
        <div className="space-y-4">
          <h3 className="px-3 text-xs font-bold uppercase tracking-wider text-slate-400">Bộ lọc chi tiết</h3>
          
          <details className="group px-3" open>
            <summary className="flex items-center justify-between cursor-pointer text-sm font-semibold py-1 hover:text-primary transition-colors list-none">
              <div className="flex items-center gap-2 text-slate-700">
                <GraduationCap className="w-5 h-5" />
                <span>Khối lớp</span>
              </div>
              <ChevronDown className="w-4 h-4 group-open:rotate-180 transition-transform" />
            </summary>
            <div className="mt-3 grid grid-cols-2 gap-2 pl-6">
              {['6', '7', '8', '9'].map(grade => (
                <label key={grade} className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer hover:text-primary transition-colors py-1">
                  <input className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4 cursor-pointer" type="checkbox" /> Lớp {grade}
                </label>
              ))}
            </div>
          </details>

          <details className="group px-3" open>
            <summary className="flex items-center justify-between cursor-pointer text-sm font-semibold py-1 hover:text-primary transition-colors list-none">
              <div className="flex items-center gap-2 text-slate-700">
                <Shapes className="w-5 h-5" />
                <span>Môn học</span>
              </div>
              <ChevronDown className="w-4 h-4 group-open:rotate-180 transition-transform" />
            </summary>
            <div className="mt-3 space-y-2 pl-6">
              {['Đại số', 'Hình học', 'Giải tích'].map(topic => (
                <label key={topic} className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer hover:text-primary transition-colors py-1">
                  <input className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4 cursor-pointer" type="checkbox" /> {topic}
                </label>
              ))}
            </div>
          </details>

          <details className="group px-3" open>
            <summary className="flex items-center justify-between cursor-pointer text-sm font-semibold py-1 hover:text-primary transition-colors list-none">
              <div className="flex items-center gap-2 text-slate-700">
                <BarChart2 className="w-5 h-5" />
                <span>Mức độ</span>
              </div>
              <ChevronDown className="w-4 h-4 group-open:rotate-180 transition-transform" />
            </summary>
            <div className="mt-3 space-y-2 pl-6">
              {['Nhận biết', 'Thông hiểu', 'Vận dụng', 'Vận dụng cao'].map(diff => (
                <label key={diff} className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer hover:text-primary transition-colors py-1">
                  <input className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4 cursor-pointer" type="checkbox" /> {diff}
                </label>
              ))}
            </div>
          </details>
        </div>
      </nav>
    </aside>
  );
}
