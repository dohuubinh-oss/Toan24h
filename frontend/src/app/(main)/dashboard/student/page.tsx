import React from 'react'
import StudentDashboardHeader from '@/components/student/StudentDashboardHeader'
import StudentProgressCard from '@/components/student/StudentProgressCard'
import StudentTopics from '@/components/student/StudentTopics'
import StudentLeaderboard from '@/components/student/StudentLeaderboard'
import StudentAchievements from '@/components/student/StudentAchievements'
import StudentDailyChallenge from '@/components/student/StudentDailyChallenge'

export default function StudentDashboardPage() {
  return (
    <div className="space-y-8">
      <StudentDashboardHeader />
      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-8 space-y-8">
          <StudentProgressCard />
          <StudentTopics />
        </div>
        <div className="col-span-12 lg:col-span-4 space-y-8">
          <StudentLeaderboard />
          <StudentAchievements />
          <StudentDailyChallenge />
        </div>
      </div>
    </div>
  )
}
