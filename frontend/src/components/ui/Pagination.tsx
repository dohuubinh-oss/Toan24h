'use client';

import React from 'react';
import { ChevronsLeft, ChevronLeft, ChevronsRight, ChevronRight } from 'lucide-react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    
    // Call the callback if provided, else use router to update searchParams
    if (onPageChange) {
      onPageChange(page);
    } else {
      const params = new URLSearchParams(searchParams.toString());
      params.set('page', page.toString());
      router.push(`${pathname}?${params.toString()}`, { scroll: true });
    }
  };

  // Generate page numbers
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      let startPage = Math.max(1, currentPage - 2);
      let endPage = Math.min(totalPages, currentPage + 2);

      if (currentPage <= 3) {
        endPage = 5;
      } else if (currentPage >= totalPages - 2) {
        startPage = totalPages - 4;
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }
    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
      <p className="text-sm text-slate-500">
        Hiển thị <span className="font-bold text-slate-800">{startIndex} - {endIndex}</span> trong số <span className="font-bold text-slate-800">{totalItems.toLocaleString('vi-VN')}</span> {itemName}
      </p>
      <div className="flex items-center gap-1 flex-wrap justify-center">
        <button 
          className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-primary disabled:opacity-30 rounded transition-colors" 
          disabled={currentPage <= 1}
          onClick={() => handlePageChange(1)}
          aria-label="Trang đầu"
        >
          <ChevronsLeft className="w-5 h-5" />
        </button>
        <button 
          className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-primary disabled:opacity-30 rounded transition-colors" 
          disabled={currentPage <= 1}
          onClick={() => handlePageChange(currentPage - 1)}
          aria-label="Trang trước"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        {pages[0] > 1 && (
          <>
            <button 
              className="w-11 h-11 rounded text-sm font-bold hover:bg-slate-100 text-slate-600 transition-colors"
              onClick={() => handlePageChange(1)}
            >
              1
            </button>
            {pages[0] > 2 && <span className="px-1 text-slate-400">...</span>}
          </>
        )}

        {pages.map(page => (
          <button 
            key={page}
            className={`w-11 h-11 rounded text-sm font-bold transition-colors ${currentPage === page ? 'bg-primary text-white shadow-sm' : 'hover:bg-slate-100 text-slate-600'}`}
            onClick={() => handlePageChange(page)}
          >
            {page}
          </button>
        ))}
        
        {pages[pages.length - 1] < totalPages && (
          <>
            {pages[pages.length - 1] < totalPages - 1 && <span className="px-1 text-slate-400">...</span>}
            <button 
              className="w-11 h-11 rounded text-sm font-bold hover:bg-slate-100 text-slate-600 transition-colors"
              onClick={() => handlePageChange(totalPages)}
            >
              {totalPages}
            </button>
          </>
        )}
        
        <button 
          className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-primary disabled:opacity-30 rounded transition-colors" 
          disabled={currentPage >= totalPages}
          onClick={() => handlePageChange(currentPage + 1)}
          aria-label="Trang sau"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
        <button 
          className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-primary disabled:opacity-30 rounded transition-colors" 
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
