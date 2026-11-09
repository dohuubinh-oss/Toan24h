'use client';

import React from 'react';
import { ChevronsLeft, ChevronLeft, ChevronsRight, ChevronRight } from 'lucide-react';
import { usePagination } from '@/hooks/usePagination';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  startIndex: number;
  endIndex: number;
  itemName?: string;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, totalItems, startIndex, endIndex, itemName = "câu hỏi", onPageChange }: PaginationProps) {
  const { pages, handlePageChange } = usePagination({
    currentPage,
    totalPages,
    onChange: onPageChange,
  });

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
      <p className="text-sm text-slate-500">
        Hiển thị <span className="font-bold text-slate-800">{startIndex} - {endIndex}</span> trong số <span className="font-bold text-slate-800">{totalItems.toLocaleString('vi-VN')}</span> {itemName}
      </p>
      <div className="flex items-center gap-1 flex-wrap justify-center">
        <button 
          className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-600 hover:text-primary hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 rounded-xl transition-colors" 
          disabled={currentPage <= 1}
          onClick={() => handlePageChange(1)}
          aria-label="Trang đầu"
        >
          <ChevronsLeft className="w-5 h-5" />
        </button>
        <button 
          className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-600 hover:text-primary hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 rounded-xl transition-colors" 
          disabled={currentPage <= 1}
          onClick={() => handlePageChange(currentPage - 1)}
          aria-label="Trang trước"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        {pages[0] > 1 && (
          <>
            <button 
              className="w-11 h-11 rounded-xl text-sm font-bold hover:bg-slate-100 text-slate-600 transition-colors"
              onClick={() => handlePageChange(1)}
            >
              1
            </button>
            {pages[0] > 2 && <span className="px-1 text-slate-500 font-medium">...</span>}
          </>
        )}

        {pages.map(page => (
          <button 
            key={page}
            className={`w-11 h-11 rounded-xl text-sm font-bold transition-colors ${currentPage === page ? 'bg-primary text-white shadow-sm' : 'hover:bg-slate-100 text-slate-600'}`}
            onClick={() => handlePageChange(page)}
          >
            {page}
          </button>
        ))}
        
        {pages[pages.length - 1] < totalPages && (
          <>
            {pages[pages.length - 1] < totalPages - 1 && <span className="px-1 text-slate-500 font-medium">...</span>}
            <button 
              className="w-11 h-11 rounded-xl text-sm font-bold hover:bg-slate-100 text-slate-600 transition-colors"
              onClick={() => handlePageChange(totalPages)}
            >
              {totalPages}
            </button>
          </>
        )}
        
        <button 
          className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-600 hover:text-primary hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 rounded-xl transition-colors" 
          disabled={currentPage >= totalPages}
          onClick={() => handlePageChange(currentPage + 1)}
          aria-label="Trang sau"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
        <button 
          className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-600 hover:text-primary hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 rounded-xl transition-colors" 
          disabled={currentPage >= totalPages}
          onClick={() => handlePageChange(totalPages)}
          aria-label="Trang cuối"
        >
          <ChevronsRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
