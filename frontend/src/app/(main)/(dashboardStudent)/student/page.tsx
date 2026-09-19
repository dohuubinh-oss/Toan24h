import React from 'react'
import { cookies } from 'next/headers'
import StudentDashboardHeader from '@/components/student/StudentDashboardHeader'
import StudentProgressCard from '@/components/student/StudentProgressCard'
import StudentTopics from '@/components/student/StudentTopics'
import StudentLeaderboard from '@/components/student/StudentLeaderboard'
import StudentAchievements from '@/components/student/StudentAchievements'
import StudentDailyChallenge from '@/components/student/StudentDailyChallenge'
import { StudentDashboardData, LeaderboardUser } from '@/types/student'
import { mockStudentDashboardData } from '@/data/mockStudentData'
import { getWeeklyLeaderboard } from '@/lib/api'

export default async function StudentDashboardPage() {
  const cookieStore = await cookies()
  const userGradeCookie = cookieStore.get('userGrade')?.value
  const userNameCookie = cookieStore.get('userName')?.value

  let dashboardData: StudentDashboardData = { ...mockStudentDashboardData }

  try {
    const leaderboardRes = await getWeeklyLeaderboard(userGradeCookie)
    if (leaderboardRes && leaderboardRes.leaderboard) {
      const realLeaderboard: LeaderboardUser[] = leaderboardRes.leaderboard.map((u: any) => ({
        id: u.id,
        rank: u.rank,
        name: u.name,
        xp: String(u.weeklyXp ?? u.xp),
        isCurrentUser: !!u.isCurrentUser,
        isPro: false,
      }))

      if (realLeaderboard.length > 0) {
        dashboardData.leaderboard = realLeaderboard
      }

      if (leaderboardRes.currentUserRank) {
        const cur = leaderboardRes.currentUserRank
        dashboardData.currentUserRank = {
          id: cur.id,
          rank: cur.rank,
          name: `${cur.name} (Bạn)`,
          xp: String(cur.weeklyXp ?? cur.xp),
          isCurrentUser: true,
          isPro: true,
        }

        // Update Header stats from real user record
        const lifetimeXp = cur.lifetimeXp || 0
        const level = Math.floor(lifetimeXp / 100) + 1
        dashboardData.user = {
          ...dashboardData.user,
          name: cur.name || userNameCookie || dashboardData.user.name,
          initial: cur.name ? cur.name.charAt(0).toUpperCase() : 'H',
          level: level,
          xp: `${cur.weeklyXp || 0}`,
          streak: cur.currentStreak || 0,
        }
      }
    }
  } catch (error) {
    console.error('Failed to load real student dashboard data:', error)
  }

  return (
    <div className="space-y-8">
      <StudentDashboardHeader user={dashboardData.user} />
      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-8 space-y-8">
          <StudentProgressCard progress={dashboardData.progress} />
          <StudentTopics topics={dashboardData.topics} />
        </div>
        <div className="col-span-12 lg:col-span-4 space-y-8">
          <StudentLeaderboard leaderboard={dashboardData.leaderboard} currentUser={dashboardData.currentUserRank} />
          <StudentAchievements achievements={dashboardData.achievements} />
          <StudentDailyChallenge challenge={dashboardData.dailyChallenge} />
        </div>
      </div>
    </div>
  )
}
