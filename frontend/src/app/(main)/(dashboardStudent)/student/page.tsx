import React from 'react'
import { cookies } from 'next/headers'
import StudentDashboardHeader from '@/components/student/StudentDashboardHeader'
import StudentProgressCard from '@/components/student/StudentProgressCard'
import StudentTopics from '@/components/student/StudentTopics'
import StudentLeaderboard from '@/components/student/StudentLeaderboard'
import StudentAchievements from '@/components/student/StudentAchievements'
import StudentDailyChallenge from '@/components/student/StudentDailyChallenge'
import { StudentDashboardData, LeaderboardUser, TopicData } from '@/types/student'
import { mockStudentDashboardData } from '@/data/mockStudentData'
import { getWeeklyLeaderboard, getExams, getMyExamResults } from '@/lib/api'
import { getLecturesByGrade } from '@/lib/lectureApi'
import { getAvatarInitial } from '@/lib/utils'
import { Ruler, Shapes, TrendingUp, Brain, Flame, Award, Star } from 'lucide-react'

export default async function StudentDashboardPage() {
  const cookieStore = await cookies()
  const userGradeCookie = cookieStore.get('userGrade')?.value
  const userNameCookie = cookieStore.get('userName')?.value
  const token = cookieStore.get('accessToken')?.value

  let dashboardData: StudentDashboardData = { ...mockStudentDashboardData }

  try {
    const [leaderboardRes, examsData, mySubmissions, lecturesRes] = await Promise.all([
      getWeeklyLeaderboard(userGradeCookie).catch(() => null),
      getExams().catch(() => []),
      token ? getMyExamResults(token).catch(() => []) : Promise.resolve([]),
      getLecturesByGrade(userGradeCookie || '9', 1, 50).catch(() => ({ data: [] })),
    ])

    // 1. Leaderboard & User Stats
    if (leaderboardRes && leaderboardRes.leaderboard) {
      const realLeaderboard: LeaderboardUser[] = leaderboardRes.leaderboard.map((u: any) => ({
        id: u.id,
        rank: u.rank,
        name: u.name,
        xp: String(u.weeklyXp ?? u.xp ?? 0),
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
          xp: String(cur.weeklyXp ?? cur.xp ?? 0),
          isCurrentUser: true,
          isPro: cur.isPro ?? true,
        }

        const lifetimeXp = cur.lifetimeXp || 0
        const level = Math.floor(lifetimeXp / 100) + 1
        const name = cur.name || userNameCookie || dashboardData.user.name
        dashboardData.user = {
          ...dashboardData.user,
          name,
          initial: getAvatarInitial(name, 'H'),
          level,
          xp: `${cur.weeklyXp || 0}`,
          streak: cur.currentStreak || 0,
          grade: userGradeCookie || '8',
        }
      } else {
        dashboardData.user = {
          ...dashboardData.user,
          grade: userGradeCookie || '8',
        }
      }
    }

    const sortedSubs = Array.isArray(mySubmissions)
      ? [...mySubmissions].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      : []

    // 2. Progress Card (Bài làm hoặc Đề gần nhất)
    if (sortedSubs.length > 0) {
      const latestSub = sortedSubs[0]
      const matchedExam = (examsData as any[]).find((e: any) => e.id === latestSub.examId)
      const isGraded = latestSub.status === 'graded' || latestSub.status === 'needs_review'
      const score = Number(latestSub.totalScore) || 0
      const pct = Math.min(100, Math.max(10, Math.round((score / 10) * 100)))

      let tag = 'Đang làm dở'
      let description = 'Bạn có bài kiểm tra chưa hoàn thành. Hãy tiếp tục làm bài để ghi nhận điểm số nhé!'
      let actionText = 'Tiếp tục làm bài'
      let actionHref = `/exam/${latestSub.examId}/take`

      if (isGraded && score >= 9.0) {
        tag = 'Đã làm chủ'
        description = `Xuất sắc! Bạn đạt ${score}/10 điểm ở đề này. Hãy chinh phục các đề kiểm tra tiếp theo để thăng hạng nhé!`
        actionText = 'Chinh phục đề mới'
        actionHref = userGradeCookie ? `/exams/lop/${userGradeCookie}` : '/exams'
      } else if (isGraded) {
        tag = 'Cần ôn luyện'
        description = `Bạn đạt ${score}/10 điểm ở lần làm gần nhất. Hãy làm lại để bứt phá đạt điểm tối đa!`
        actionText = 'Làm lại bài thi'
        actionHref = `/exam/${latestSub.examId}/take`
      }

      dashboardData.progress = {
        tag,
        title: matchedExam?.title || 'Đề kiểm tra ôn luyện',
        description,
        percentage: pct,
        actionText,
        actionHref,
      }
    } else {
      const gradeExams = (examsData as any[]).filter(
        (e: any) => !userGradeCookie || e.grade === userGradeCookie
      )
      const firstExam = gradeExams[0] || (examsData as any[])[0]
      if (firstExam) {
        dashboardData.progress = {
          tag: 'Đang học tiếp',
          title: firstExam.title,
          description: 'Bắt đầu làm bài tập trắc nghiệm để tích lũy kinh nghiệm XP và tăng chuỗi ngày học Streak ngay hôm nay!',
          percentage: 0,
          actionText: 'Bắt đầu học ngay',
          actionHref: `/exam/${firstExam.id}/take`,
        }
      }
    }

    // 3. Topics (Phân loại theo Category thực tế trong DB)
    const lectures = lecturesRes?.data || []
    if (lectures.length > 0) {
      const catMap: Record<string, any[]> = {}
      lectures.forEach((l: any) => {
        const cat = l.category || 'Chuyên đề ôn tập'
        if (!catMap[cat]) catMap[cat] = []
        catMap[cat].push(l)
      })

      const palette = [
        {
          color: 'orange',
          bgClass: 'bg-orange-100',
          textClass: 'text-orange-600',
          progressBgClass: 'bg-orange-500',
          icon: Ruler,
        },
        {
          color: 'green',
          bgClass: 'bg-green-100',
          textClass: 'text-green-600',
          progressBgClass: 'bg-green-500',
          icon: Shapes,
        },
        {
          color: 'purple',
          bgClass: 'bg-purple-100',
          textClass: 'text-purple-600',
          progressBgClass: 'bg-purple-500',
          icon: TrendingUp,
        },
      ]

      const realTopics: TopicData[] = Object.keys(catMap).slice(0, 3).map((catName, idx) => {
        const catLectures = catMap[catName]
        const styling = palette[idx % palette.length]

        let completedCount = 0
        catLectures.forEach((lec: any) => {
          const lecExams = (examsData as any[]).filter((e: any) => e.lectureId === lec.id)
          const isLecDone = lecExams.some((e: any) => 
            sortedSubs.some((s: any) => s.examId === e.id && Number(s.totalScore) >= 6.5)
          )
          if (isLecDone) completedCount++
        })

        const progressPct = catLectures.length > 0 
          ? Math.round((completedCount / catLectures.length) * 100) 
          : 0

        return {
          id: `topic-${idx}`,
          title: catName,
          stats: `${catLectures.length} Bài học & Chuyên đề`,
          progress: progressPct,
          icon: styling.icon,
          color: styling.color,
          bgClass: styling.bgClass,
          textClass: styling.textClass,
          progressBgClass: styling.progressBgClass,
          href: `/lectures/lop/${userGradeCookie || '9'}`,
        }
      })

      if (realTopics.length > 0) {
        dashboardData.topics = realTopics
      }
    }

    // 4. Daily Challenge (Kiểm tra xem hôm nay học sinh đã làm bài nộp nào chưa)
    const todayStr = new Date().toISOString().slice(0, 10)
    const doneToday = sortedSubs.some((s: any) => {
      if (!s.createdAt) return false
      return new Date(s.createdAt).toISOString().slice(0, 10) === todayStr
    })

    dashboardData.dailyChallenge = {
      title: 'Thử thách ngày',
      description: doneToday
        ? 'Tuyệt vời! Bạn đã hoàn thành bài tập hôm nay và duy trì chuỗi ngày học.'
        : 'Hoàn thành ít nhất 1 bài tập trắc nghiệm hôm nay để duy trì chuỗi Streak!',
      completed: doneToday ? 1 : 0,
      total: 1,
      percentage: doneToday ? 100 : 0,
    }

    // 5. Achievements (Dựa theo số bài nộp, streak, điểm cao nhất và XP)
    const cur = leaderboardRes?.currentUserRank
    const userStreak = cur?.currentStreak || 0
    const totalSubs = sortedSubs.length
    const maxScore = sortedSubs.reduce(
      (max: number, s: any) => Math.max(max, Number(s.totalScore) || 0),
      0
    )
    const lifetimeXp = cur?.lifetimeXp || 0

    dashboardData.achievements = [
      {
        id: 'logic-master',
        title: 'Thực chiến 10 đề',
        desc: totalSubs >= 10 ? `Đã hoàn thành ${totalSubs} bài nộp` : `Đã làm ${totalSubs}/10 bài nộp`,
        icon: Brain,
        bgClass: 'bg-primary/5',
        borderClass: 'border-primary/10',
        shadowClass: 'shadow-xs',
        textClass: 'text-primary',
        iconBorderClass: '',
        isLocked: totalSubs < 10,
      },
      {
        id: 'streak-7',
        title: 'Chăm chỉ 7 ngày',
        desc: userStreak >= 7 ? `Đạt chuỗi ${userStreak} ngày liên tục` : `Chuỗi hiện tại: ${userStreak}/7 ngày`,
        icon: Flame,
        bgClass: 'bg-orange-50',
        borderClass: 'border-orange-100',
        shadowClass: '',
        textClass: 'text-orange-600',
        iconBorderClass: '',
        isLocked: userStreak < 7,
      },
      {
        id: 'perfect-10',
        title: 'Điểm 10 Đỉnh cao',
        desc: maxScore >= 9.5 ? 'Đã đạt điểm xuất sắc 10/10' : 'Cần đạt điểm từ 9.5 trở lên',
        icon: Star,
        bgClass: 'bg-amber-50',
        borderClass: 'border-amber-100',
        shadowClass: '',
        textClass: 'text-amber-600',
        iconBorderClass: '',
        isLocked: maxScore < 9.5,
      },
      {
        id: 'xp-500',
        title: 'Chiến binh 500 XP',
        desc: lifetimeXp >= 500 ? `Đã tích lũy ${lifetimeXp} XP` : `Tích lũy ${lifetimeXp}/500 XP`,
        icon: Award,
        bgClass: 'bg-indigo-50',
        borderClass: 'border-indigo-100',
        shadowClass: '',
        textClass: 'text-indigo-600',
        iconBorderClass: '',
        isLocked: lifetimeXp < 500,
      },
    ]
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
