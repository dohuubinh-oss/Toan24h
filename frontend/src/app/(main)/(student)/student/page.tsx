import React from 'react'
import { cookies } from 'next/headers'
import StudentDashboardHeader from '@/components/student/StudentDashboardHeader'
import StudentProgressCard from '@/components/student/StudentProgressCard'
import StudentTopics from '@/components/student/StudentTopics'
import StudentLeaderboard from '@/components/student/StudentLeaderboard'
import StudentAchievements from '@/components/student/StudentAchievements'
import StudentDailyChallenge from '@/components/student/StudentDailyChallenge'
import { StudentDashboardData, LeaderboardUser, TopicData } from '@/types/student'
import { getWeeklyLeaderboard, getExams, getMyExamResults } from '@/lib/api'
import { getUserProfile } from '@/lib/authApi'
import { getLecturesByGrade } from '@/lib/lectureApi'
import { getAvatarInitial } from '@/lib/utils'
import { Ruler, Shapes, TrendingUp, Brain, Flame, Award, Star } from 'lucide-react'

export default async function StudentDashboardPage() {
  const cookieStore = await cookies()
  const userGradeCookie = cookieStore.get('userGrade')?.value
  const userNameCookie = cookieStore.get('userName')?.value
  const token = cookieStore.get('accessToken')?.value

  // Fetch real data in parallel from backend APIs
  const [profileRes, leaderboardRes, examsData, mySubmissions, lecturesRes] = await Promise.all([
    token ? getUserProfile(token).catch(() => null) : Promise.resolve(null),
    getWeeklyLeaderboard(userGradeCookie, token).catch(() => null),
    getExams().catch(() => []),
    token ? getMyExamResults(token).catch(() => []) : Promise.resolve([]),
    getLecturesByGrade(userGradeCookie || '9', 1, 50).catch(() => ({ data: [] })),
  ])

  // 1. User & Identity Stats from Database
  const profile = profileRes?.data || null
  const effectiveGrade = profile?.grade || userGradeCookie || '9'
  const isPro = profile?.expiresAt ? new Date(profile.expiresAt) > new Date() : false
  const studentName = profile?.fullName || userNameCookie || 'Học sinh'
  const cur = leaderboardRes?.currentUserRank

  const lifetimeXp = cur?.lifetimeXp ?? profile?.points ?? 0
  const weeklyXp = cur?.weeklyXp ?? profile?.points ?? 0
  const userStreak = cur?.currentStreak ?? 0
  const level = Math.max(1, Math.floor(lifetimeXp / 100) + 1)

  const user = {
    name: studentName,
    initial: getAvatarInitial(studentName, 'H'),
    isPro,
    planName: isPro ? 'Toán 6789 VIP' : 'Học sinh',
    greeting: 'Chào bạn',
    subtitle: 'Cùng chinh phục mục tiêu hôm nay nhé!',
    level,
    xp: `${weeklyXp}`,
    streak: userStreak,
    grade: effectiveGrade,
  }

  // 2. Leaderboard from Database
  const realLeaderboard: LeaderboardUser[] = (leaderboardRes?.leaderboard || []).map((u: any) => ({
    id: String(u.id),
    rank: u.rank,
    name: u.name,
    xp: String(u.weeklyXp ?? u.xp ?? 0),
    isCurrentUser: !!u.isCurrentUser,
    isPro: false,
  }))

  const currentUserRank: LeaderboardUser = cur ? {
    id: String(cur.id),
    rank: cur.rank,
    name: `${cur.name} (Bạn)`,
    xp: String(cur.weeklyXp ?? cur.xp ?? 0),
    isCurrentUser: true,
    isPro,
  } : {
    id: profile?.id ? String(profile.id) : 'current',
    rank: 1,
    name: `${studentName} (Bạn)`,
    xp: `${weeklyXp}`,
    isCurrentUser: true,
    isPro,
  }

  // 3. Submissions & Progress Card from Database
  const sortedSubs = Array.isArray(mySubmissions)
    ? [...mySubmissions].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    : []

  let progress = {
    tag: 'Đang học tiếp',
    title: `Toán học ${effectiveGrade === 'chuyen' ? 'Chuyên' : `Lớp ${effectiveGrade}`}`,
    description: 'Bắt đầu làm bài tập trắc nghiệm để tích lũy kinh nghiệm XP và tăng chuỗi ngày học Streak ngay hôm nay!',
    percentage: 0,
    actionText: 'Bắt đầu học ngay',
    actionHref: `/exams/lop/${effectiveGrade}`,
  }

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
      actionHref = `/exams/lop/${effectiveGrade}`
    } else if (isGraded) {
      tag = 'Cần ôn luyện'
      description = `Bạn đạt ${score}/10 điểm ở lần làm gần nhất. Hãy làm lại để bứt phá đạt điểm tối đa!`
      actionText = 'Làm lại bài thi'
      actionHref = `/exam/${latestSub.examId}/take`
    }

    progress = {
      tag,
      title: matchedExam?.title || 'Đề kiểm tra ôn luyện',
      description,
      percentage: pct,
      actionText,
      actionHref,
    }
  } else {
    const gradeExams = (examsData as any[]).filter(
      (e: any) => !effectiveGrade || e.grade === effectiveGrade
    )
    const firstExam = gradeExams[0] || (examsData as any[])[0]
    if (firstExam) {
      progress = {
        tag: 'Đang học tiếp',
        title: firstExam.title,
        description: 'Bắt đầu làm bài tập trắc nghiệm để tích lũy kinh nghiệm XP và tăng chuỗi ngày học Streak ngay hôm nay!',
        percentage: 0,
        actionText: 'Bắt đầu học ngay',
        actionHref: `/exam/${firstExam.id}/take`,
      }
    }
  }

  // 4. Topics (Phân loại theo Category thực tế từ DB)
  const lectures = lecturesRes?.data || []
  let topics: TopicData[] = []

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

  if (lectures.length > 0) {
    const catMap: Record<string, any[]> = {}
    lectures.forEach((l: any) => {
      const cat = l.category || 'Chuyên đề ôn tập'
      if (!catMap[cat]) catMap[cat] = []
      catMap[cat].push(l)
    })

    topics = Object.keys(catMap).slice(0, 3).map((catName, idx) => {
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
        href: `/lectures/lop/${effectiveGrade}`,
      }
    })
  } else {
    // Phân môn chuẩn GDPT khi DB chưa có bài giảng nào
    topics = [
      {
        id: 'topic-algebra',
        title: 'Số và Đại số',
        stats: 'Chương trình chuẩn GDPT',
        progress: 0,
        icon: Ruler,
        color: 'orange',
        bgClass: 'bg-orange-100',
        textClass: 'text-orange-600',
        progressBgClass: 'bg-orange-500',
        href: `/lectures/lop/${effectiveGrade}`,
      },
      {
        id: 'topic-geometry',
        title: 'Hình học & Đo lường',
        stats: 'Chương trình chuẩn GDPT',
        progress: 0,
        icon: Shapes,
        color: 'green',
        bgClass: 'bg-green-100',
        textClass: 'text-green-600',
        progressBgClass: 'bg-green-500',
        href: `/lectures/lop/${effectiveGrade}`,
      },
      {
        id: 'topic-stats',
        title: 'Thống kê & Xác suất',
        stats: 'Chương trình chuẩn GDPT',
        progress: 0,
        icon: TrendingUp,
        color: 'purple',
        bgClass: 'bg-purple-100',
        textClass: 'text-purple-600',
        progressBgClass: 'bg-purple-500',
        href: `/lectures/lop/${effectiveGrade}`,
      },
    ]
  }

  // 5. Daily Challenge (Kiểm tra xem hôm nay học sinh đã làm bài nộp nào chưa)
  const todayStr = new Date().toISOString().slice(0, 10)
  const doneToday = sortedSubs.some((s: any) => {
    if (!s.createdAt) return false
    return new Date(s.createdAt).toISOString().slice(0, 10) === todayStr
  })

  const dailyChallenge = {
    title: 'Thử thách ngày',
    description: doneToday
      ? 'Tuyệt vời! Bạn đã hoàn thành bài tập hôm nay và duy trì chuỗi ngày học.'
      : 'Hoàn thành ít nhất 1 bài tập trắc nghiệm hôm nay để duy trì chuỗi Streak!',
    completed: doneToday ? 1 : 0,
    total: 1,
    percentage: doneToday ? 100 : 0,
  }

  // 6. Achievements (Dựa theo số bài nộp, streak, điểm cao nhất và XP thực tế)
  const totalSubs = sortedSubs.length
  const maxScore = sortedSubs.reduce(
    (max: number, s: any) => Math.max(max, Number(s.totalScore) || 0),
    0
  )

  const achievements = [
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

  const dashboardData: StudentDashboardData = {
    user,
    topics,
    progress,
    leaderboard: realLeaderboard,
    currentUserRank,
    achievements,
    dailyChallenge,
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
