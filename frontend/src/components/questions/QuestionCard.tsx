import React from 'react';
import MathText from '../ui/MathText';

interface QuestionCardProps {
  id: string;
  grade: number;
  topic: string;
  difficulty: string;
  content: string;
  options?: string[];
  correctAnswer?: string;
  updatedAt: string;
}

export default function QuestionCard({
  id, grade, topic, difficulty, content, options, correctAnswer, updatedAt
}: QuestionCardProps) {
  
  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'Nhận biết': return 'bg-green-500/10 text-green-600';
      case 'Thông hiểu': return 'bg-amber-500/10 text-amber-600';
      case 'Vận dụng cao': return 'bg-red-500/10 text-red-600';
      default: return 'bg-primary/10 text-primary';
    }
  };

  return (
    <div className="bg-card-bg rounded-xl border border-slate-200/60 shadow-sm hover:shadow-md hover:border-primary/30 transition-all group overflow-hidden">
      <div className="p-5">
        {/* Header Tags */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <input className="rounded border-slate-300 text-primary focus:ring-primary h-5 w-5 cursor-pointer" type="checkbox" />
            <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-bold rounded uppercase">
              LỚP {grade} - {topic}
            </span>
            <span className={`px-2 py-1 text-xs font-bold rounded uppercase ${getDifficultyColor(difficulty)}`}>
              {difficulty}
            </span>
            <span className="text-xs text-slate-400 font-medium">ID: #{id}</span>
          </div>
          
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button className="p-2 w-10 h-10 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all cursor-pointer" title="Xem lịch sử">
              <span className="material-symbols-outlined text-xl">history</span>
            </button>
            <button className="p-2 w-10 h-10 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all cursor-pointer" title="Chỉnh sửa">
              <span className="material-symbols-outlined text-xl">edit</span>
            </button>
            <button className="p-2 w-10 h-10 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer" title="Xóa">
              <span className="material-symbols-outlined text-xl">delete</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <MathText content={content} className="text-lg leading-relaxed text-slate-800 mb-6 pl-7" />

        {/* Options */}
        {options && options.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-7">
            {options.map((opt, idx) => {
              const label = String.fromCharCode(65 + idx); // A, B, C, D
              const isCorrect = label === correctAnswer;
              
              return (
                <div key={idx} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${isCorrect ? 'bg-primary/5 border-primary/30 shadow-sm' : 'bg-white border-slate-200 hover:border-primary/30 hover:shadow-sm transition-all'}`}>
                  <span className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-bold ${isCorrect ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600'}`}>
                    {label}
                  </span>
                  <MathText content={opt} className={`text-sm ${isCorrect ? 'font-semibold text-primary' : ''}`} />
                  {isCorrect && <span className="material-symbols-outlined text-primary text-sm ml-auto">check_circle</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-4">
          <span className="text-xs text-slate-400">Lần cuối cập nhật: {updatedAt} bởi Admin</span>
        </div>
        <button className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
          Xem chi tiết giải bài
          <span className="material-symbols-outlined text-xs">arrow_forward</span>
        </button>
      </div>
    </div>
  );
}
