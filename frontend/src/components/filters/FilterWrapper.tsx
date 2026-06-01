'use client'

import React from 'react';
import { Search, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useSidebarFilter } from '@/hooks/useSidebarFilter';

export function FilterWrapper({ 
  children, 
  searchPlaceholder 
}: { 
  children: React.ReactNode, 
  searchPlaceholder: string 
}) {
  const { localSearch, handleSearch, clearFilters } = useSidebarFilter();
  
  return (
    <div className="px-3 py-4 mt-2 border-t border-slate-100 dark:border-slate-800">
      <div className="space-y-4">
        <div className="px-3 mb-2">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder={searchPlaceholder}
              className="w-full text-sm border border-slate-200 rounded-lg pl-9 pr-3 h-10 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-white"
              value={localSearch}
              onChange={handleSearch}
            />
          </div>
        </div>

        <div className="px-3 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Bộ lọc tìm kiếm</h3>
          <button 
            onClick={clearFilters}
            className="p-1.5 text-slate-400 hover:text-primary transition-all outline-none focus:outline-none"
            title="Xóa bộ lọc"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
        
        {children}
        
        <div className="px-3 pt-4">
          <Button 
            variant="outline"
            onClick={clearFilters}
            className="w-full text-slate-500 hover:text-primary border-slate-200 hover:border-primary/50 mb-4"
          >
            Xóa bộ lọc
          </Button>
        </div>
      </div>
    </div>
  );
}
