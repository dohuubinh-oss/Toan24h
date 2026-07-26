'use client'

import React from 'react';
import { ChevronDown, GraduationCap, Clock, FileText } from 'lucide-react';
import { FilterWrapper } from './FilterWrapper';
import { useSidebarFilter } from '@/hooks/useSidebarFilter';

export function ExamFilter() {
  const { 
    currentGrade, currentDifficulty, currentDuration, currentExamType, setFilter 
  } = useSidebarFilter();
  
  const grades = [
    { label: 'Lớp 5', value: '5' },
    { label: 'Lớp 6', value: '6' },
    { label: 'Lớp 7', value: '7' },
    { label: 'Lớp 8', value: '8' },
    { label: 'Lớp 9', value: '9' },
    { label: 'Chuyển cấp', value: 'chuyen_cap' }
  ];

  const durations = ['0 phút', '15 phút', '45 phút', '90 phút'];
  const examTypes = ['Giữa kỳ', 'Cuối kỳ', 'Chuyên'];

  return (
    <FilterWrapper searchPlaceholder="Tìm kiếm đề thi...">
      <details className="group px-3" open>
        <summary className="flex items-center justify-between cursor-pointer text-sm font-semibold py-1 hover:text-primary transition-colors list-none">
          <div className="flex items-center gap-2 text-slate-700">
            <GraduationCap className="w-5 h-5" />
            <span>Khối lớp</span>
          </div>
          <ChevronDown className="w-4 h-4 group-open:rotate-180 transition-transform" />
        </summary>
        <div className="mt-3 grid grid-cols-2 gap-2 pl-6">
          {grades.map(grade => (
            <label key={grade.value} className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer hover:text-primary transition-colors py-1">
              <input 
                className="text-primary focus:ring-primary h-4 w-4 cursor-pointer" 
                type="radio"
                name="filter_grade"
                checked={currentGrade === grade.value}
                onChange={() => {}}
                onClick={(e) => { e.preventDefault(); setFilter('grade', grade.value); }}
              /> <span className="truncate">{grade.label}</span>
            </label>
          ))}
        </div>
      </details>



      <details className="group px-3" open>
        <summary className="flex items-center justify-between cursor-pointer text-sm font-semibold py-1 hover:text-primary transition-colors list-none">
          <div className="flex items-center gap-2 text-slate-700">
            <Clock className="w-5 h-5" />
            <span>Thời gian</span>
          </div>
          <ChevronDown className="w-4 h-4 group-open:rotate-180 transition-transform" />
        </summary>
        <div className="mt-3 space-y-2 pl-6">
          {durations.map(duration => (
            <label key={duration} className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer hover:text-primary transition-colors py-1">
              <input 
                className="text-primary focus:ring-primary h-4 w-4 cursor-pointer" 
                type="radio" 
                name="filter_duration"
                checked={currentDuration === duration}
                onChange={() => {}}
                onClick={(e) => { e.preventDefault(); setFilter('duration', duration); }}
              /> {duration}
            </label>
          ))}
        </div>
      </details>

      <details className="group px-3" open>
        <summary className="flex items-center justify-between cursor-pointer text-sm font-semibold py-1 hover:text-primary transition-colors list-none">
          <div className="flex items-center gap-2 text-slate-700">
            <FileText className="w-5 h-5" />
            <span>Loại đề</span>
          </div>
          <ChevronDown className="w-4 h-4 group-open:rotate-180 transition-transform" />
        </summary>
        <div className="mt-3 space-y-2 pl-6">
          {examTypes.map(type => (
            <label key={type} className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer hover:text-primary transition-colors py-1">
              <input 
                className="text-primary focus:ring-primary h-4 w-4 cursor-pointer" 
                type="radio" 
                name="filter_exam_type"
                checked={currentExamType === type}
                onChange={() => {}}
                onClick={(e) => { e.preventDefault(); setFilter('examType', type); }}
              /> {type}
            </label>
          ))}
        </div>
      </details>
    </FilterWrapper>
  );
}
