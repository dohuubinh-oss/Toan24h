import React from 'react'
import { CheckCircle } from 'lucide-react'
import { DailyChallengeData } from '@/types/student'

interface Props {
  challenge: DailyChallengeData
}

export default function StudentDailyChallenge({ challenge }: Props) {
  return (
    <div className="bg-gradient-to-br from-indigo-600 to-primary p-6 rounded-2xl text-white shadow-md">
      <div className="flex items-center gap-3 mb-4">
        <CheckCircle size={24} />
        <h4 className="font-bold">{challenge.title}</h4>
      </div>
      <p className="text-sm text-white/80 mb-4">{challenge.description}</p>
      <div className="flex items-center justify-between text-xs mb-2">
        <span>Đã xong {challenge.completed}/{challenge.total}</span>
        <span>{challenge.percentage}%</span>
      </div>
      <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
        <div className="bg-white h-full" style={{ width: `${challenge.percentage}%` }}></div>
      </div>
    </div>
  )
}
