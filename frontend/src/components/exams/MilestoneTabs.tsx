'use client'

import React from 'react'
import {
  ExamMilestone,
  MILESTONES_CONFIG,
  isMilestonePassed,
} from '@/lib/examMilestoneProgression'
import { Check } from 'lucide-react'

export interface MilestoneTabsProps {
  activeMilestone: ExamMilestone
  currentProgressMilestone: ExamMilestone
  counts: Record<ExamMilestone, number>
  onSelect: (milestone: ExamMilestone) => void
}

/**
 * Thanh chuyển đổi 5 chặng đề thi (Giữa kì 1, Cuối kì 1, Giữa kì 2, Cuối kì 2, Chuyên đề)
 * Tuân thủ Material 3 Outlined, A11y touch target >= 44px, min font >= 12px.
 */
export function MilestoneTabs({
  activeMilestone,
  currentProgressMilestone,
  counts,
  onSelect,
}: MilestoneTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Các chặng đề thi"
      className="flex items-center gap-2 overflow-x-auto p-1.5 bg-slate-100/80 border border-slate-200/80 rounded-2xl scrollbar-none"
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
              flex-shrink-0 inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-medium
              min-h-[44px] transition-all duration-150 select-none
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
              ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm border border-blue-600'
                  : 'bg-white text-slate-700 border border-slate-200/80 hover:bg-slate-50 hover:border-slate-300'
              }
            `}
          >
            <span>{milestone.title}</span>

            {/* Badges trạng thái lộ trình */}
            {isCurrent && (
              <span
                className={`
                  inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border
                  ${
                    isActive
                      ? 'bg-blue-500/80 text-white border-blue-400'
                      : 'bg-blue-50 text-blue-700 border-blue-200/60'
                  }
                `}
              >
                <span>🎯 Đang học</span>
              </span>
            )}

            {isPassed && !isCurrent && (
              <span
                className={`
                  inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border
                  ${
                    isActive
                      ? 'bg-emerald-500/80 text-white border-emerald-400'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                  }
                `}
              >
                <Check className="w-3 h-3 stroke-[2.5]" aria-hidden="true" />
                <span>Đã học qua</span>
              </span>
            )}

            {/* Badge số lượng đề thi */}
            <span
              className={`
                text-xs font-semibold px-2 py-0.5 rounded-full min-w-[20px] text-center
                ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}
              `}
            >
              {count}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export default MilestoneTabs
