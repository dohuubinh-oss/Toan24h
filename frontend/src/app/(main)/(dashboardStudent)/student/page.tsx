import React from 'react'
import StudentDashboardHeader from '@/components/student/StudentDashboardHeader'
import StudentProgressCard from '@/components/student/StudentProgressCard'
import StudentTopics from '@/components/student/StudentTopics'
import StudentLeaderboard from '@/components/student/StudentLeaderboard'
import StudentAchievements from '@/components/student/StudentAchievements'
import StudentDailyChallenge from '@/components/student/StudentDailyChallenge'
import { StudentDashboardData } from '@/types/student'
import { mockStudentDashboardData } from '@/data/mockStudentData'

// Giả lập API Fetch Data
async function fetchStudentDashboardData(): Promise<StudentDashboardData> {
  // Simulate network delay
  // await new Promise(resolve => setTimeout(resolve, 500));
  
  return mockStudentDashboardData;
}

export default async function StudentDashboardPage() {
  const data = await fetchStudentDashboardData();

  return (
    <div className="space-y-8">
      <StudentDashboardHeader user={data.user} />
      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-8 space-y-8">
          <StudentProgressCard progress={data.progress} />
          <StudentTopics topics={data.topics} />
        </div>
        <div className="col-span-12 lg:col-span-4 space-y-8">
          <StudentLeaderboard leaderboard={data.leaderboard} currentUser={data.currentUserRank} />
          <StudentAchievements achievements={data.achievements} />
          <StudentDailyChallenge challenge={data.dailyChallenge} />
        </div>
      </div>
    </div>
  )
}
