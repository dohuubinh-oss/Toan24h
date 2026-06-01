'use client'

import React from 'react';
import { ChevronDown, BookOpen } from 'lucide-react';
import { FilterWrapper } from './FilterWrapper';
import { useSidebarFilter } from '@/hooks/useSidebarFilter';

export function StudentLectureFilter() {
  const { currentTopic, setFilter } = useSidebarFilter();
  const topics = ['Hệ thống số', 'Số thập phân', 'Diện tích', 'Hình khối', 'Hình trụ', 'Giải toán', 'Phân số', 'Hình học'];

  return (
    <FilterWrapper searchPlaceholder="Tìm kiếm theo tên, nội dung...">
      <details className="group px-3" open>
        <summary className="flex items-center justify-between cursor-pointer text-sm font-semibold py-1 hover:text-primary transition-colors list-none">
          <div className="flex items-center gap-2 text-slate-700">
            <BookOpen className="w-5 h-5" />
            <span>Chuyên đề</span>
          </div>
          <ChevronDown className="w-4 h-4 group-open:rotate-180 transition-transform" />
        </summary>
        <div className="mt-3 grid grid-cols-2 gap-2 pl-6">
          {topics.map(topic => (
            <label key={topic} className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer hover:text-primary transition-colors py-1">
              <input 
                className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4 cursor-pointer" 
                type="checkbox" 
                checked={currentTopic === topic}
                onChange={() => setFilter('topic', topic)}
              /> <span className="truncate">{topic}</span>
            </label>
          ))}
        </div>
      </details>
    </FilterWrapper>
  );
}
