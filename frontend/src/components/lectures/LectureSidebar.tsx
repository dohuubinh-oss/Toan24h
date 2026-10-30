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
  isInsideSidebar?: boolean;
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
  isInsideSidebar = false,
}: LectureSidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const percentCompleted =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const contentCards = (
    <div className="space-y-4 w-full">
      {/* Card Tiến độ học tập */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
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
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-5">
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
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
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
              className={`w-full min-h-[40px] px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer ${
                selectedChapter === 'all'
                  ? 'bg-primary text-white font-bold shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span>Tất cả chuyên đề</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                  selectedChapter === 'all'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {totalCount}
              </span>
            </button>

            {chapters.map((chap) => {
              const isSelected = selectedChapter === chap;
              return (
                <button
                  key={chap}
                  type="button"
                  onClick={() => onChapterChange(chap)}
                  className={`w-full min-h-[40px] px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer ${
                    isSelected
                      ? 'bg-primary text-white font-bold shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span className="truncate pr-2">{chap}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bộ lọc Trạng thái bài học */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
              Trạng thái bài học
            </span>
          </div>

          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => onStatusChange('all')}
              className={`w-full min-h-[40px] px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer ${
                selectedStatus === 'all'
                  ? 'bg-slate-900 text-white font-bold shadow-xs'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span>Mọi bài học</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                  selectedStatus === 'all'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {totalCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => onStatusChange('completed')}
              className={`w-full min-h-[40px] px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer ${
                selectedStatus === 'completed'
                  ? 'bg-emerald-600 text-white font-bold shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/60'
              }`}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Đã hoàn thành</span>
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                  selectedStatus === 'completed'
                    ? 'bg-white/20 text-white'
                    : 'bg-emerald-200 text-emerald-900'
                }`}
              >
                {completedCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => onStatusChange('pending')}
              className={`w-full min-h-[40px] px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer ${
                selectedStatus === 'pending'
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200/60'
              }`}
            >
              <div className="flex items-center gap-2">
                <PlayCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Đang học</span>
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                  selectedStatus === 'pending'
                    ? 'bg-white/20 text-white'
                    : 'bg-blue-200 text-blue-900'
                }`}
              >
                {pendingCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => onStatusChange('locked')}
              className={`w-full min-h-[40px] px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer ${
                selectedStatus === 'locked'
                  ? 'bg-slate-700 text-white font-bold shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
              }`}
            >
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Chưa mở khóa</span>
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                  selectedStatus === 'locked'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {lockedCount}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (isInsideSidebar) {
    return <div className="space-y-4 pt-3 border-t border-slate-100">{contentCards}</div>;
  }

  return (
    <aside className="w-full lg:w-72 xl:w-80 shrink-0 space-y-5">
      {/* Nút bấm toggle bộ lọc trên Mobile */}
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="w-full min-h-[44px] px-4 py-2.5 bg-white border border-slate-200/90 rounded-2xl shadow-xs text-sm font-semibold text-slate-800 flex items-center justify-between cursor-pointer"
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
        {contentCards}
      </div>
    </aside>
  );
}
export default LectureSidebar;
