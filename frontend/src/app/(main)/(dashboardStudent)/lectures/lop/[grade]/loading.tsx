import React from 'react';
import { ChevronRight } from 'lucide-react';

function LectureCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col h-full animate-pulse">
      {/* Thumbnail Header */}
      <div className="h-40 bg-slate-100 flex items-center justify-center p-6">
        <div className="w-20 h-20 bg-slate-200 rounded-full" />
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <div className="w-1/3 h-3 bg-slate-200 rounded mb-4" />
        <div className="w-3/4 h-5 bg-slate-200 rounded mb-2" />
        <div className="w-1/2 h-5 bg-slate-200 rounded mb-2" />
        
        <div className="flex-1" /> {/* Spacer */}

        {/* Info & Actions */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
          <div className="w-24 h-4 bg-slate-200 rounded" />
          <div className="w-28 h-12 bg-slate-200 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <div className="space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
            <span className="min-h-[44px] flex items-center">Dashboard</span>
            <ChevronRight className="w-3 h-3" />
            <span className="min-h-[44px] flex items-center">Bài giảng</span>
          </div>
          <div className="w-64 h-8 bg-slate-200 rounded animate-pulse" />
        </div>
      </div>

      {/* Grid danh sách Bài giảng Skeletons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <LectureCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
