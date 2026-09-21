import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, PenTool, CheckCircle2, PlayCircle } from 'lucide-react';
import { LectureStatus } from '@/types/lecture';

export interface LectureCardProps {
  id: string;
  title: string;
  chapter: string;
  status: LectureStatus;
  practiceCount: number;
  completedWellCount?: number;
  thumbnailUrl?: string;
  grade?: string; // Tùy chọn để tương thích với các view khác
  returnUrl?: string;
  examId?: string;
}

export function LectureCard({
  id,
  title,
  chapter,
  status,
  practiceCount,
  completedWellCount,
  thumbnailUrl,
  grade,
  returnUrl,
  examId,
}: LectureCardProps) {
  const isCompleted = status === 'COMPLETED';
  const isInProgress = status === 'PENDING';
  
  // Xây dựng URL động, nếu có grade thì chèn grade vào URL
  let hrefUrl = grade ? `/lectures/lop/${grade}/${id}` : `/lectures/${id}`;
  if (returnUrl) {
    const params = new URLSearchParams({ returnUrl });
    if (examId) params.set('examId', examId);
    hrefUrl += `?${params.toString()}`;
  }
  
  return (
    <Link href={hrefUrl} className="group bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden hover:shadow-md hover:border-primary/30 transition-all duration-300 flex flex-col h-full hover:-translate-y-1 cursor-pointer">
      {/* Thumbnail Header */}
      <div className="relative h-44 overflow-hidden bg-slate-100">
        {thumbnailUrl ? (
          <Image 
            src={thumbnailUrl} 
            alt={title} 
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            unoptimized={true}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center opacity-20 transition-transform duration-500 group-hover:scale-110 bg-gradient-to-br from-indigo-50 to-blue-50">
            <BookOpen className="w-32 h-32 text-indigo-500" />
          </div>
        )}
        
        {/* Status Badge */}
        <div className="absolute top-4 right-4 z-10">
          {isCompleted && (
            <div className="bg-emerald-500/10 text-emerald-600 px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1 shadow-sm backdrop-blur-sm border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Hoàn thành
            </div>
          )}
          {isInProgress && (
            <div className="bg-amber-500/10 text-amber-600 px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1 shadow-sm backdrop-blur-sm border border-amber-500/20">
              <PlayCircle className="w-3.5 h-3.5" />
              Đang học
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <div className="mb-3">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 line-clamp-1 max-w-[100%]">
            {chapter}
          </span>
        </div>
        <h3 className="text-lg font-bold text-slate-800 mb-3 line-clamp-2 leading-snug group-hover:text-primary transition-colors">
          {title}
        </h3>
        <div className="flex justify-end mt-auto pt-2">
          <div className="flex items-center gap-1.5 text-slate-500 text-sm font-medium shrink-0">
            <PenTool className="w-4 h-4" />
            {completedWellCount !== undefined ? (
              <span>{completedWellCount}/{practiceCount} Đề</span>
            ) : (
              <span>{practiceCount} Đề</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export interface PracticeLectureCardProps {
  title: string;
  grade: string;
  chapter?: string;
  practiceCount?: number;
  href?: string;
}

export function PracticeLectureCard({
  title,
  grade,
  chapter,
  practiceCount = 0,
  href,
}: PracticeLectureCardProps) {
  const hrefUrl = href || `/practices/lop/${grade}`;

  return (
    <Link 
      href={hrefUrl} 
      className="group bg-gradient-to-b from-white to-emerald-50/20 rounded-2xl border border-emerald-200/70 shadow-sm overflow-hidden hover:shadow-md hover:border-emerald-500/50 transition-all duration-300 flex flex-col h-full hover:-translate-y-1 cursor-pointer"
    >
      {/* Thumbnail Header */}
      <div className="relative h-44 overflow-hidden bg-gradient-to-br from-emerald-100/60 via-teal-50 to-sky-100/50 flex items-center justify-center">
        <div className="w-16 h-16 rounded-2xl bg-white/90 shadow-md shadow-emerald-500/10 flex items-center justify-center text-emerald-600 transition-transform duration-500 group-hover:scale-110">
          <PenTool className="w-8 h-8" />
        </div>
        <div className="absolute top-4 right-4 z-10">
          <div className="bg-emerald-600 text-white px-3 py-1 rounded-md text-xs font-bold flex items-center gap-1 shadow-sm">
            Luyện tập & Đề
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <div className="mb-3 flex items-center gap-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            Khối {grade}
          </span>
          {chapter && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 line-clamp-1 max-w-[65%]">
              {chapter}
            </span>
          )}
        </div>
        <h3 className="text-lg font-bold text-slate-800 mb-3 line-clamp-2 leading-snug group-hover:text-emerald-700 transition-colors">
          {title}
        </h3>
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-100/80">
          <span className="text-xs text-slate-500 font-medium">Bộ bài tập liên kết</span>
          <div className="flex items-center gap-1.5 text-emerald-700 text-sm font-bold shrink-0">
            <PenTool className="w-4 h-4 text-emerald-600" />
            <span>{practiceCount} Đề</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

