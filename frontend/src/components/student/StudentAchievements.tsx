import React from 'react'
import Link from 'next/link'
import { AchievementData } from '@/types/student'

interface Props {
  achievements: AchievementData[]
}

export default function StudentAchievements({ achievements }: Props) {
  return (
    <section className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-slate-800">Thành tích</h3>
        <Link href="/achievements" className="text-primary text-sm font-semibold hover:underline min-h-[44px] flex items-center">
          Tất cả
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {achievements.map((ach) => {
          const Icon = ach.icon;
          
          if (ach.isLocked) {
            return (
              <div key={ach.id} className="flex flex-col items-center p-4 border border-slate-200/80 bg-slate-50/60 rounded-xl">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-2 text-slate-400">
                  <Icon size={24} aria-hidden="true" />
                </div>
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">{ach.title}</p>
                <p className="text-xs text-slate-500 italic text-center leading-relaxed">{ach.desc}</p>
              </div>
            )
          }

          return (
            <div key={ach.id} className={`flex flex-col items-center p-4 ${ach.bgClass} rounded-xl border ${ach.borderClass} text-center shadow-xs`}>
              <div className={`w-12 h-12 bg-white rounded-full shadow-xs flex items-center justify-center mb-2 ${ach.iconBorderClass}`}>
                <Icon className={ach.textClass} size={24} aria-hidden="true" />
              </div>
              <p className={`text-xs font-bold ${ach.textClass} uppercase tracking-wider mb-1`}>{ach.title}</p>
              <p className="text-xs text-slate-600 text-center leading-relaxed">{ach.desc}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
