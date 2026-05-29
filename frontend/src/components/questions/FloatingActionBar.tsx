import React from 'react';
import { FolderOpen, Printer, Trash2, X } from 'lucide-react';

interface FloatingActionBarProps {
  selectedCount: number;
  onClose: () => void;
}

export default function FloatingActionBar({ selectedCount, onClose }: FloatingActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white border border-slate-200 shadow-2xl rounded-2xl px-6 py-3 flex items-center gap-6 z-50 animate-in slide-in-from-bottom-10 fade-in">
      <div className="flex items-center gap-3">
        <span className="w-6 h-6 rounded-full bg-primary text-white text-[10px] flex items-center justify-center font-bold">
          {selectedCount}
        </span>
        <span className="text-sm font-semibold text-slate-700 whitespace-nowrap">Đã chọn {selectedCount} câu hỏi</span>
      </div>
      <div className="h-6 w-px bg-slate-200"></div>
      <div className="flex items-center gap-4">
        <button className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-primary transition-colors whitespace-nowrap">
          <FolderOpen className="w-5 h-5" />
          Lưu vào thư mục
        </button>
        <button className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-primary transition-colors whitespace-nowrap">
          <Printer className="w-5 h-5" />
          In đề thi
        </button>
        <button className="flex items-center gap-2 text-xs font-bold text-red-500 hover:text-red-600 transition-colors whitespace-nowrap">
          <Trash2 className="w-5 h-5" />
          Xóa hàng loạt
        </button>
      </div>
      <button onClick={onClose} className="text-slate-400 hover:text-slate-600 ml-2">
        <X className="w-6 h-6" />
      </button>
    </div>
  );
}
