'use client';

import React from 'react';
import { Search, X, CheckCircle2, PlayCircle, Lock, BookOpen } from 'lucide-react';

export interface LectureToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedChapter: string;
  onChapterChange: (chapter: string) => void;
  chapters: string[];
  selectedStatus: 'all' | 'completed' | 'pending' | 'locked';
  onStatusChange: (status: 'all' | 'completed' | 'pending' | 'locked') => void;
}

export function LectureToolbar({
  searchQuery,
  onSearchChange,
  selectedChapter,
  onChapterChange,
  chapters,
  selectedStatus,
  onStatusChange,
}: LectureToolbarProps) {
  return (
    <div className="space-y-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
      {/* Hàng 1: Ô tìm kiếm bài giảng */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <Search className="w-4 h-4 text-slate-400" aria-hidden="true" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Tìm kiếm bài giảng, công thức, dạng bài..."
          className="w-full pl-10 pr-10 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
            aria-label="Xóa nội dung tìm kiếm"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Hàng 2: Bộ lọc Phân môn và Trạng thái */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1 border-t border-slate-100">
        {/* Phân môn */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <span className="text-xs font-semibold text-slate-500 mr-1 shrink-0 flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
            Chuyên đề:
          </span>
          <button
            type="button"
            onClick={() => onChapterChange('all')}
            className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              selectedChapter === 'all'
                ? 'bg-primary text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Tất cả
          </button>
          {chapters.map((ch) => (
            <button
              key={ch}
              type="button"
              onClick={() => onChapterChange(ch)}
              className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                selectedChapter === ch
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {ch}
            </button>
          ))}
        </div>

        {/* Trạng thái bài học */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none shrink-0">
          <button
            type="button"
            onClick={() => onStatusChange('all')}
            className={`min-h-[38px] px-2.5 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              selectedStatus === 'all'
                ? 'bg-slate-800 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Mọi bài
          </button>
          <button
            type="button"
            onClick={() => onStatusChange('completed')}
            className={`min-h-[38px] px-2.5 py-1.5 rounded-lg text-xs font-semibold shrink-0 flex items-center gap-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
              selectedStatus === 'completed'
                ? 'bg-emerald-600 text-white'
                : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/60'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Hoàn thành</span>
          </button>
          <button
            type="button"
            onClick={() => onStatusChange('pending')}
            className={`min-h-[38px] px-2.5 py-1.5 rounded-lg text-xs font-semibold shrink-0 flex items-center gap-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              selectedStatus === 'pending'
                ? 'bg-primary text-white'
                : 'text-primary bg-blue-50 hover:bg-blue-100 border border-blue-200/60'
            }`}
          >
            <PlayCircle className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Đang học</span>
          </button>
          <button
            type="button"
            onClick={() => onStatusChange('locked')}
            className={`min-h-[38px] px-2.5 py-1.5 rounded-lg text-xs font-semibold shrink-0 flex items-center gap-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${
              selectedStatus === 'locked'
                ? 'bg-slate-600 text-white'
                : 'text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Chưa mở</span>
          </button>
        </div>
      </div>
    </div>
  );
}
