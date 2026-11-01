import React from 'react';
import { ChevronRight } from 'lucide-react';

function LectureCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col h-full animate-pulse">
      {/* Thumbnail Header: chính xác h-44 (176px) đồng bộ với LectureCard */}
      <div className="h-44 bg-slate-100 flex items-center justify-center p-6">
        <div className="w-16 h-16 bg-slate-200 rounded-2xl" />
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <div className="w-1/3 h-5 bg-slate-200 rounded-full mb-3" />
        <div className="w-3/4 h-5 bg-slate-200 rounded mb-2" />
        <div className="w-1/2 h-5 bg-slate-200 rounded mb-4" />

        <div className="flex-1" />

        {/* Footer: mô phỏng chính xác footer của LectureCard */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
          <div className="w-20 h-4 bg-slate-200 rounded" />
        </div>
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
            <span className="min-h-[44px] flex items-center">Dashboard</span>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="min-h-[44px] flex items-center text-primary font-bold">Bài giảng</span>
          </div>
          <div className="w-72 h-8 bg-slate-200 rounded-xl animate-pulse" />
        </div>
      </div>

      {/* Layout 2 cột: Sidebar Skeleton bên trái + Grid Skeleton bên phải */}
      <div className="flex flex-col lg:flex-row items-start gap-7">
        {/* Sidebar Skeleton */}
        <div className="w-full lg:w-72 xl:w-80 shrink-0 space-y-5 animate-pulse">
          {/* Progress Card Skeleton */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-3">
            <div className="w-1/2 h-4 bg-slate-200 rounded" />
            <div className="w-full h-2.5 bg-slate-100 rounded-full" />
            <div className="w-3/4 h-4 bg-slate-100 rounded" />
          </div>

          {/* Filter Card Skeleton */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-5">
            <div className="w-full h-10 bg-slate-100 rounded-xl" />
            <div className="space-y-2">
              <div className="w-1/3 h-4 bg-slate-200 rounded mb-2" />
              <div className="w-full h-9 bg-slate-100 rounded-xl" />
              <div className="w-full h-9 bg-slate-100 rounded-xl" />
              <div className="w-full h-9 bg-slate-100 rounded-xl" />
            </div>
          </div>
        </div>

        {/* Grid danh sách Bài giảng Skeletons */}
        <main className="flex-1 min-w-0 w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <LectureCardSkeleton key={i} />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
