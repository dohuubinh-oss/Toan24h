'use client'

import React from 'react';
import { ChevronDown, GraduationCap, BookOpen, Shapes, BarChart2 } from 'lucide-react';
import { FilterWrapper } from './FilterWrapper';
import { useSidebarFilter } from '@/hooks/useSidebarFilter';

export function QuestionFilter() {
  const { 
    currentGrade, currentTopic, currentType, currentDifficulty, setFilter 
  } = useSidebarFilter();
  
  const grades = [
    { label: 'Lớp 5', value: '5' },
    { label: 'Lớp 6', value: '6' },
    { label: 'Lớp 7', value: '7' },
    { label: 'Lớp 8', value: '8' },
    { label: 'Lớp 9', value: '9' },
    { label: 'Chuyển cấp', value: 'chuyen_cap' }
  ];
  
  const TOPICS_BY_GRADE: Record<string, string[]> = {
    '5': ['Phân số thập phân và hỗn số', 'Số thập phân và các phép toán', 'Diện tích hình tam giác, hình thang', 'Chu vi và diện tích hình tròn', 'Hình hộp chữ nhật, hình lập phương', 'Hình trụ, hình cầu', 'Đo thể tích và chuyển đổi đơn vị', 'Toán chuyển động đều', 'Giải toán tỉ số phần trăm'],
    '6': ['Tập hợp số tự nhiên', 'Tính chất chia hết và ước số', 'Tập hợp số nguyên và phép tính', 'Phân số bằng nhau và rút gọn', 'Các phép tính với số thập phân', 'Hình vuông, tam giác đều, lục giác đều', 'Hình chữ nhật, hình thoi, hình bình hành', 'Hình có trục đối xứng', 'Hình có tâm đối xứng', 'Điểm, đường thẳng, đoạn thẳng', 'Trung điểm của đoạn thẳng', 'Góc và số đo góc'],
    '7': ['Tập hợp số hữu tỉ', 'Căn bậc hai số học và số thực', 'Tỉ lệ thức và tính chất dãy tỉ số bằng nhau', 'Đại lượng tỉ lệ thuận, tỉ lệ nghịch', 'Biểu thức đại số', 'Đa thức một biến và nghiệm của đa thức', 'Hai góc kề bù, đối đỉnh', 'Dấu hiệu hai đường thẳng song song', 'Tổng các góc trong một tam giác', 'Tam giác bằng nhau (c.c.c, c.g.c, g.c.g)', 'Tam giác cân và định lý Pythagoras', 'Làm quen với xác suất của biến cố ngẫu nhiên'],
    '8': ['Đơn thức và đa thức nhiều biến', 'Các phép tính với đa thức', 'Hằng đẳng thức đáng nhớ', 'Khái niệm phân thức', 'Các phép toán cộng, trừ, nhân, chia phân thức', 'Khái niệm hàm số', 'Hàm số bậc nhất y = ax + b', 'Hệ số góc của đường thẳng', 'Cách giải phương trình bậc nhất một ẩn', 'Giải bài toán bằng cách lập phương trình', 'Định lý Thalès thuận và đảo', 'Đường trung bình của tam giác', 'Các trường hợp đồng dạng của tam giác', 'Tam giác vuông đồng dạng', 'Hình chóp tam giác đều', 'Hình chóp tứ giác đều'],
    '9': ['Phương trình bậc nhất hai ẩn', 'Hệ hai phương trình bậc nhất hai ẩn', 'Hàm số y = ax^2 (a khác 0)', 'Đồ thị hàm số bậc hai đơn giản', 'Công thức nghiệm phương trình bậc hai', 'Định lý Viète và ứng dụng', 'Tỉ số lượng giác của góc nhọn', 'Hệ thức giữa cạnh và góc', 'Sự xác định đường tròn và vị trí tương đối', 'Góc với đường tròn (Góc nội tiếp, góc ở tâm)', 'Hình trụ', 'Hình nón', 'Hình cầu'],
    'chuyen_cap': ['Hệ thống số', 'Hình học', 'Giải toán']
  };

  const topics = currentGrade && TOPICS_BY_GRADE[currentGrade] ? TOPICS_BY_GRADE[currentGrade] : [];
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
