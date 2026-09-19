import React from 'react'
import { Trophy, Award, Medal } from 'lucide-react'
import { LeaderboardUser } from '@/types/student'

interface Props {
  leaderboard: LeaderboardUser[]
  currentUser: LeaderboardUser
}

export default function StudentLeaderboard({ leaderboard, currentUser }: Props) {
  return (
    <section className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Bảng xếp hạng</h3>
          <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full mt-1 inline-block">
            Đua Top Tuần này
          </span>
        </div>
        <Trophy className="text-amber-500" size={20} />
      </div>
      <div className="space-y-3">
        {leaderboard.map((user) => {
          let rankBadge = <span className="font-bold w-5 text-center text-slate-400">{user.rank}</span>
          let rankBg = 'hover:bg-slate-50'

          if (user.rank === 1) {
            rankBadge = <span className="w-5 flex justify-center text-amber-500 font-extrabold">🥇</span>
            rankBg = 'bg-amber-50/60 border border-amber-200/60'
          } else if (user.rank === 2) {
            rankBadge = <span className="w-5 flex justify-center text-slate-400 font-extrabold">🥈</span>
            rankBg = 'bg-slate-50/80 border border-slate-200/60'
          } else if (user.rank === 3) {
            rankBadge = <span className="w-5 flex justify-center text-amber-700 font-extrabold">🥉</span>
            rankBg = 'bg-orange-50/50 border border-orange-200/60'
          }

          return (
            <div key={user.id} className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${rankBg}`}>
              {rankBadge}
              <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-slate-800 truncate">{user.name}</p>
                <p className="text-xs font-medium text-slate-500">{user.xp} XP</p>
              </div>
            </div>
          )
        })}

        {/* Current User Bar */}
        <div className="flex items-center gap-3 p-3 bg-gradient-to-br from-blue-50 to-amber-50 border border-amber-200/50 rounded-xl shadow-[0_0_15px_-3px_rgba(252,211,77,0.4)] mt-4">
          <span className="font-bold text-primary w-5 text-center">{currentUser.rank}</span>
          <div className="relative shrink-0">
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm border-2 border-white shadow-sm">
              {currentUser.name.charAt(currentUser.name.indexOf('(') + 1) || currentUser.name.charAt(0)}
            </div>
            {currentUser.isPro && <Award className="absolute -top-1 -right-1 text-amber-500 fill-amber-500" size={14} />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-bold text-sm text-slate-900 truncate">{currentUser.name}</p>
            </div>
            <p className="text-xs text-primary font-bold">{currentUser.xp} XP</p>
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-white px-2 py-1 bg-primary rounded-md shadow-sm shrink-0">BẠN</span>
        </div>
      </div>
    </section>
  )
}
