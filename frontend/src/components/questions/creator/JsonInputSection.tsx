import React, { useState } from 'react'
import { Code2, Settings2, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, Trash2 } from 'lucide-react'
import { QuestionBlock, Question } from '../../../types/question'

interface JsonInputSectionProps {
  onProcessJson?: (blocks: QuestionBlock[]) => void;
  currentGlobalIndex?: number;
  totalQuestions?: number;
  currentQuestion?: Question | null;
  onNext?: () => void;
  onPrev?: () => void;
}

export default function JsonInputSection({
  onProcessJson = () => {},
  currentGlobalIndex = 1,
  totalQuestions = 0,
  currentQuestion = null,
  onNext = () => {},
  onPrev = () => {}
}: JsonInputSectionProps) {
  const [jsonInput, setJsonInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleProcess = () => {
    try {
      setError(null);
      if (!jsonInput.trim()) {
        setError('Vui lòng nhập JSON');
        return;
      }
      const parsed = JSON.parse(jsonInput) as QuestionBlock[];
      if (!Array.isArray(parsed)) {
        throw new Error('Dữ liệu phải là mảng (array)');
      }
      onProcessJson(parsed);
    } catch (err: any) {
      setError(err.message || 'Lỗi cú pháp JSON không hợp lệ');
    }
  };

  const hint = `[{
  "shared_content": "Nội dung dẫn chung",
  "questions": [{
    "type_question": "group" hoặc "single",
    "content": "Nội dung câu hỏi",
    "type": "Trắc nghiệm" hoặc "Tự luận",
    "options": ["A", "B", "C", "D"],
    "correct_answer": "đáp án đúng",
    "solution_guide": "Lời giải"
  }]
}]`;

  return (
    <section className="space-y-4">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 relative shadow-primary/5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Code2 className="text-primary w-5 h-5" />
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-tight">Nhập nhanh bằng JSON</h2>
            <span className="px-1.5 py-0.5 bg-blue-100 text-primary text-[9px] font-bold rounded uppercase">Thông minh</span>
          </div>
        </div>
        <div className="space-y-4">
          <textarea 
            className={`w-full min-h-[120px] bg-slate-50 border-slate-200 rounded-xl p-4 focus:ring-primary focus:border-primary text-sm font-mono placeholder:text-slate-400 ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : ''}`}
            placeholder={hint}
            value={jsonInput}
            onChange={e => setJsonInput(e.target.value)}
          />
          {error && (
            <p className="text-red-500 text-xs font-bold px-1">{error}</p>
          )}
          <div className="flex justify-end">
            <button 
              className="bg-primary hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-primary/30"
              onClick={handleProcess}
            >
              <Settings2 className="w-4 h-4" />
              Xử lý JSON
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Controls Card */}
      <div className="flex justify-center">
        <div className="bg-white rounded-full shadow-sm border border-slate-200 px-2 py-1.5 flex items-center gap-2">
          <button className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 disabled:opacity-30" disabled>
            <ChevronsLeft className="w-5 h-5" />
          </button>
          <button 
            className="p-2 hover:bg-slate-100 rounded-full transition-colors border border-slate-100 shadow-sm disabled:opacity-30" 
            onClick={onPrev}
            disabled={totalQuestions === 0 || currentGlobalIndex <= 1}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="px-4 py-1 flex items-center gap-2 border-x border-slate-100">
            <span className="text-xs font-black text-primary uppercase tracking-widest">
              Câu {totalQuestions > 0 ? currentGlobalIndex : 0}
            </span>
            {currentQuestion?.type_question === 'group' && (
              <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-black rounded uppercase tracking-widest border border-red-200 ml-1">
                Câu hỏi chùm
              </span>
            )}
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              / {totalQuestions}
            </span>
          </div>
          
          <button 
            className="p-2 hover:bg-slate-100 rounded-full transition-colors border border-slate-100 shadow-sm disabled:opacity-30"
            onClick={onNext}
            disabled={totalQuestions === 0 || currentGlobalIndex >= totalQuestions}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 disabled:opacity-30" disabled>
            <ChevronsRight className="w-5 h-5" />
          </button>
          
          <div className="w-px h-4 bg-slate-200 mx-1"></div>
          <button className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors" title="Xóa câu này">
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </section>
  )
}
