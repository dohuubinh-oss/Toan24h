import React from 'react'
import { ArrowRight, Calculator } from 'lucide-react'
import { ProgressData } from '@/types/student'

interface Props {
  progress: ProgressData
}

export default function StudentProgressCard({ progress }: Props) {
  return (
    <section className="relative overflow-hidden bg-primary rounded-2xl p-8 text-white shadow-md">
      <div className="relative z-10 flex justify-between items-start">
        <div className="max-w-md">
          <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold uppercase tracking-widest">{progress.tag}</span>
          <h3 className="text-3xl font-bold mt-4 mb-2">{progress.title}</h3>
          <p className="text-white/80 mb-6">{progress.description}</p>
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span>Tiến độ chương</span>
              <span className="font-bold">{progress.percentage}%</span>
            </div>
            <div 
              role="progressbar" 
              aria-valuenow={progress.percentage} 
              aria-valuemin={0} 
              aria-valuemax={100}
              className="w-full bg-white/20 h-2.5 rounded-full overflow-hidden"
            >
              <div className="bg-white h-full shadow-[0_0_10px_white]" style={{ width: `${progress.percentage}%` }}></div>
            </div>
          </div>
          <button className="bg-white text-primary px-8 h-12 rounded-lg font-bold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
            {progress.actionText} <ArrowRight size={18} />
          </button>
        </div>
        <div className="hidden lg:block opacity-20">
          <Calculator size={120} />
        </div>
      </div>
      <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
      <div className="absolute -left-16 -top-16 w-48 h-48 bg-white/5 rounded-full blur-2xl"></div>
    </section>
  )
}
