import React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getExams, getMyExamResults } from '@/lib/api'
import {
  determineCurrentMilestone,
  groupExamsByMilestone,
} from '@/lib/examMilestoneProgression'
import { StudentExamListClient } from '@/components/exams/StudentExamListClient'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ grade: string }>
}): Promise<Metadata> {
  const { grade } = await params
  return {
    title: `Đề Thi Toán Lớp ${grade} - Đề Thi Thử & Đề Kiểm Tra Có Lời Giải Chi Tiết`,
    description: `Kho đề thi Toán lớp ${grade} bám sát chương trình GDPT mới: Giữa kì 1, Cuối kì 1, Giữa kì 2, Cuối kì 2 và Chuyên đề ôn tập nâng cao có đáp án và lời giải chi tiết.`,
    alternates: {
      canonical: `/exams/lop/${grade}`,
    },
  }
}

export default async function GradeExamsPage({
  params,
}: {
  params: Promise<{ grade: string }>
}) {
  const { grade } = await params

  // 1. Kiểm tra quyền hạn khối lớp theo gói học sinh (Bảo vệ bản quyền & phân luồng đúng lớp)
  const cookieStore = await cookies()
  const userGradeCookie = cookieStore.get('userGrade')
  const userRoleCookie = cookieStore.get('userRole')

  if (
    userRoleCookie?.value === 'student' &&
    userGradeCookie &&
    userGradeCookie.value !== grade &&
    userGradeCookie.value !== ''
  ) {
    redirect(`/exams/lop/${userGradeCookie.value}`)
  }

  const token = cookieStore.get('accessToken')?.value

  // 2. Fetch song song dữ liệu đề thi và bài làm của học sinh
  let examsData: any[] = []
  let submissionsData: any[] = []

  try {
    const [fetchedExams, fetchedSubmissions] = await Promise.all([
      getExams({ grade }).catch((err) => {
        console.error('Failed to load exams for grade', grade, err)
        return []
      }),
      token
        ? getMyExamResults(token).catch((err) => {
            if (!err?.message?.includes('Invalid or expired token') && !err?.message?.includes('401')) {
              console.error('Failed to load exam submissions', err)
            }
            return []
          })
        : Promise.resolve([]),
    ])

    examsData = Array.isArray(fetchedExams) ? fetchedExams : []
    submissionsData = Array.isArray(fetchedSubmissions) ? fetchedSubmissions : []
  } catch (error) {
    console.error('Unexpected error loading exams page data', error)
  }

  // Lọc đề thi đúng khối lớp hiện tại (đề phòng trường hợp API trả về toàn bộ)
  const gradeExams = examsData.filter(
    (exam: any) => !exam.grade || String(exam.grade) === String(grade)
  )

  // 3. Tính toán chặng mục tiêu hiện tại của học sinh theo logic cuốn chiếu
  const currentMilestone = determineCurrentMilestone(submissionsData, gradeExams)

  // 4. Gom nhóm đề thi theo 5 chặng
  const examsByMilestone = groupExamsByMilestone(gradeExams)

  // 5. Tính toán map bài nộp điểm cao nhất cho từng đề thi
  const bestSubmissions: Record<string, any> = {}
  for (const sub of submissionsData) {
    if (!sub) continue
    const examId = sub.examId || sub.exam_id || sub.exam?.id
    if (!examId) continue
    const strId = String(examId)
    const score = Number(sub.score ?? sub.totalScore ?? 0)
    const existing = bestSubmissions[strId]
    const existingScore = Number(existing?.score ?? existing?.totalScore ?? -1)
    if (!existing || score > existingScore) {
      bestSubmissions[strId] = sub
    }
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500">
        <Link
          href="/student"
          className="hover:text-primary transition-colors min-h-[44px] flex items-center"
        >
          Dashboard
        </Link>
        <ChevronRight className="w-3 h-3 text-slate-400" aria-hidden="true" />
        <span
          className="text-slate-900 font-semibold min-h-[44px] flex items-center"
          aria-current="page"
        >
          Luyện đề Toán Lớp {grade}
        </span>
      </nav>

      {/* Tiêu đề trang & Mô tả */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Luyện Đề Thi Toán Lớp {grade}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Hệ thống đề thi chuẩn cấu trúc GDPT mới chia theo 5 chặng: Giữa kì 1, Cuối kì 1, Giữa kì 2, Cuối kì 2 và Chuyên đề ôn tập.
          </p>
        </div>
      </div>

      {/* Khu vực danh sách đề thi theo chặng (Client Component) */}
      <StudentExamListClient
        grade={grade}
        currentMilestone={currentMilestone}
        examsByMilestone={examsByMilestone}
        bestSubmissions={bestSubmissions}
      />
    </div>
  )
}
