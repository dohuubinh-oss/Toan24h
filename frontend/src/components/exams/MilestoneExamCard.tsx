'use client'

import React from 'react'
import Link from 'next/link'
import { Clock, HelpCircle, Award, ArrowRight, Sparkles } from 'lucide-react'

export interface MilestoneExamCardProps {
  exam: {
    id?: string
    _id?: string
    title: string
    examCode?: string
    code?: string
    duration?: number
    time?: number
    cate?: 'exam' | 'practice' | string
    type?: string
    questionIds?: any[]
    questions?: any[]
    totalQuestions?: number
    grade?: string | number
    [key: string]: any
  }
  bestSubmission?: {
    id?: string
    score?: number
    totalScore?: number
    status?: string
    createdAt?: string
    [key: string]: any
  } | null
  isRecommended?: boolean
}

/**
 * Thẻ hiển thị đề thi theo chuẩn Material 3 Outlined.
 * Hiển thị đầy đủ thông tin: Mã đề, Tên đề, Phân loại, Thời gian, Số câu, Điểm cao nhất và Nút làm bài.
 */
export function MilestoneExamCard({
  exam,
  bestSubmission,
  isRecommended = false,
}: MilestoneExamCardProps) {
  const examId = exam.id || exam._id || ''
  const examCode = exam.examCode || exam.code || (examId ? `#${examId}` : '')
  const isPractice = exam.cate === 'practice'
  const duration = exam.duration ?? exam.time ?? 0
  const questionCount =
    exam.questionIds?.length ?? exam.questions?.length ?? exam.totalQuestions ?? 0

  const rawScore = bestSubmission?.score ?? bestSubmission?.totalScore
  const hasScore = rawScore !== undefined && rawScore !== null
  const formattedScore = hasScore ? Number(rawScore).toFixed(rawScore % 1 === 0 ? 0 : 1) : null

  return (
    <div className="group flex flex-col justify-between p-5 bg-white border border-slate-200/80 rounded-2xl hover:border-blue-400 hover:shadow-sm transition-all duration-200">
      <div>
        {/* Hàng huy hiệu & phân loại */}
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          {/* Badge cate: Thi thử vs Luyện tập */}
          <span
            className={`
              inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border
              ${
                isPractice
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                  : 'bg-blue-50 text-blue-700 border-blue-200/60'
              }
            `}
          >
            {isPractice ? 'Luyện tập' : 'Thi thử'}
          </span>

          {/* Badge phân loại kì thi */}
          {exam.type && (
            <span className="inline-flex items-center text-xs font-medium text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200/60">
              {exam.type}
            </span>
          )}

          {/* Badge khuyên làm / đề xuất */}
          {isRecommended && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200/70">
              <Sparkles className="w-3 h-3 text-amber-600" aria-hidden="true" />
              <span>Khuyên làm</span>
            </span>
          )}
        </div>

        {/* Mã đề */}
        {examCode && (
          <div className="text-xs font-mono font-medium text-slate-400 mb-1 tracking-tight">
            {examCode}
          </div>
        )}

        {/* Tiêu đề đề thi */}
        <h3 className="text-base font-semibold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-4 leading-snug">
          {exam.title}
        </h3>

        {/* Thông số kỹ thuật đề thi (Thời gian, Số câu, Điểm đạt được) */}
        <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-slate-600 mb-5">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
            <span>{duration > 0 ? `${duration} phút` : 'Không giới hạn'}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
            <span>{questionCount} câu</span>
          </div>

          {hasScore && (
            <div className="flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50/80 px-2 py-0.5 rounded-md border border-emerald-200/60">
              <Award className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
              <span>{formattedScore}/10 đ</span>
            </div>
          )}
        </div>
      </div>

      {/* Nút hành động chính - Touch target >= 44x44px */}
      <div className="pt-2 border-t border-slate-100">
        <Link
          href={`/exam/${examId}/take`}
          className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 min-h-[44px] rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.99] transition-all duration-150 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          <span>Làm bài thi</span>
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  )
}

export default MilestoneExamCard
