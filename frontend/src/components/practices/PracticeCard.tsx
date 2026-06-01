import React from 'react';
import { PenTool, CheckCircle2, Clock, HelpCircle, Trophy, AlertCircle } from 'lucide-react';

export type PracticeStatus = 'not_started' | 'completed';

export interface PracticeCardProps {
  id: string;
  title: string;
  lectureName: string;
  duration: number; // minutes
  questionCount: number;
  status: PracticeStatus;
  score?: number; // Score if completed
}

export function PracticeCard({
  id,
  title,
  lectureName,
  duration,
  questionCount,
  status,
  score,
}: PracticeCardProps) {
  const isCompleted = status === 'completed';
  const isPassed = isCompleted && score !== undefined && score >= questionCount / 2;
  const isFailed = isCompleted && !isPassed;
  
  return (
    <div className={`group rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col h-full hover:-translate-y-1 ${
      isPassed ? 'bg-emerald-50/30' : isFailed ? 'bg-rose-50/30' : 'bg-slate-50'
    }`}>
      {/* Header */}
      <div className="p-5 flex gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
          isPassed ? 'bg-emerald-100 text-emerald-600' : isFailed ? 'bg-rose-100 text-rose-600' : 'bg-indigo-100 text-indigo-600'
        }`}>
          {isPassed ? <Trophy className="w-6 h-6" /> : isFailed ? <AlertCircle className="w-6 h-6" /> : <PenTool className="w-6 h-6" />}
        </div>
        
        <div className="flex-1">
          <h3 className="text-lg font-bold text-slate-800 mb-1 line-clamp-2 group-hover:text-primary transition-colors">
            {title}
          </h3>
          <p className="text-xs font-medium text-slate-500 line-clamp-1">
            Thuộc bài: {lectureName}
          </p>
        </div>
      </div>

      {/* Content & Metrics */}
      <div className="px-5 pb-5 flex flex-col flex-1">
        <div className="flex items-center gap-6 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
              <Clock className="w-4 h-4 text-slate-400" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Thời gian</div>
              <div className="text-sm font-bold text-slate-700">{duration} phút</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
              <HelpCircle className="w-4 h-4 text-slate-400" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Số lượng</div>
              <div className="text-sm font-bold text-slate-700">{questionCount} câu</div>
            </div>
          </div>
        </div>
        
        <div className="flex-1" /> {/* Spacer */}

        {/* Action area */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          {isCompleted ? (
            <div className={`flex items-center gap-2 font-bold px-3 py-1.5 rounded-lg ${
              isPassed ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
            }`}>
              {isPassed ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{score}/{questionCount} Điểm</span>
            </div>
          ) : (
            <div className="text-sm font-medium text-slate-400">
              Chưa làm
            </div>
          )}
          
          <button className={`px-5 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 ${
            isCompleted 
              ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' 
              : 'bg-primary text-white hover:bg-primary/90 shadow-sm'
          }`}>
            {isCompleted ? 'Làm lại' : 'Làm bài ngay'}
          </button>
        </div>
      </div>
    </div>
  );
}
