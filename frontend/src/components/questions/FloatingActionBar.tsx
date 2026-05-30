import React from 'react';
import { Sparkles, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useExam } from '../../contexts/ExamContext';

interface FloatingActionBarProps {
  selectedIds: string[];
  onClose: () => void;
}

export default function FloatingActionBar({ selectedIds, onClose }: FloatingActionBarProps) {
  const router = useRouter();
  const { setSelectedQuestionIds } = useExam();
  
  if (selectedIds.length === 0) return null;

  const handleCreateExam = () => {
    setSelectedQuestionIds(selectedIds);
    router.push('/dashboard/exams/create');
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
        <button 
          onClick={onClose}
          className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-red-600 transition-colors whitespace-nowrap"
        >
          <X className="w-5 h-5" />
          Bỏ chọn tất cả
        </button>
      </div>
      <button onClick={onClose} className="text-slate-400 hover:text-slate-600 ml-2">
        <X className="w-6 h-6" />
      </button>
    </div>
  );
}
