'use client'

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { GraduationCap, ChevronDown, Shapes, BarChart2, RefreshCw, BookOpen, Clock, FileText, Users, Search } from 'lucide-react';
import { Button } from '../ui/Button';

export default function SidebarFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isExamsPage = pathname?.startsWith('/dashboard/exams');
  const isUsersPage = pathname?.startsWith('/dashboard/users');

  const currentGrade = searchParams.get('grade') || '';
  const currentTopic = searchParams.get('topic') || '';
  const currentType = searchParams.get('type') || '';
  const currentDifficulty = searchParams.get('difficulty') || '';
  const currentDuration = searchParams.get('duration') || '';
  const currentExamType = searchParams.get('examType') || '';
  const currentRole = searchParams.get('role') || '';
  const searchQuery = searchParams.get('q') || '';
  
  const [localSearch, setLocalSearch] = useState(searchQuery);

  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== searchQuery) {
        const params = new URLSearchParams(searchParams.toString());
        if (localSearch) {
          params.set('q', localSearch);
        } else {
          params.delete('q');
        }
        router.push(`${pathname}?${params.toString()}`);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch, pathname, router, searchParams, searchQuery]);

  const setFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (params.get(key) === value) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    // If grade changes, reset topic
    if (key === 'grade' && params.get('grade') !== currentGrade) {
      params.delete('topic');
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const clearFilters = () => {
    setLocalSearch('');
    router.push(pathname || '');
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearch(e.target.value);
  };

  // Dữ liệu chung
  const grades = ['Lớp 5', 'Lớp 6', 'Lớp 7', 'Lớp 8', 'Lớp 9', 'Chuyển cấp'];
  
  // Dữ liệu riêng trang Câu hỏi
  const topics = ['Hệ thống số', 'Số thập phân', 'Diện tích', 'Hình khối', 'Hình trụ', 'Giải toán', 'Phân số', 'Hình học'];
  const types = ['Trắc nghiệm', 'Tự luận', 'Câu hỏi chùm'];
  const difficulties = ['Nhận biết', 'Thông hiểu', 'Vận dụng', 'Vận dụng cao'];

  // Dữ liệu riêng trang Đề thi
  const durations = ['15 phút', '45 phút', '90 phút'];
  const examTypes = ['Giữa kỳ', 'Cuối kỳ', 'Chuyên'];

  // Dữ liệu riêng trang Người dùng
  const roles = ['Học sinh', 'Giáo viên'];

  return (
    <div className="space-y-4">
      <div className="px-3 mb-2">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder={isUsersPage ? "Tìm kiếm theo tên, email..." : isExamsPage ? "Tìm kiếm đề thi..." : "Tìm kiếm câu hỏi..."}
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
      
      {/* Khối lớp (Dùng chung) */}
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

      {/* --- Bộ lọc cho Ngân hàng câu hỏi --- */}
      {!isExamsPage && !isUsersPage && currentGrade && (
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
      )}

      {!isExamsPage && !isUsersPage && (
        <>
          <details className="group px-3" open>
            <summary className="flex items-center justify-between cursor-pointer text-sm font-semibold py-1 hover:text-primary transition-colors list-none">
              <div className="flex items-center gap-2 text-slate-700">
                <Shapes className="w-5 h-5" />
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
                    onClick={() => setFilter('type', type)}
                  /> {type}
                </label>
              ))}
            </div>
          </details>
        </>
      )}

      {/* --- Mức độ (Dùng chung cho Câu hỏi & Đề thi) --- */}
      {!isUsersPage && (
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
      )}

      {/* --- Bộ lọc cho Quản lý người dùng --- */}
      {isUsersPage && (
        <details className="group px-3" open>
          <summary className="flex items-center justify-between cursor-pointer text-sm font-semibold py-1 hover:text-primary transition-colors list-none">
            <div className="flex items-center gap-2 text-slate-700">
              <Users className="w-5 h-5" />
              <span>Vai trò</span>
            </div>
            <ChevronDown className="w-4 h-4 group-open:rotate-180 transition-transform" />
          </summary>
          <div className="mt-3 space-y-2 pl-6">
            {roles.map(role => (
              <label key={role} className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer hover:text-primary transition-colors py-1">
                <input 
                  className="text-primary focus:ring-primary h-4 w-4 cursor-pointer" 
                  type="radio" 
                  name="filter_role"
                  checked={currentRole === role}
                  onChange={() => {}}
                  onClick={() => setFilter('role', role)}
                /> {role}
              </label>
            ))}
          </div>
        </details>
      )}

      {/* --- Bộ lọc cho Ngân hàng đề thi --- */}
      {isExamsPage && (
        <>
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
        </>
      )}

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
  );
}
