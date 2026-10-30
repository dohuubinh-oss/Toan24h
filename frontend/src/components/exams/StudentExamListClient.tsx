'use client'

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ExamMilestone,
  MILESTONES_CONFIG,
  getMilestoneInfo,
} from '@/lib/examMilestoneProgression'
import { MilestoneTabs } from '@/components/exams/MilestoneTabs'
import { Calculator, Award, ArrowRight, Sparkles, FolderOpen } from 'lucide-react'

export interface StudentExamListClientProps {
  grade: string
  currentMilestone: ExamMilestone
  examsByMilestone: Record<ExamMilestone, any[]>
  bestSubmissions: Record<string, any>
}

/**
 * Client component hiển thị giao diện luyện đề thi theo 5 chặng học tập:
 * - Tab chọn 5 chặng (MilestoneTabs).
 * - Bảng danh sách đề thi (Exam Table) đồng bộ giao diện như trang /dashboard/exams.
 * - Hỗ trợ vào thi trực tiếp, hiển thị kết quả điểm số cao nhất của học sinh.
 */
export function StudentExamListClient({
  grade,
  currentMilestone,
  examsByMilestone,
  bestSubmissions,
}: StudentExamListClientProps) {
  const router = useRouter()
  const [activeMilestone, setActiveMilestone] = useState<ExamMilestone>(currentMilestone)

  // Đếm số lượng đề thi trong mỗi chặng cho Tabs
  const counts = useMemo(() => {
    const map: Record<ExamMilestone, number> = {
      midterm_1: 0,
      final_1: 0,
      midterm_2: 0,
      final_2: 0,
      topics: 0,
    }
    for (const milestone of MILESTONES_CONFIG) {
      map[milestone.id] = examsByMilestone?.[milestone.id]?.length ?? 0
    }
    return map
  }, [examsByMilestone])

  // Lấy danh sách đề thi của chặng hiện đang chọn
  const activeExams = examsByMilestone?.[activeMilestone] ?? []

  // Tìm chỉ mục của đề thi đầu tiên chưa được làm trong chặng hiện tại để đề xuất làm bài
  const firstUnsubmittedIndex = useMemo(() => {
    return activeExams.findIndex((e) => {
      const id = e.id || e._id || ''
      return !bestSubmissions?.[String(id)]
    })
  }, [activeExams, bestSubmissions])

  const activeMilestoneInfo = getMilestoneInfo(activeMilestone)

  return (
    <div className="space-y-6">
      {/* 1. Thanh chuyển đổi 5 chặng đề thi */}
      <section aria-label="Bộ lọc chặng học tập">
        <MilestoneTabs
          activeMilestone={activeMilestone}
          currentProgressMilestone={currentMilestone}
          counts={counts}
          onSelect={(milestone) => {
            setActiveMilestone(milestone)
          }}
        />
      </section>

      {/* 2. Bảng danh sách đề thi chuẩn như trang /dashboard/exams */}
      <div
        role="tabpanel"
        id={`panel-${activeMilestone}`}
        aria-labelledby={`tab-${activeMilestone}`}
        className="bg-white rounded-xl shadow-sm border border-slate-200/60 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider w-[36%]">
                  Tên đề thi
                </th>
                <th className="px-3 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-center whitespace-nowrap">
                  Khối lớp
                </th>
                <th className="px-3 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-center whitespace-nowrap">
                  Số câu hỏi
                </th>
                <th className="px-3 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-center whitespace-nowrap">
                  Thời gian
                </th>
                <th className="px-3 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-center whitespace-nowrap">
                  Phân loại
                </th>
                <th className="px-3 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-center whitespace-nowrap">
                  Loại đề
                </th>
                <th className="px-3 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-center whitespace-nowrap">
                  Kết quả
                </th>
                <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-right whitespace-nowrap">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activeExams.map((exam, index) => {
                const examId = exam.id || exam._id || ''
                const bestSub = examId ? bestSubmissions?.[String(examId)] : null
                const isRec =
                  Boolean(exam.isRecommended) ||
                  (activeMilestone === currentMilestone && index === firstUnsubmittedIndex)
                const isPractice = exam.cate === 'practice'
                const questionCount =
                  exam.questionIds?.length ?? exam.questions?.length ?? exam.totalQuestions ?? 0
                const duration = exam.duration ?? exam.time ?? 45
                const rawScore = bestSub?.score ?? bestSub?.totalScore
                const hasScore = rawScore !== undefined && rawScore !== null
                const formattedScore = hasScore
                  ? Number(rawScore).toFixed(rawScore % 1 === 0 ? 0 : 1)
                  : null

                return (
                  <tr
                    key={examId || `exam-${index}`}
                    onClick={() => {
                      if (examId) {
                        sessionStorage.removeItem(`exam_state_${examId}`)
                        router.push(`/exam/${examId}/take`)
                      }
                    }}
                    className="hover:bg-slate-50 transition-colors group relative border-l-2 border-transparent hover:border-primary cursor-pointer"
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex shrink-0 items-center justify-center text-primary">
                          <Calculator className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-slate-800 group-hover:text-primary transition-colors truncate">
                              {exam.title}
                            </p>
                            {isRec && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/70">
                                <Sparkles className="w-3 h-3 text-amber-600" aria-hidden="true" />
                                <span>Khuyên làm</span>
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 font-mono mt-0.5">
                            Mã đề: {exam.examCode || exam.code || `#${examId}`}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3.5 text-center whitespace-nowrap">
                      <span className="text-sm font-medium text-slate-700">
                        Lớp {exam.grade || grade}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 text-center text-sm font-medium whitespace-nowrap text-slate-700">
                      {questionCount}
                    </td>
                    <td className="px-3 py-3.5 text-center text-sm font-medium whitespace-nowrap text-slate-700">
                      {duration} phút
                    </td>
                    <td className="px-3 py-3.5 text-center whitespace-nowrap">
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full border inline-block ${
                          isPractice
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}
                      >
                        {isPractice ? 'Luyện tập' : 'Thi thử'}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 text-center whitespace-nowrap">
                      {exam.type ? (
                        <span
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full border inline-block ${
                            exam.type === 'Giữa kì 1'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : exam.type === 'Cuối kì 1'
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                              : exam.type === 'Giữa kì 2'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : exam.type === 'Cuối kì 2'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : exam.type === 'Chuyên Đề'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : exam.type === 'Ôn tập'
                              ? 'bg-sky-50 text-sky-700 border-sky-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {exam.type}
                        </span>
                      ) : (
                        <span className="text-sm font-medium text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-3 py-3.5 text-center whitespace-nowrap">
                      {hasScore ? (
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/80 inline-flex items-center gap-1">
                          <Award className="w-3.5 h-3.5" />
                          <span>{formattedScore}/10 đ</span>
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200/60">
                          Chưa thi
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <Link
                        href={`/exam/${examId}/take`}
                        onClick={(e) => {
                          e.stopPropagation()
                          if (examId) sessionStorage.removeItem(`exam_state_${examId}`)
                        }}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all shadow-xs min-h-[38px] ${
                          hasScore
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                            : 'bg-primary hover:bg-primary/90 text-white'
                        }`}
                      >
                        {hasScore ? 'Thi lại' : 'Vào thi'}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                )
              })}

              {activeExams.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-500">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                        <FolderOpen className="w-8 h-8 text-slate-300" />
                      </div>
                      <p className="text-base font-semibold text-slate-700">
                        Chưa có đề thi nào trong {activeMilestoneInfo?.title || 'chặng này'}
                      </p>
                      <p className="text-sm mt-1">
                        Nội dung đề thi cho chặng này đang được cập nhật thêm. Bạn có thể chọn các chặng khác để tiếp tục ôn luyện!
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default StudentExamListClient
