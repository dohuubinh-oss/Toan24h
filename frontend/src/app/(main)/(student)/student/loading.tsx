import React from 'react'

export default function StudentDashboardLoading() {
  return (
    <div className="space-y-8 animate-pulse" aria-busy="true" aria-label="Đang tải dữ liệu học tập">
      {/* Header Skeleton */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/70 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-slate-200 shrink-0" />
          <div className="h-7 w-56 bg-slate-200 rounded-lg" />
        </div>
        <div className="w-full md:w-auto h-14 w-64 bg-slate-100 rounded-xl" />
      </div>

      {/* Grid Layout Skeleton */}
      <div className="grid grid-cols-12 gap-8">
        {/* Left Column (8 cols) */}
        <div className="col-span-12 lg:col-span-8 space-y-8">
          {/* Progress Card Skeleton */}
          <div className="h-64 rounded-2xl bg-slate-200/80 p-8 flex flex-col justify-between" />

          {/* Topics Grid Skeleton */}
          <div className="space-y-4">
            <div className="h-6 w-40 bg-slate-200 rounded-md" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-52 bg-white rounded-xl border border-slate-200/60 p-6 space-y-3">
                  <div className="w-12 h-12 bg-slate-100 rounded-lg" />
                  <div className="h-5 w-24 bg-slate-200 rounded-md" />
                  <div className="h-4 w-32 bg-slate-100 rounded-md" />
                  <div className="h-2 w-full bg-slate-100 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (4 cols) */}
        <div className="col-span-12 lg:col-span-4 space-y-8">
          {/* Leaderboard Skeleton */}
          <div className="h-80 bg-white rounded-2xl border border-slate-200/60 p-6 space-y-4">
            <div className="h-6 w-32 bg-slate-200 rounded-md" />
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-11 bg-slate-100 rounded-xl" />
              ))}
            </div>
          </div>

          {/* Achievements Skeleton */}
          <div className="h-64 bg-white rounded-2xl border border-slate-200/60 p-6 space-y-4">
            <div className="h-6 w-28 bg-slate-200 rounded-md" />
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-slate-100 rounded-xl" />
              ))}
            </div>
          </div>

          {/* Daily Challenge Skeleton */}
          <div className="h-40 bg-white rounded-2xl border border-slate-200/60 p-6 space-y-3">
            <div className="h-5 w-36 bg-slate-200 rounded-md" />
            <div className="h-4 w-full bg-slate-100 rounded-md" />
            <div className="h-2 w-full bg-slate-100 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  )
}
