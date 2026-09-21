'use client'

import React from 'react';
import { ChevronDown, GraduationCap, BookOpen, Shapes, BarChart2 } from 'lucide-react';
import { FilterWrapper } from './FilterWrapper';
import { useSidebarFilter } from '@/hooks/useSidebarFilter';

import { TOPIC_MAPPING, GRADES } from '@/constants/topics';

export function QuestionFilter() {
  const { 
    currentGrade, currentTopic, currentType, currentDifficulty, setFilter 
  } = useSidebarFilter();
  
  const grades = GRADES;
  const topics = currentGrade && TOPIC_MAPPING[currentGrade] ? TOPIC_MAPPING[currentGrade] : [];
  const types = ['Trắc nghiệm', 'Tự luận', 'Câu hỏi chùm'];
  const difficulties = ['Nhận biết', 'Thông hiểu', 'Vận dụng', 'Vận dụng cao'];

  return (
    <FilterWrapper searchPlaceholder="Tìm kiếm câu hỏi...">
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

      {currentGrade && topics.length > 0 && (
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
      )}

      <details className="group px-3" open>
        <summary className="flex items-center justify-between cursor-pointer text-sm font-semibold py-1 hover:text-primary transition-colors list-none">
          <div className="flex items-center gap-2 text-slate-700">
            <BookOpen className="w-5 h-5" />
            <span>Loại câu hỏi</span>
          </div>
          <ChevronDown className="w-4 h-4 group-open:rotate-180 transition-transform" />
        </summary>
        <div className="mt-3 space-y-2 pl-6">
          {types.map(type => (
            <label key={type} className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer hover:text-primary transition-colors py-1">
              <input 
                className="text-primary focus:ring-primary h-4 w-4 cursor-pointer" 
                type="radio" 
                name="filter_type"
                checked={currentType === type}
                onChange={() => {}}
                onClick={(e) => { e.preventDefault(); setFilter('type', type); }}
              /> {type}
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
                onClick={(e) => { e.preventDefault(); setFilter('difficulty', diff); }}
              /> {diff}
            </label>
          ))}
        </div>
      </details>
    </FilterWrapper>
  );
}
