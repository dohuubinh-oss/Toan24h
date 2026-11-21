'use client'

import React from 'react'
import {
  ExamMilestone,
  MILESTONES_CONFIG,
  isMilestonePassed,
} from '@/lib/examMilestoneProgression'
import { Check, Target } from 'lucide-react'

export interface MilestoneTabsProps {
  activeMilestone: ExamMilestone
  currentProgressMilestone: ExamMilestone
  counts: Record<ExamMilestone, number>
  onSelect: (milestone: ExamMilestone) => void
}

/**
 * Phong cách 1: Minimalist Timeline Rail (Thanh ray tiến độ tối giản - Linear / Apple style).
 * - Chiều cao tinh gọn, đường ray thời gian chạy xuyên suốt 5 mốc học tập.
 * - Mốc thời gian năm học đặt tinh tế phía trên, điểm mốc tròn ở giữa và tên chặng phía dưới.
 * - Tuân thủ A11y touch target >= 44px, min font >= 12px, role="tablist".
 */
export function MilestoneTabs({
  activeMilestone,
  currentProgressMilestone,
  counts,
  onSelect,
}: MilestoneTabsProps) {
  // Tính toán phần trăm tiến độ đường ray
  const currentMilestoneIndex = MILESTONES_CONFIG.findIndex(
    (m) => m.id === currentProgressMilestone
  )
  const currentOrder = currentMilestoneIndex >= 0 ? currentMilestoneIndex + 1 : 1
  const progressPercent = Math.min(
    100,
    Math.max(0, ((currentOrder - 1) / (MILESTONES_CONFIG.length - 1)) * 100)
  )

  return (
    <div className="relative py-2 px-1 sm:px-2 select-none">
      {/* 1. Đường ray thời gian mảnh (Timeline Rail Track) chạy ngang */}
      <div
        aria-hidden="true"
        className="hidden md:block absolute top-[2.45rem] left-[10%] right-[10%] h-[2px] bg-slate-200/80 -z-0"
      >
        <div
          className="h-full bg-gradient-to-r from-emerald-500 to-primary transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* 2. Danh sách 5 mốc thời gian */}
      <div
        role="tablist"
        aria-label="Các chặng đề thi"
        className="flex lg:grid lg:grid-cols-5 gap-2 sm:gap-3 overflow-x-auto scrollbar-none pb-1 relative z-10"
      >
        {MILESTONES_CONFIG.map((milestone) => {
          const isActive = activeMilestone === milestone.id
          const isCurrent = currentProgressMilestone === milestone.id
          const isPassed = isMilestonePassed(milestone.id, currentProgressMilestone)
          const count = counts?.[milestone.id] ?? 0

          return (
            <button
              key={milestone.id}
              role="tab"
              type="button"
              id={`tab-${milestone.id}`}
              aria-selected={isActive}
              aria-controls={`panel-${milestone.id}`}
              onClick={() => onSelect(milestone.id)}
              className={`
                relative flex flex-col items-center justify-between p-2 sm:p-2.5 rounded-2xl
                min-w-[135px] sm:min-w-[150px] lg:min-w-0 flex-1 shrink-0
                min-h-[44px] transition-all duration-150 cursor-pointer group text-center
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
                ${
                  isActive
                    ? 'bg-primary/5 text-primary shadow-2xs border border-primary/20'
                    : 'hover:bg-slate-50 text-slate-600 border border-transparent'
                }
              `}
            >
              {/* Mốc thời gian năm học (Time range) */}
              <span
                className={`text-[11px] tracking-tight mb-1.5 ${
                  isActive
                    ? 'text-primary font-bold'
                    : 'text-slate-400 group-hover:text-slate-600 font-medium'
                }`}
              >
                {milestone.timeRange}
              </span>

              {/* Điểm mốc tròn (Timeline Node) */}
              <div className="relative my-0.5 z-10">
                {isPassed && !isCurrent ? (
                  <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                    <Check className="w-3.5 h-3.5 stroke-[3]" aria-hidden="true" />
                  </div>
                ) : isCurrent ? (
                  <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center shadow-xs ring-4 ring-primary/20 animate-pulse">
                    <Target className="w-3 h-3" aria-hidden="true" />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full bg-white text-slate-400 border-2 border-slate-300 flex items-center justify-center shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                  </div>
                )}
              </div>

              {/* Tên chặng & Số lượng đề thi */}
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap justify-center">
                <span
                  className={`text-xs sm:text-sm ${
                    isActive
                      ? 'font-bold text-primary'
                      : 'font-semibold text-slate-700 group-hover:text-slate-900'
                  }`}
                >
                  {milestone.title}
                </span>
                <span
                  className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-primary text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              </div>

              {/* Trạng thái rút gọn */}
              <div className="min-h-[16px] mt-0.5">
                {isCurrent && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-primary">
                    <Target className="w-2.5 h-2.5" aria-hidden="true" />
                    <span>Đang học</span>
                  </span>
                )}
                {isPassed && !isCurrent && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-emerald-600">
                    <Check className="w-2.5 h-2.5 stroke-[2.5]" aria-hidden="true" />
                    <span>Đã học qua</span>
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default MilestoneTabs
