import React from 'react'
import { Info, Trophy, Award } from 'lucide-react'
import { LeaderboardUser } from '@/types/student'

interface Props {
  leaderboard: LeaderboardUser[]
  currentUser: LeaderboardUser
}

export default function StudentLeaderboard({ leaderboard, currentUser }: Props) {
  return (
    <section className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-slate-800">Bảng xếp hạng</h3>
        <Info className="text-slate-400 cursor-pointer hover:text-primary transition-colors" size={20} />
      </div>
      <div className="space-y-4">
        {leaderboard.map((user) => (
          <div key={user.id} className={`flex items-center gap-4 p-3 ${user.rank === 1 ? 'bg-slate-50 rounded-xl' : 'border border-transparent'}`}>
            <span className={`font-bold w-4 text-center ${user.rank === 1 ? 'text-amber-600' : 'text-slate-400'}`}>{user.rank}</span>
            <div className="w-10 h-10 rounded-full bg-slate-200" />
            <div className="flex-1">
              <p className="font-bold text-sm">{user.name}</p>
              <p className="text-xs text-slate-500">{user.xp} XP</p>
            </div>
            {user.rank === 1 && <Trophy className="text-amber-500" size={16} />}
          </div>
        ))}

        {/* Current User */}
        <div className="flex items-center gap-4 p-3 bg-gradient-to-br from-blue-50 to-amber-50 border border-amber-200/50 rounded-xl shadow-[0_0_15px_-3px_rgba(252,211,77,0.4)]">
          <span className="font-bold text-primary w-4 text-center">{currentUser.rank}</span>
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold border-2 border-white shadow-sm">
              {currentUser.name.charAt(currentUser.name.indexOf('(') + 1) || currentUser.name.charAt(0)}
            </div>
            {currentUser.isPro && <Award className="absolute -top-1 -right-1 text-amber-500 fill-amber-500" size={14} />}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-bold text-sm">{currentUser.name}</p>
              {currentUser.isPro && <span className="text-xs font-medium uppercase tracking-wider bg-amber-400 text-white px-1.5 py-0.5 rounded-sm">PRO</span>}
            </div>
            <p className="text-xs text-primary font-bold">{currentUser.xp} XP</p>
          </div>
          <span className="text-xs font-medium uppercase tracking-wider text-white px-2 py-1 bg-primary rounded-md shadow-sm">BẠN</span>
        </div>
      </div>
      <button className="w-full mt-6 h-12 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
        Xem toàn bộ
      </button>
    </section>
  )
}
