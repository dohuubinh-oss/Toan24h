import React from 'react';
import { Sparkles, X, CheckSquare, ArrowDownToLine } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useExam } from '@/contexts/ExamContext';

interface FloatingActionBarProps {
  selectedIds: string[];
  onClose: () => void;
  onSelectAll?: () => void;
}

export default function FloatingActionBar({ selectedIds, onClose, onSelectAll }: FloatingActionBarProps) {
  const router = useRouter();
  const { setSelectedQuestionIds } = useExam();
  
  if (selectedIds.length === 0) {
    return null;
  }

  const handleCreateExam = () => {
    setSelectedQuestionIds(selectedIds);
    // Push with query params so it survives page reloads
    router.push(`/dashboard/exams/create?qids=${selectedIds.join(',')}`);
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white border border-slate-200 shadow-2xl rounded-2xl px-5 py-3 flex items-center gap-4 sm:gap-6 z-50 animate-in slide-in-from-bottom-6 fade-in max-w-[95vw] overflow-x-auto">
      <div className="flex items-center gap-2.5 shrink-0">
        <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">
          {selectedIds.length}
        </span>
        <span className="text-sm font-semibold text-slate-800 whitespace-nowrap">Đã chọn {selectedIds.length} câu</span>
      </div>
      <div className="h-5 w-px bg-slate-200 shrink-0" aria-hidden="true" />
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <button 
          type="button"
          onClick={handleCreateExam}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-primary/20 transition-all cursor-pointer whitespace-nowrap"
        >
          <Sparkles className="w-4 h-4" />
          <span>Tạo đề thi</span>
        </button>
        {onSelectAll && (
          <button 
            type="button"
            onClick={onSelectAll}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-primary hover:bg-slate-100 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
          >
            <CheckSquare className="w-4 h-4" />
            <span className="hidden sm:inline">Chọn tất cả</span>
          </button>
        )}
        <button 
          type="button"
          onClick={onClose}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
        >
          <X className="w-4 h-4" />
          <span>Bỏ chọn</span>
        </button>
      </div>
    </div>
  );
}
