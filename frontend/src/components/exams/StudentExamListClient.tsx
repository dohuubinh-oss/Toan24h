'use client'

import React, { useState, useMemo } from 'react'
import {
  ExamMilestone,
  MILESTONES_CONFIG,
  getMilestoneInfo,
} from '@/lib/examMilestoneProgression'
import { MilestoneTabs } from '@/components/exams/MilestoneTabs'
import { MilestoneExamCard } from '@/components/exams/MilestoneExamCard'
import { Search, X, FolderOpen, Sparkles } from 'lucide-react'

export interface StudentExamListClientProps {
  grade: string
  currentMilestone: ExamMilestone
  examsByMilestone: Record<ExamMilestone, any[]>
  bestSubmissions: Record<string, any>
}

/**
 * Client component hiển thị giao diện luyện đề thi theo 5 chặng học tập:
 * - Tab chọn chặng (MilestoneTabs), mặc định theo chặng đang học (currentMilestone).
 * - Thanh tìm kiếm tên hoặc mã đề thi.
 * - Danh sách thẻ đề thi (MilestoneExamCard) theo chuẩn Material 3 Outlined.
 * - Trạng thái trống (Empty state) khi không tìm thấy kết quả.
 */
export function StudentExamListClient({
  grade,
  currentMilestone,
  examsByMilestone,
  bestSubmissions,
}: StudentExamListClientProps) {
  const [activeMilestone, setActiveMilestone] = useState<ExamMilestone>(currentMilestone)
  const [searchQuery, setSearchQuery] = useState('')

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

  // Lấy danh sách đề thi của chặng hiện đang chọn và lọc theo từ khóa tìm kiếm
  const activeExams = examsByMilestone?.[activeMilestone] ?? []

  const filteredExams = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) {
      return activeExams
    }

    return activeExams.filter((exam: any) => {
      const title = (exam?.title || '').toString().toLowerCase()
      const code = (exam?.examCode || exam?.code || '').toString().toLowerCase()
      return title.includes(query) || code.includes(query)
    })
  }, [activeExams, searchQuery])

  // Tìm chỉ mục của đề thi đầu tiên chưa được làm trong chặng hiện tại để đề xuất làm bài
  const firstUnsubmittedIndex = useMemo(() => {
    return filteredExams.findIndex((e) => {
      const id = e.id || e._id || ''
      return !bestSubmissions?.[String(id)]
    })
  }, [filteredExams, bestSubmissions])

  const activeMilestoneInfo = getMilestoneInfo(activeMilestone)
  const totalCountInActive = activeExams.length

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

      {/* 2. Thanh tìm kiếm và tóm tắt số lượng */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-slate-800">
            {activeMilestoneInfo?.title || 'Đề thi'}
          </h2>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200/60">
            {filteredExams.length} / {totalCountInActive} đề thi
          </span>
          {activeMilestone === currentMilestone && (
            <span className="hidden sm:inline-flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/60">
              <Sparkles className="w-3 h-3 text-blue-600" aria-hidden="true" />
              <span>Chặng mục tiêu của bạn</span>
            </span>
          )}
        </div>

        {/* Thanh tìm kiếm với Material 3 Outlined */}
        <div className="relative w-full sm:w-80">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm đề thi theo tên, mã đề..."
            className="w-full pl-10 pr-12 py-2.5 min-h-[44px] text-sm bg-white border border-slate-200/90 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Xóa nội dung tìm kiếm"
              className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 min-h-[40px] min-w-[40px] inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* 3. Lưới hiển thị danh sách đề thi hoặc Trạng thái trống */}
      {filteredExams.length > 0 ? (
        <div
          role="tabpanel"
          id={`panel-${activeMilestone}`}
          aria-labelledby={`tab-${activeMilestone}`}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {filteredExams.map((exam, index) => {
            const examId = exam.id || exam._id || ''
            const bestSub = examId ? bestSubmissions?.[String(examId)] : null
            const isRec =
              Boolean(exam.isRecommended) ||
              (activeMilestone === currentMilestone && index === firstUnsubmittedIndex)

            return (
              <MilestoneExamCard
                key={examId || `exam-${index}`}
                exam={exam}
                bestSubmission={bestSub}
                isRecommended={isRec}
              />
            )
          })}
        </div>
      ) : (
        <div
          role="tabpanel"
          id={`panel-${activeMilestone}`}
          aria-labelledby={`tab-${activeMilestone}`}
          className="flex flex-col items-center justify-center text-center p-12 bg-white border border-slate-200/80 rounded-2xl shadow-sm"
        >
          <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-4">
            <FolderOpen className="w-7 h-7 stroke-[1.75]" aria-hidden="true" />
          </div>
          <h3 className="text-base font-bold text-slate-800 mb-1">
            {searchQuery
              ? 'Không tìm thấy đề thi phù hợp'
              : `Chưa có đề thi nào trong ${activeMilestoneInfo?.title || 'chặng này'}`}
          </h3>
          <p className="text-sm text-slate-500 max-w-md mb-6 leading-relaxed">
            {searchQuery
              ? `Không tìm thấy đề thi nào khớp với từ khóa "${searchQuery}" trong chặng này. Bạn hãy thử kiểm tra lại chính tả hoặc tìm trong chặng khác nhé.`
              : 'Nội dung đề thi cho chặng này đang được cập nhật thêm. Bạn có thể chọn các chặng khác để tiếp tục ôn luyện!'}
          </p>

          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="inline-flex items-center justify-center px-4 py-2.5 min-h-[44px] rounded-xl text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 transition-colors"
            >
              Xóa tìm kiếm
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default StudentExamListClient
