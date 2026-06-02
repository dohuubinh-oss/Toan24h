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
}

export function LectureCard({
  id,
  title,
  chapter,
  status,
  practiceCount,
  thumbnailUrl,
}: LectureCardProps) {
  const isCompleted = status === 'completed';
  const isInProgress = status === 'in_progress';
  
  return (
    <Link href={`/lectures/${id}`} className="group bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden hover:shadow-md hover:border-primary/30 transition-all duration-300 flex flex-col h-full hover:-translate-y-1 cursor-pointer">
      {/* Thumbnail Header */}
      <div className="relative h-40 bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center p-6 overflow-hidden">
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center opacity-20 transition-transform duration-500 group-hover:scale-110">
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
        <div className="text-xs font-medium text-indigo-600 mb-2 uppercase tracking-wider line-clamp-1">
          {chapter}
        </div>
        <h3 className="text-lg font-bold text-slate-800 mb-2 line-clamp-2 leading-snug group-hover:text-primary transition-colors">
          {title}
        </h3>
        
        <div className="flex-1" /> {/* Spacer */}

        {/* Info & Actions */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-slate-500 text-sm">
            <PenTool className="w-4 h-4" />
            <span>{practiceCount} Đề luyện tập</span>
          </div>
          
          <button className={`h-12 px-4 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
            isCompleted 
              ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' 
              : 'bg-primary text-white hover:bg-primary/90 shadow-sm'
          }`}>
            {isCompleted ? 'Ôn tập lại' : (isInProgress ? 'Tiếp tục học' : 'Học ngay')}
          </button>
        </div>
      </div>
    </Link>
  );
}
