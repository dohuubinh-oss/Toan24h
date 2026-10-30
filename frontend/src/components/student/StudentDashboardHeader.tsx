import React from 'react'
import { Award, Star, Zap, Flame } from 'lucide-react'
import { UserData } from '@/types/student'

interface Props {
  user: UserData
}

export default function StudentDashboardHeader({ user }: Props) {
  return (
    <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8 p-6 rounded-2xl bg-gradient-to-br from-blue-50/70 to-slate-50 border border-slate-200/70 shadow-xs">
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-white text-xl font-bold border-2 border-white shadow-sm">
            {user.initial}
          </div>
          {user.isPro && (
            <div className="absolute -top-2 -right-1 text-amber-400 drop-shadow-sm">
              <Award size={24} className="fill-amber-400" />
            </div>
          )}
        </div>
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800">{user.greeting}, {user.name}!</h2>
            {user.isPro && (
              <span className="bg-gradient-to-r from-amber-400 to-orange-400 text-white text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-xs">PRO</span>
            )}
            {user.grade && (
              <span className="bg-blue-50 text-blue-600 border border-blue-200/80 text-xs font-bold px-3 py-1 rounded-full shadow-2xs">
                {user.grade === 'chuyen' ? 'Toán Chuyên' : `Toán Lớp ${user.grade}`}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="w-full md:w-auto flex items-center justify-between md:justify-start gap-3 sm:gap-6 bg-white/90 backdrop-blur-md px-4 sm:px-6 py-3 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-amber-50 rounded-full border border-amber-200/60 shadow-xs">
            <Star className="text-amber-600" size={20} aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider leading-none">Cấp độ</p>
            <p className="text-lg font-bold text-slate-700 leading-tight mt-1">{user.level}</p>
          </div>
        </div>
        <div className="h-8 w-px bg-slate-200"></div>
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-50 rounded-full border border-blue-200/60 shadow-xs">
            <Zap className="text-primary" size={20} aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider leading-none">Kinh nghiệm</p>
            <p className="text-lg font-bold text-slate-700 leading-tight mt-1">{user.xp} XP</p>
          </div>
        </div>
        <div className="h-8 w-px bg-slate-200"></div>
        <div className="flex items-center gap-2">
          <div className="p-2 bg-orange-50 rounded-full border border-orange-200/60 shadow-xs">
            <Flame className="text-orange-500" size={20} aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider leading-none">Chuỗi học</p>
            <p className="text-lg font-bold text-slate-700 leading-tight mt-1">{user.streak} Ngày</p>
          </div>
        </div>
      </div>
    </header>
  )
}
