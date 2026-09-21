'use client'

import React from 'react';
import { ChevronDown, BookOpen } from 'lucide-react';
import { FilterWrapper } from './FilterWrapper';
import { useSidebarFilter } from '@/hooks/useSidebarFilter';
import { usePathname } from 'next/navigation';
import { TOPIC_MAPPING } from '@/constants/topics';

export function StudentLectureFilter() {
  const { currentTopic, setFilter } = useSidebarFilter();
  const pathname = usePathname();

  // Extract grade from pathname e.g. /lectures/lop/6 -> 6
  const segments = pathname?.split('/') || [];
  const gradeIndex = segments.indexOf('lop');
  const gradeFromPath = gradeIndex !== -1 && segments[gradeIndex + 1] ? segments[gradeIndex + 1] : '';

  const topics = gradeFromPath && TOPIC_MAPPING[gradeFromPath] 
    ? TOPIC_MAPPING[gradeFromPath] 
    : Object.values(TOPIC_MAPPING).flat();

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
        <div className="mt-3 flex flex-col gap-2 pl-6">
          {topics.map(topic => (
            <label key={topic} className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer hover:text-primary transition-colors py-1">
              <input 
                className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4 cursor-pointer flex-shrink-0" 
                type="checkbox" 
                checked={currentTopic === topic}
                onChange={() => setFilter('topic', topic)}
              /> <span className="line-clamp-2">{topic}</span>
            </label>
          ))}
        </div>
      </details>
    </FilterWrapper>
  );
}

