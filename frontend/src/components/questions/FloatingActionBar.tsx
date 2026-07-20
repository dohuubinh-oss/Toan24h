import React from 'react';
import { Sparkles, X, CheckSquare, ArrowDownToLine } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useExam } from '../../contexts/ExamContext';

interface FloatingActionBarProps {
  selectedIds: string[];
  onClose: () => void;
  onSelectAll?: () => void;
}

export default function FloatingActionBar({ selectedIds, onClose, onSelectAll }: FloatingActionBarProps) {
  const router = useRouter();
  const { setSelectedQuestionIds } = useExam();
  const scrollToBottom = () => {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
  };
  
  if (selectedIds.length === 0) {
    return (
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white border border-slate-200 shadow-xl rounded-full px-4 py-2 flex items-center gap-4 z-50 animate-in slide-in-from-bottom-10 fade-in">
        <button 
          onClick={onSelectAll}
          className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-primary transition-colors whitespace-nowrap"
        >
          <CheckSquare className="w-4 h-4" />
          Chọn tất cả trên trang
        </button>
        <div className="h-4 w-px bg-slate-200"></div>
        <button 
          onClick={scrollToBottom}
          className="flex items-center justify-center p-1.5 text-slate-400 hover:text-primary hover:bg-slate-100 rounded-full transition-colors"
          title="Cuối trang"
        >
          <ArrowDownToLine className="w-4 h-4" />
        </button>
      </div>
    );
  }

  const handleCreateExam = () => {
    setSelectedQuestionIds(selectedIds);
    // Push with query params so it survives page reloads
    router.push(`/dashboard/exams/create?qids=${selectedIds.join(',')}`);
  };

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white border border-slate-200 shadow-2xl rounded-2xl px-6 py-3 flex items-center gap-6 z-50 animate-in slide-in-from-bottom-10 fade-in">
      <div className="flex items-center gap-3">
        <span className="w-6 h-6 rounded-full bg-primary text-white text-[10px] flex items-center justify-center font-bold">
          {selectedIds.length}
        </span>
        <span className="text-sm font-semibold text-slate-700 whitespace-nowrap">Đã chọn {selectedIds.length} câu hỏi</span>
      </div>
      <div className="h-6 w-px bg-slate-200"></div>
      <div className="flex items-center gap-4">
        <button 
          onClick={handleCreateExam}
          className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-primary transition-colors whitespace-nowrap"
        >
          <Sparkles className="w-5 h-5" />
          Tạo đề thi
        </button>
        {onSelectAll && (
          <button 
            onClick={onSelectAll}
            className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-primary transition-colors whitespace-nowrap"
          >
            <CheckSquare className="w-5 h-5" />
            Chọn tất cả
          </button>
        )}
        <button 
          onClick={onClose}
          className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-red-600 transition-colors whitespace-nowrap"
        >
          <X className="w-5 h-5" />
          Bỏ chọn
        </button>
        <div className="h-5 w-px bg-slate-200 ml-1"></div>
        <button 
          onClick={scrollToBottom}
          className="flex items-center justify-center p-1.5 text-slate-400 hover:text-primary hover:bg-slate-100 rounded-full transition-colors"
          title="Cuối trang"
        >
          <ArrowDownToLine className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
