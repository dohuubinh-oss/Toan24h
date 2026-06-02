import React from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { TopicData } from '@/types/student'

interface Props {
  topics: TopicData[]
}

export default function StudentTopics({ topics }: Props) {
  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-slate-800">Chủ đề toán học</h3>
        <Link href="/lectures" className="text-primary font-semibold text-sm hover:underline">
          Xem tất cả
        </Link>
      </div>
      <div className="grid grid-cols-3 gap-6">
        {topics.map((topic) => {
          const Icon = topic.icon;
          return (
            <div key={topic.id} className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-sm hover:shadow-md hover:border-primary/30 transition-all group cursor-pointer flex flex-col h-full">
              <div className={`w-12 h-12 ${topic.bgClass} ${topic.textClass} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <Icon size={24} />
              </div>
              <h4 className="font-bold text-lg mb-1">{topic.title}</h4>
              <p className="text-sm text-slate-500 mb-4">{topic.stats}</p>
              <div className="w-full bg-slate-100 h-1.5 rounded-full mb-4">
                <div className={`${topic.progressBgClass} h-full rounded-full`} style={{ width: `${topic.progress}%` }}></div>
              </div>
              <div className="mt-auto">
                <button aria-label={`Tiếp tục học ${topic.title}`} className={`${topic.textClass} font-semibold text-sm flex items-center gap-1 group-hover:gap-2 transition-all min-h-[44px]`}>
                  Tiếp tục <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
