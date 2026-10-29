import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, PenTool, CheckCircle2, PlayCircle, Lock } from 'lucide-react';
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
  isLocked?: boolean;
  lockReason?: string;
  averageScore?: number;
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
  isLocked = false,
  lockReason,
  averageScore,
}: LectureCardProps) {
  const isCompleted = status === 'COMPLETED';
  const isInProgress = status === 'PENDING';

  // Xây dựng URL động
  let hrefUrl = grade ? `/lectures/lop/${grade}/${id}` : `/lectures/${id}`;
  if (returnUrl) {
    const params = new URLSearchParams({ returnUrl });
    if (examId) params.set('examId', examId);
    hrefUrl += `?${params.toString()}`;
  }

  // Khối Header Hình ảnh dùng chung
  const renderThumbnail = () => (
    <div className="relative h-44 overflow-hidden bg-slate-100">
      {thumbnailUrl ? (
        <Image
          src={thumbnailUrl}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className={`object-cover transition-transform duration-500 ${
            isLocked ? 'filter grayscale-[25%]' : 'group-hover:scale-105'
          }`}
          loading="lazy"
          unoptimized={true}
        />
      ) : (
        <div
          className={`w-full h-full flex items-center justify-center opacity-20 transition-transform duration-500 ${
            isLocked
              ? 'bg-slate-200'
              : 'group-hover:scale-110 bg-gradient-to-br from-indigo-50 to-blue-50'
          }`}
        >
          {isLocked ? (
            <Lock className="w-24 h-24 text-slate-500" aria-hidden="true" />
          ) : (
            <BookOpen className="w-32 h-32 text-indigo-500" aria-hidden="true" />
          )}
        </div>
      )}

      {/* Badges trạng thái ở góc trên */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
        {isLocked && (
          <div className="bg-slate-800/80 text-white border border-slate-700/60 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm backdrop-blur-sm">
            <Lock className="w-3.5 h-3.5 text-slate-300" aria-hidden="true" />
            <span>Chưa mở khóa</span>
          </div>
        )}

        {!isLocked && isCompleted && (
          <div className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm backdrop-blur-sm">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
            <span>Hoàn thành</span>
            {averageScore !== undefined && averageScore > 0 && (
              <span className="ml-0.5 bg-emerald-600 text-white px-1.5 py-0.5 rounded text-[10px] font-bold">
                {averageScore}đ
              </span>
            )}
          </div>
        )}

        {!isLocked && isInProgress && (
          <div className="bg-blue-100 text-primary border border-blue-200 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm backdrop-blur-sm">
            <PlayCircle className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
            <span>Đang học</span>
          </div>
        )}
      </div>
    </div>
  );

  // Nội dung thông tin bài giảng
  const renderBody = () => (
    <div className="p-5 flex flex-col flex-1">
      <div className="mb-3">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold line-clamp-1 max-w-[100%] ${
            isLocked
              ? 'bg-slate-200 text-slate-600'
              : 'bg-primary/10 text-primary'
          }`}
        >
          {chapter}
        </span>
      </div>

      <h3
        className={`text-lg font-bold mb-3 line-clamp-2 leading-snug transition-colors ${
          isLocked
            ? 'text-slate-600'
            : isCompleted
            ? 'text-slate-900 group-hover:text-emerald-700'
            : 'text-slate-900 group-hover:text-primary'
        }`}
      >
        {title}
      </h3>

      {isLocked && lockReason && (
        <div className="mt-1 mb-3 p-2.5 bg-slate-100/90 border border-slate-200 text-slate-600 text-xs rounded-xl flex items-start gap-2">
          <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" aria-hidden="true" />
          <span className="leading-relaxed line-clamp-2">{lockReason}</span>
        </div>
      )}

      <div className="flex justify-end mt-auto pt-2 border-t border-slate-100">
        <div className="flex items-center gap-1.5 text-slate-500 text-sm font-medium shrink-0">
          <PenTool className="w-4 h-4" aria-hidden="true" />
          {completedWellCount !== undefined ? (
            <span>{completedWellCount}/{practiceCount} Đề</span>
          ) : (
            <span>{practiceCount} Đề</span>
          )}
        </div>
      </div>
    </div>
  );

  // Nếu bài giảng bị khóa -> render div không click được link
  if (isLocked) {
    return (
      <div
        className="bg-slate-50/70 rounded-2xl border-2 border-slate-200/80 shadow-xs overflow-hidden flex flex-col h-full cursor-not-allowed select-none opacity-85"
        title={lockReason || 'Bài giảng này chưa được mở khóa'}
      >
        {renderThumbnail()}
        {renderBody()}
      </div>
    );
  }

  // Màu viền động dựa theo trạng thái
  let borderClasses =
    'border border-slate-200/70 shadow-sm hover:shadow-md hover:border-primary/30';
  if (isCompleted) {
    borderClasses =
      'border-2 border-emerald-500 shadow-sm shadow-emerald-500/10 hover:shadow-md hover:border-emerald-600';
  } else if (isInProgress) {
    borderClasses =
      'border-2 border-primary shadow-sm hover:shadow-md hover:border-primary/90';
  }

  return (
    <Link
      href={hrefUrl}
      className={`group bg-white rounded-2xl overflow-hidden transition-all duration-300 flex flex-col h-full hover:-translate-y-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${borderClasses}`}
    >
      {renderThumbnail()}
      {renderBody()}
    </Link>
  );
}

export interface PracticeLectureCardProps {
  id?: string;
  title: string;
  grade: string;
  chapter?: string;
  practiceCount?: number;
  href?: string;
  thumbnailUrl?: string;
}

export function PracticeLectureCard({
  id,
  title,
  grade,
  chapter,
  practiceCount = 0,
  href,
  thumbnailUrl,
}: PracticeLectureCardProps) {
  const targetHref = href || (id ? `/lectures/lop/${grade}/${id}` : `/lectures`);

  return (
    <Link
      href={targetHref}
      className="group bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden hover:shadow-md hover:border-emerald-500/40 transition-all duration-300 flex flex-col h-full hover:-translate-y-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
    >
      {/* Thumbnail Header */}
      <div className="relative h-44 overflow-hidden bg-slate-100 flex items-center justify-center">
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
          <div className="w-16 h-16 rounded-2xl bg-white/90 shadow-md shadow-emerald-500/10 flex items-center justify-center text-emerald-600 transition-transform duration-500 group-hover:scale-110">
            <PenTool className="w-8 h-8" aria-hidden="true" />
          </div>
        )}
        <div className="absolute top-3 right-3 z-10">
          <div className="bg-emerald-600 text-white px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm backdrop-blur-sm">
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
            <PenTool className="w-4 h-4 text-emerald-600" aria-hidden="true" />
            <span>{practiceCount} Đề</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
