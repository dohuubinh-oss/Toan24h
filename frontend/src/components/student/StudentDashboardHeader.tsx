import React from 'react'
import { Award, Star, Zap, Flame } from 'lucide-react'
import { UserData } from '@/types/student'

interface Props {
  user: UserData
}

export default function StudentDashboardHeader({ user }: Props) {
  return (
    <header className="flex items-center justify-between mb-8 p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-amber-50 border border-slate-200/60 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="relative">
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
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-slate-800">{user.greeting}, {user.name}!</h2>
            {user.isPro && (
              <span className="bg-gradient-to-r from-amber-400 to-orange-400 text-white text-xs font-medium uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm">PRO</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-amber-600">{user.planName}</span>
            <span className="text-slate-400">•</span>
            <p className="text-slate-500 text-sm">{user.subtitle}</p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-6 bg-white/60 backdrop-blur-md px-6 py-3 rounded-xl border border-white/50 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-amber-100 rounded-full shadow-[0_0_15px_-3px_rgba(252,211,77,0.4)]">
            <Star className="text-amber-600" size={20} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider leading-none">Cấp độ</p>
            <p className="text-lg font-bold text-slate-700 leading-tight mt-1">{user.level}</p>
          </div>
        </div>
        <div className="h-8 w-px bg-slate-200"></div>
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-100 rounded-full shadow-[0_0_15px_-3px_rgba(252,211,77,0.4)]">
            <Zap className="text-primary" size={20} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider leading-none">Kinh nghiệm</p>
            <p className="text-lg font-bold text-slate-700 leading-tight mt-1">{user.xp} XP</p>
          </div>
        </div>
        <div className="h-8 w-px bg-slate-200"></div>
        <div className="flex items-center gap-2">
          <div className="p-2 bg-orange-100 rounded-full">
            <Flame className="text-orange-500" size={20} />
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
