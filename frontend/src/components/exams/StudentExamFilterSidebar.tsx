'use client'

import React from 'react'

export interface StudentExamFilterSidebarProps {
  totalCount: number
  completedCount: number
}

/**
 * Thẻ tiến độ luyện đề trên Sidemenu bên trái.
 * Đã lược bỏ khối tìm kiếm và lọc vì không cần thiết (đã có Trục thời gian ngang trên trang chính).
 */
export function StudentExamFilterSidebar({
  totalCount,
  completedCount,
}: StudentExamFilterSidebarProps) {
  const percentCompleted =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  return (
    <div className="w-full">
      {/* Card Tiến độ luyện đề */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Tiến độ luyện đề
          </span>
          <span className="text-sm font-extrabold text-primary">
            {percentCompleted}%
          </span>
        </div>
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-primary transition-all duration-500 rounded-full"
            style={{ width: `${percentCompleted}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
          <span>Đã hoàn thành:</span>
          <span className="font-bold text-slate-800">
            {completedCount} / {totalCount} đề
          </span>
        </div>
      </div>
    </div>
  )
}

export default StudentExamFilterSidebar
