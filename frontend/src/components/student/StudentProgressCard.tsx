import React from 'react'
import { ArrowRight, Compass, Target } from 'lucide-react'
import { ProgressData } from '@/types/student'

interface Props {
  progress: ProgressData
}

export default function StudentProgressCard({ progress }: Props) {
  return (
    <section className="relative overflow-hidden bg-primary rounded-2xl p-6 sm:p-8 text-white shadow-sm border border-blue-600/30">
      <div className="relative z-10 flex justify-between items-start">
        <div className="max-w-md">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold uppercase tracking-wider">
              {progress.tag}
            </span>
            {progress.milestoneTitle && (
              <span className="px-3 py-1 bg-white/15 border border-white/30 rounded-full text-xs font-semibold text-blue-100 flex items-center gap-1.5">
                <Target size={14} className="text-amber-300" aria-hidden="true" />
                <span>{progress.milestoneTitle}</span>
              </span>
            )}
          </div>
          <h3 className="text-2xl sm:text-3xl font-bold mt-2 mb-2 tracking-tight text-white">{progress.title}</h3>
          <p className="text-blue-100 text-sm sm:text-base leading-relaxed mb-6">{progress.description}</p>
          <div className="mb-6">
            <div className="flex justify-between text-xs sm:text-sm mb-2 font-medium">
              <span className="text-blue-100">{progress.milestoneStats || 'Tiến độ bài học'}</span>
              <span className="font-bold text-white">{progress.percentage}%</span>
            </div>
            <div 
              role="progressbar" 
              aria-valuenow={progress.percentage} 
              aria-valuemin={0} 
              aria-valuemax={100}
              aria-label="Tiến độ bài học"
              className="w-full bg-white/20 h-2.5 rounded-full overflow-hidden"
            >
              <div className="bg-white h-full rounded-full transition-all duration-500" style={{ width: `${progress.percentage}%` }}></div>
            </div>
          </div>
          {progress.actionHref ? (
            <a 
              href={progress.actionHref}
              className="bg-white text-primary px-8 min-h-[44px] h-12 rounded-xl font-bold hover:bg-slate-50 transition-all inline-flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <span>{progress.actionText}</span> <ArrowRight size={18} aria-hidden="true" />
            </a>
          ) : (
            <button className="bg-white text-primary px-8 min-h-[44px] h-12 rounded-xl font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
              <span>{progress.actionText}</span> <ArrowRight size={18} aria-hidden="true" />
            </button>
          )}
        </div>
        <div className="hidden lg:block opacity-15" aria-hidden="true">
          <Compass size={120} strokeWidth={1.5} />
        </div>
      </div>
      <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
      <div className="absolute -left-16 -top-16 w-48 h-48 bg-white/5 rounded-full blur-xl pointer-events-none"></div>
    </section>
  )
}
