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
        <Link href="/achievements" className="text-primary text-sm font-semibold hover:underline">
          Tất cả
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {achievements.map((ach) => {
          const Icon = ach.icon;
          
          if (ach.isLocked) {
            return (
              <div key={ach.id} className={`flex flex-col items-center p-4 border ${ach.borderClass} rounded-xl opacity-50 grayscale`}>
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-2">
                  <Icon className="text-slate-400" size={24} />
                </div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">{ach.title}</p>
                <p className="text-xs text-slate-500 italic">{ach.desc}</p>
              </div>
            )
          }

          return (
            <div key={ach.id} className={`flex flex-col items-center p-4 ${ach.bgClass} rounded-xl border ${ach.borderClass} text-center group cursor-pointer ${ach.shadowClass}`}>
              <div className={`w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-2 group-hover:scale-110 transition-transform ${ach.iconBorderClass}`}>
                <Icon className={ach.textClass} size={24} />
              </div>
              <p className={`text-xs font-medium ${ach.textClass} uppercase tracking-wider mb-1`}>{ach.title}</p>
              <p className="text-xs text-slate-500">{ach.desc}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
