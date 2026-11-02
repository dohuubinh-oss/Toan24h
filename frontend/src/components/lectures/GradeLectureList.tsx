'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, Sparkles, X } from 'lucide-react';
import { Lecture } from '@/types/lecture';
import { LectureCard, PracticeLectureCard } from './LectureCard';
import { LectureFilterSidebar } from './LectureFilterSidebar';
import { useStudentLectureFilter } from '@/contexts/StudentLectureFilterContext';
import { Pagination } from '@/components/ui/Pagination';

export interface GradeLectureListProps {
  lectures: Lecture[];
  allLectures?: Lecture[];
  grade: string;
  returnUrl?: string;
  examId?: string;
  initialPage?: number;
}

export function GradeLectureList({
  lectures,
  allLectures,
  grade,
  returnUrl,
  examId,
  initialPage = 1,
}: GradeLectureListProps) {
  const contextFilter = useStudentLectureFilter();

  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [localSelectedChapter, setLocalSelectedChapter] = useState('all');
  const [localSelectedStatus, setLocalSelectedStatus] = useState<
    'all' | 'completed' | 'pending' | 'locked'
  >('all');

  const searchQuery = contextFilter ? contextFilter.searchQuery : localSearchQuery;
  const setSearchQuery = contextFilter ? contextFilter.setSearchQuery : setLocalSearchQuery;
  const selectedChapter = contextFilter ? contextFilter.selectedChapter : localSelectedChapter;
  const setSelectedChapter = contextFilter ? contextFilter.setSelectedChapter : setLocalSelectedChapter;
  const selectedStatus = contextFilter ? contextFilter.selectedStatus : localSelectedStatus;
  const setSelectedStatus = contextFilter ? contextFilter.setSelectedStatus : setLocalSelectedStatus;

  const statsSource = allLectures && allLectures.length > 0 ? allLectures : lectures;

  // Lấy danh sách các chuyên đề/chương duy nhất trên toàn bộ khối lớp
  const chapters = useMemo(() => {
    const set = new Set<string>();
    statsSource.forEach((l) => {
      if (l.chapter && l.chapter.trim()) {
        set.add(l.chapter.trim());
      }
    });
    return Array.from(set);
  }, [statsSource]);

  // Đếm số lượng bài của từng chuyên đề
  const chapterCounts = useMemo(() => {
    const map: Record<string, number> = {};
    statsSource.forEach((l) => {
      if (l.chapter && l.chapter.trim()) {
        const chap = l.chapter.trim();
        map[chap] = (map[chap] || 0) + 1;
      }
    });
    return map;
  }, [statsSource]);

  // Thống kê số lượng bài theo trạng thái trên toàn bộ khối lớp
  const counts = useMemo(() => {
    let completed = 0;
    let pending = 0;
    let locked = 0;

    statsSource.forEach((l) => {
      if (l.isCompleted) {
        completed++;
      } else if (l.isLocked) {
        locked++;
      } else if (l.status === 'PENDING') {
        pending++;
      }
    });

    return {
      total: statsSource.length,
      completed,
      pending,
      locked,
    };
  }, [statsSource]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedChapter !== 'all' ||
    selectedStatus !== 'all';

  // Lấy toàn bộ bài giảng của khối (statsSource). Luôn lọc trên statsSource để đảm bảo đầy đủ kết quả.
  const sourceToFilter = statsSource;

  // Lọc bài giảng theo tìm kiếm, phân môn, và trạng thái
  const filteredLectures = useMemo(() => {
    return sourceToFilter.filter((lecture) => {
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
  }, [sourceToFilter, searchQuery, selectedChapter, selectedStatus]);

  const PAGE_SIZE = 6;
  const [currentPage, setCurrentPage] = useState(initialPage);

  // Đồng bộ khi initialPage từ URL thay đổi
  useEffect(() => {
    if (initialPage) {
      setCurrentPage(initialPage);
    }
  }, [initialPage]);

  // Reset về trang 1 khi thay đổi bất kỳ bộ lọc nào (tìm kiếm, chuyên đề, trạng thái)
  useEffect(() => {
    setCurrentPage(1);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (url.searchParams.has('page')) {
        url.searchParams.delete('page');
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, [searchQuery, selectedChapter, selectedStatus]);

  const totalFiltered = filteredLectures.length;
  const totalPages = Math.ceil(totalFiltered / PAGE_SIZE) || 1;
  const validPage = Math.max(1, Math.min(currentPage, totalPages));
  const startIndex = totalFiltered > 0 ? (validPage - 1) * PAGE_SIZE + 1 : 0;
  const endIndex = Math.min(validPage * PAGE_SIZE, totalFiltered);

  const paginatedLectures = useMemo(() => {
    return filteredLectures.slice((validPage - 1) * PAGE_SIZE, validPage * PAGE_SIZE);
  }, [filteredLectures, validPage]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (newPage > 1) {
        url.searchParams.set('page', newPage.toString());
      } else {
        url.searchParams.delete('page');
      }
      window.history.replaceState({}, '', url.toString());
      if (typeof window.scrollTo === 'function') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  useEffect(() => {
    if (contextFilter) {
      contextFilter.setChapters(chapters);
      contextFilter.setChapterCounts(chapterCounts);
      contextFilter.setCounts(counts);
      contextFilter.setIsAvailable(true);
      return () => {
        contextFilter.setIsAvailable(false);
      };
    }
  }, [contextFilter, chapters, chapterCounts, counts]);

  return (
    <div className="flex flex-col lg:flex-row items-start gap-7">
      {/* Cột Trái: Sidemenu Bộ lọc & Chuyên đề (Ẩn trên tablet/desktop khi đã tích hợp vào Sidebar menu chính) */}
      {lectures.length > 0 && (
        <div className={contextFilter ? 'md:hidden w-full' : 'w-full md:w-72 xl:w-80 shrink-0'}>
          <LectureFilterSidebar
            searchId="mobile-lecture-search"
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedChapter={selectedChapter}
            onChapterChange={setSelectedChapter}
            chapters={chapters}
            chapterCounts={chapterCounts}
            selectedStatus={selectedStatus}
            onStatusChange={setSelectedStatus}
            totalCount={counts.total}
            completedCount={counts.completed}
            pendingCount={counts.pending}
            lockedCount={counts.locked}
          />
        </div>
      )}

      {/* Cột Phải: Grid danh sách bài giảng */}
      <main className="flex-1 min-w-0 w-full space-y-5">
        {/* Thanh trạng thái bộ lọc đang chọn */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between p-3.5 bg-blue-50/70 border border-blue-200/60 rounded-2xl text-xs text-slate-700 gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Sparkles className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
              <span className="truncate">
                Tìm thấy{' '}
                <strong className="text-primary font-bold">
                  {totalFiltered}
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
              className="text-xs font-semibold text-primary hover:text-primary/80 flex items-center gap-1 hover:underline shrink-0 min-h-[36px]"
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Xóa bộ lọc</span>
            </button>
          </div>
        )}

        {/* Grid bài giảng */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {paginatedLectures.map((item, index) => {
            const isPriority = index < 2;
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
                  priority={isPriority}
                  isPublished={item.isPublished}
                />
              );
            }

            return (
              <LectureCard
                key={item.id}
                grade={grade}
                returnUrl={returnUrl}
                examId={examId}
                priority={isPriority}
                isPublished={item.isPublished}
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

        {/* Phân trang bài giảng theo bộ lọc */}
        {totalPages > 1 && (
          <div className="pt-6 border-t border-slate-100">
            <Pagination
              currentPage={validPage}
              totalPages={totalPages}
              totalItems={totalFiltered}
              startIndex={startIndex}
              endIndex={endIndex}
              itemName="bài giảng"
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </main>
    </div>
  );
}
