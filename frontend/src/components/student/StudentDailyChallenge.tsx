import React from 'react'
import { CheckCircle2, Target } from 'lucide-react'
import { DailyChallengeData } from '@/types/student'

interface Props {
  challenge: DailyChallengeData
}

export default function StudentDailyChallenge({ challenge }: Props) {
  const isDone = challenge.completed >= challenge.total && challenge.total > 0

  return (
    <section className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isDone ? 'bg-emerald-100 text-emerald-600' : 'bg-primary/10 text-primary'}`}>
            <CheckCircle2 size={20} aria-hidden="true" />
          </div>
          <h4 className="font-bold text-slate-800 text-base">{challenge.title}</h4>
        </div>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isDone ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-50 text-primary border border-blue-200/60'}`}>
          {isDone ? 'Hoàn thành' : 'Mục tiêu ngày'}
        </span>
      </div>
      <p className="text-sm text-slate-600 mb-4 leading-relaxed">{challenge.description}</p>
      <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-2">
        <span>Đã xong {challenge.completed}/{challenge.total}</span>
        <span className="font-bold text-slate-800">{challenge.percentage}%</span>
      </div>
      <div 
        role="progressbar"
        aria-valuenow={challenge.percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Tiến độ thử thách ngày"
        className="w-full bg-slate-100 h-2 rounded-full overflow-hidden"
      >
        <div 
          className={`h-full rounded-full transition-all duration-500 ${isDone ? 'bg-emerald-500' : 'bg-primary'}`} 
          style={{ width: `${challenge.percentage}%` }}
        ></div>
      </div>
    </section>
  )
}
