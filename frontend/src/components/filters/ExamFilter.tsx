'use client'

import React from 'react';
import { ChevronDown, GraduationCap, BarChart2, Clock, FileText } from 'lucide-react';
import { FilterWrapper } from './FilterWrapper';
import { useSidebarFilter } from '@/hooks/useSidebarFilter';

export function ExamFilter() {
  const { 
    currentGrade, currentDifficulty, currentDuration, currentExamType, setFilter 
  } = useSidebarFilter();
  
  const grades = ['Lớp 5', 'Lớp 6', 'Lớp 7', 'Lớp 8', 'Lớp 9', 'Chuyển cấp'];
  const difficulties = ['Nhận biết', 'Thông hiểu', 'Vận dụng', 'Vận dụng cao'];
  const durations = ['15 phút', '45 phút', '90 phút'];
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
            <label key={grade} className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer hover:text-primary transition-colors py-1">
              <input 
                className="text-primary focus:ring-primary h-4 w-4 cursor-pointer" 
                type="radio"
                name="filter_grade"
                checked={currentGrade === grade}
                onChange={() => {}}
                onClick={() => setFilter('grade', grade)}
              /> <span className="truncate">{grade}</span>
            </label>
          ))}
        </div>
      </details>

      <details className="group px-3" open>
        <summary className="flex items-center justify-between cursor-pointer text-sm font-semibold py-1 hover:text-primary transition-colors list-none">
          <div className="flex items-center gap-2 text-slate-700">
            <BarChart2 className="w-5 h-5" />
            <span>Mức độ</span>
          </div>
          <ChevronDown className="w-4 h-4 group-open:rotate-180 transition-transform" />
        </summary>
        <div className="mt-3 space-y-2 pl-6">
          {difficulties.map(diff => (
            <label key={diff} className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer hover:text-primary transition-colors py-1">
              <input 
                className="text-primary focus:ring-primary h-4 w-4 cursor-pointer" 
                type="radio" 
                name="filter_diff"
                checked={currentDifficulty === diff}
                onChange={() => {}}
                onClick={() => setFilter('difficulty', diff)}
              /> {diff}
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
                onClick={() => setFilter('duration', duration)}
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
                onClick={() => setFilter('examType', type)}
              /> {type}
            </label>
          ))}
        </div>
      </details>
    </FilterWrapper>
  );
}
