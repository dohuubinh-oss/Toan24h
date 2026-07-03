import React from 'react';
import Link from 'next/link';
import { BookOpen, PenTool, CheckCircle2, PlayCircle } from 'lucide-react';
import { LectureStatus } from '@/types/lecture';

export interface LectureCardProps {
  id: string;
  title: string;
  chapter: string;
  status: LectureStatus;
  practiceCount: number;
  thumbnailUrl?: string;
  grade?: string; // Tùy chọn để tương thích với các view khác
}

export function LectureCard({
  id,
  title,
  chapter,
  status,
  practiceCount,
  thumbnailUrl,
  grade,
}: LectureCardProps) {
  const isCompleted = status === 'completed';
  const isInProgress = status === 'in_progress';
  
  // Xây dựng URL động, nếu có grade thì chèn grade vào URL
  const hrefUrl = grade ? `/lectures/lop/${grade}/${id}` : `/lectures/${id}`;
  
  return (
    <Link href={hrefUrl} className="group bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden hover:shadow-md hover:border-primary/30 transition-all duration-300 flex flex-col h-full hover:-translate-y-1 cursor-pointer">
      {/* Thumbnail Header */}
      <div className="relative h-44 overflow-hidden">
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt={title} className="w-full h-full object-cover" />
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
        <div className="flex items-center justify-between mb-3">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 line-clamp-1 max-w-[65%]">
            {chapter}
          </span>
          <div className="flex items-center gap-1.5 text-slate-500 text-sm font-medium shrink-0">
            <PenTool className="w-4 h-4" />
            <span>{practiceCount} Đề</span>
          </div>
        </div>
        <h3 className="text-lg font-bold text-slate-800 mb-2 line-clamp-2 leading-snug group-hover:text-primary transition-colors">
          {title}
        </h3>
      </div>
    </Link>
  );
}
