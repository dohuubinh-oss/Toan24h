'use client';

import React from 'react';
import { ChevronsLeft, ChevronLeft, ChevronsRight, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  startIndex: number;
  endIndex: number;
  itemName?: string;
  onPageChange?: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, totalItems, startIndex, endIndex, itemName = "câu hỏi", onPageChange }: PaginationProps) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-slate-500">
        Hiển thị <span className="font-bold text-slate-800">{startIndex} - {endIndex}</span> trong số <span className="font-bold text-slate-800">{totalItems.toLocaleString('vi-VN')}</span> {itemName}
      </p>
      <div className="flex items-center gap-1">
        <button 
          className="p-2 text-slate-400 hover:text-primary disabled:opacity-30" 
          disabled={currentPage === 1}
          onClick={() => onPageChange?.(1)}
        >
          <ChevronsLeft className="w-5 h-5" />
        </button>
        <button 
          className="p-2 text-slate-400 hover:text-primary disabled:opacity-30" 
          disabled={currentPage === 1}
          onClick={() => onPageChange?.(currentPage - 1)}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        <button 
          className={`w-8 h-8 rounded text-xs font-bold ${currentPage === 1 ? 'bg-primary text-white' : 'hover:bg-slate-100 text-slate-600'}`}
          onClick={() => onPageChange?.(1)}
        >
          1
        </button>
        <button 
          className={`w-8 h-8 rounded text-xs font-bold ${currentPage === 2 ? 'bg-primary text-white' : 'hover:bg-slate-100 text-slate-600'}`}
          onClick={() => onPageChange?.(2)}
        >
          2
        </button>
        <button 
          className={`w-8 h-8 rounded text-xs font-bold ${currentPage === 3 ? 'bg-primary text-white' : 'hover:bg-slate-100 text-slate-600'}`}
          onClick={() => onPageChange?.(3)}
        >
          3
        </button>
        
        <span className="px-1 text-slate-400">...</span>
        
        <button 
          className={`w-8 h-8 rounded text-xs font-bold ${currentPage === totalPages ? 'bg-primary text-white' : 'hover:bg-slate-100 text-slate-600'}`}
          onClick={() => onPageChange?.(totalPages)}
        >
          {totalPages}
        </button>
        
        <button 
          className="p-2 text-slate-400 hover:text-primary disabled:opacity-30" 
          disabled={currentPage === totalPages}
          onClick={() => onPageChange?.(currentPage + 1)}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
        <button 
          className="p-2 text-slate-400 hover:text-primary disabled:opacity-30" 
          disabled={currentPage === totalPages}
          onClick={() => onPageChange?.(totalPages)}
        >
          <ChevronsRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
