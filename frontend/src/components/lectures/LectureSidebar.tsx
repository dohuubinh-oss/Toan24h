'use client';

import React, { useState } from 'react';
import {
  Search,
  X,
  BookOpen,
  CheckCircle2,
  PlayCircle,
  Lock,
  Filter,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export interface LectureSidebarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedChapter: string;
  onChapterChange: (chapter: string) => void;
  chapters: string[];
  selectedStatus: 'all' | 'completed' | 'pending' | 'locked';
  onStatusChange: (status: 'all' | 'completed' | 'pending' | 'locked') => void;
  totalCount: number;
  completedCount: number;
  pendingCount: number;
  lockedCount: number;
}

export function LectureSidebar({
  searchQuery,
  onSearchChange,
  selectedChapter,
  onChapterChange,
  chapters,
  selectedStatus,
  onStatusChange,
  totalCount,
  completedCount,
  pendingCount,
  lockedCount,
}: LectureSidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const percentCompleted =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <aside className="w-full lg:w-72 xl:w-80 shrink-0 space-y-5">
      {/* Nút bấm toggle bộ lọc trên Mobile */}
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="w-full min-h-[44px] px-4 py-2.5 bg-white border border-slate-200/90 rounded-2xl shadow-xs text-sm font-semibold text-slate-800 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-primary" aria-hidden="true" />
            <span>Tìm kiếm & Bộ lọc chuyên đề</span>
          </div>
          {isMobileOpen ? (
            <ChevronUp className="w-4 h-4 text-slate-500" aria-hidden="true" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-500" aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Khối Sidebar nội dung (Hiện toàn thời gian trên Desktop, Collapsible trên Mobile) */}
      <div
        className={`${
          isMobileOpen ? 'block' : 'hidden'
        } lg:block space-y-5`}
      >
        {/* Card Tiến độ học tập */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Tiến độ học tập
            </span>
            <span className="text-sm font-extrabold text-emerald-600">
              {percentCompleted}%
            </span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-emerald-500 transition-all duration-500 rounded-full"
              style={{ width: `${percentCompleted}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Đã hoàn thành:</span>
            <span className="font-bold text-slate-800">
              {completedCount} / {totalCount} bài
            </span>
          </div>
        </div>

        {/* Card Bộ lọc & Chuyên đề */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-6">
          {/* Ô tìm kiếm */}
          <div>
            <label
              htmlFor="lecture-search"
              className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2"
            >
              Tìm kiếm bài giảng
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-slate-400" aria-hidden="true" />
              </div>
              <input
                id="lecture-search"
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Tìm kiếm bài giảng, công thức..."
                className="w-full pl-9 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
                  aria-label="Xóa nội dung tìm kiếm"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Bộ lọc Phân môn / Chuyên đề dạng Menu dọc */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                Chuyên đề môn học
              </span>
            </div>

            <div className="space-y-1">
              <button
                type="button"
                onClick={() => onChapterChange('all')}
                className={`w-full min-h-[40px] px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  selectedChapter === 'all'
                    ? 'bg-primary text-white font-bold shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>Tất cả chuyên đề</span>
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full ${
                    selectedChapter === 'all'
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {totalCount}
                </span>
              </button>

              {chapters.map((ch) => (
                <button
                  key={ch}
                  type="button"
                  onClick={() => onChapterChange(ch)}
                  className={`w-full min-h-[40px] px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    selectedChapter === ch
                      ? 'bg-primary text-white font-bold shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="line-clamp-1">{ch}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Bộ lọc Trạng thái bài học */}
          <div>
            <span className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
              Trạng thái bài học
            </span>

            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => onStatusChange('all')}
                className={`w-full min-h-[38px] px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  selectedStatus === 'all'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>Mọi bài học</span>
                <span className="text-[11px] text-slate-400">{totalCount}</span>
              </button>

              <button
                type="button"
                onClick={() => onStatusChange('completed')}
                className={`w-full min-h-[38px] px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                  selectedStatus === 'completed'
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'text-emerald-700 bg-emerald-50/70 hover:bg-emerald-100/80 border border-emerald-200/50'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Đã hoàn thành</span>
                </div>
                <span className="text-[11px] font-bold">{completedCount}</span>
              </button>

              <button
                type="button"
                onClick={() => onStatusChange('pending')}
                className={`w-full min-h-[38px] px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  selectedStatus === 'pending'
                    ? 'bg-primary text-white font-bold'
                    : 'text-primary bg-blue-50/70 hover:bg-blue-100/80 border border-blue-200/50'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <PlayCircle className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Đang học</span>
                </div>
                <span className="text-[11px] font-bold">{pendingCount}</span>
              </button>

              <button
                type="button"
                onClick={() => onStatusChange('locked')}
                className={`w-full min-h-[38px] px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${
                  selectedStatus === 'locked'
                    ? 'bg-slate-700 text-white font-bold'
                    : 'text-slate-600 bg-slate-100/70 hover:bg-slate-200/80 border border-slate-200/60'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Chưa mở khóa</span>
                </div>
                <span className="text-[11px] font-bold">{lockedCount}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
