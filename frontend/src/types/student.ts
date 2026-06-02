import { LucideIcon } from 'lucide-react'

export interface UserData {
  name: string
  initial: string
  isPro: boolean
  planName: string
  greeting: string
  subtitle: string
  level: number
  xp: string
  streak: number
}

export interface TopicData {
  id: string
  title: string
  stats: string
  progress: number
  icon: LucideIcon
  color: string
  bgClass: string
  textClass: string
  progressBgClass: string
}

export interface ProgressData {
  tag: string
  title: string
  description: string
  percentage: number
  actionText: string
}

export interface LeaderboardUser {
  id: string
  rank: number
  name: string
  xp: string
  isCurrentUser: boolean
  isPro?: boolean
}

export interface AchievementData {
  id: string
  title: string
  desc: string
  icon: LucideIcon
  bgClass: string
  borderClass: string
  shadowClass: string
  textClass: string
  iconBorderClass: string
  isLocked: boolean
}

export interface DailyChallengeData {
  title: string
  description: string
  completed: number
  total: number
  percentage: number
}

export interface StudentDashboardData {
  user: UserData
  topics: TopicData[]
  progress: ProgressData
  leaderboard: LeaderboardUser[]
  currentUserRank: LeaderboardUser
  achievements: AchievementData[]
  dailyChallenge: DailyChallengeData
}
