'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { BookOpen, Sparkles, X } from 'lucide-react';
import { Lecture } from '@/types/lecture';
import { LectureCard, PracticeLectureCard } from './LectureCard';
import { LectureSidebar } from './LectureSidebar';

export interface GradeLectureListProps {
  lectures: Lecture[];
  grade: string;
  returnUrl?: string;
  examId?: string;
}

export function GradeLectureList({
  lectures,
  grade,
  returnUrl,
  examId,
}: GradeLectureListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState<
    'all' | 'completed' | 'pending' | 'locked'
  >('all');

  // Lấy danh sách các chuyên đề/chương duy nhất
  const chapters = useMemo(() => {
    const set = new Set<string>();
    lectures.forEach((l) => {
      if (l.chapter && l.chapter.trim()) {
        set.add(l.chapter.trim());
      }
    });
    return Array.from(set);
  }, [lectures]);

  // Thống kê số lượng bài theo trạng thái
  const counts = useMemo(() => {
    let completed = 0;
    let pending = 0;
    let locked = 0;

    lectures.forEach((l) => {
      if (l.isCompleted) {
        completed++;
      } else if (l.isLocked) {
        locked++;
      } else if (l.status === 'PENDING') {
        pending++;
      }
    });

    return {
      total: lectures.length,
      completed,
      pending,
      locked,
    };
  }, [lectures]);

  // Lọc bài giảng theo tìm kiếm, phân môn, và trạng thái
  const filteredLectures = useMemo(() => {
    return lectures.filter((lecture) => {
      // 1. Tìm kiếm
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchTitle = (lecture.title || '').toLowerCase().includes(query);
        const matchChapter = (lecture.chapter || '').toLowerCase().includes(query);
        if (!matchTitle && !matchChapter) {
          return false;
        }
      }

      // 2. Chuyên đề / Chương
      if (selectedChapter !== 'all' && lecture.chapter !== selectedChapter) {
        return false;
      }

      // 3. Trạng thái
      if (selectedStatus === 'completed' && !lecture.isCompleted) {
        return false;
      }
      if (
        selectedStatus === 'pending' &&
        (lecture.status !== 'PENDING' || lecture.isLocked)
      ) {
        return false;
      }
      if (selectedStatus === 'locked' && !lecture.isLocked) {
        return false;
      }

      return true;
    });
  }, [lectures, searchQuery, selectedChapter, selectedStatus]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedChapter !== 'all' ||
    selectedStatus !== 'all';

  return (
    <div className="flex flex-col lg:flex-row items-start gap-7">
      {/* Cột Trái: Sidemenu Bộ lọc & Chuyên đề */}
      {lectures.length > 0 && (
        <LectureSidebar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedChapter={selectedChapter}
          onChapterChange={setSelectedChapter}
          chapters={chapters}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          totalCount={counts.total}
          completedCount={counts.completed}
          pendingCount={counts.pending}
          lockedCount={counts.locked}
        />
      )}

      {/* Cột Phải: Grid danh sách bài giảng */}
      <main className="flex-1 min-w-0 w-full space-y-5">
        {/* Thanh trạng thái bộ lọc đang chọn */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between p-3.5 bg-blue-50/70 border border-blue-200/60 rounded-2xl text-xs text-slate-700">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
              <span>
                Tìm thấy{' '}
                <strong className="text-primary font-bold">
                  {filteredLectures.length}
                </strong>{' '}
                bài giảng phù hợp bộ lọc
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedChapter('all');
                setSelectedStatus('all');
              }}
              className="text-xs font-semibold text-primary hover:text-primary/80 flex items-center gap-1 hover:underline"
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Xóa bộ lọc</span>
            </button>
          </div>
        )}

        {/* Grid bài giảng */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredLectures.map((item) => {
            if (item.isPracticeCard) {
              let lectureUrl = `/lectures/lop/${grade}/${item.id}`;
              if (returnUrl) {
                const params = new URLSearchParams({ returnUrl });
                if (examId) params.set('examId', examId);
                lectureUrl += `?${params.toString()}`;
              }
              return (
                <PracticeLectureCard
                  key={item.id}
                  id={item.id}
                  grade={grade}
                  title={item.title}
                  chapter={item.chapter}
                  practiceCount={item.practiceCount}
                  href={lectureUrl}
                  thumbnailUrl={item.thumbnailUrl}
                />
              );
            }

            return (
              <LectureCard
                key={item.id}
                grade={grade}
                returnUrl={returnUrl}
                examId={examId}
                {...item}
              />
            );
          })}

          {/* Khi bộ lọc không có kết quả */}
          {filteredLectures.length === 0 && lectures.length > 0 && (
            <div className="col-span-full py-16 flex flex-col items-center justify-center text-slate-500 bg-white rounded-2xl border border-slate-200/60 shadow-xs">
              <BookOpen className="w-12 h-12 text-slate-300 mb-3" aria-hidden="true" />
              <p className="text-base font-bold text-slate-700">
                Không tìm thấy bài giảng phù hợp
              </p>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Thử tìm kiếm với từ khóa khác hoặc bỏ các bộ lọc đang chọn.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedChapter('all');
                  setSelectedStatus('all');
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors"
              >
                Xóa bộ lọc
              </button>
            </div>
          )}

          {/* Khi chưa có bài giảng nào trong khối */}
          {lectures.length === 0 && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-500 bg-white rounded-2xl border border-slate-200/60 shadow-sm">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <BookOpen className="w-8 h-8 text-slate-300" aria-hidden="true" />
              </div>
              <p className="text-lg font-bold text-slate-700">Chưa có bài giảng nào</p>
              <p className="text-sm mt-1 mb-6 text-center max-w-md">
                Hiện tại bài giảng Khối {grade} đang được đội ngũ giáo viên cập nhật. Bạn vui lòng quay lại sau nhé!
              </p>
              <Link
                href="/student"
                className="h-12 px-6 rounded-xl bg-primary text-white font-semibold flex items-center justify-center hover:bg-primary/90 transition-colors shadow-sm"
              >
                Quay về Dashboard
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
