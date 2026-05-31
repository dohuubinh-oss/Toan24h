import React from 'react'
import { RefreshCw, CheckCircle2, Eye, Flag, FileText, BookOpen } from 'lucide-react'
import { Question } from '../../types/question'

interface QuestionCardProps {
  question: Question;
  index: number;
}

export default function QuestionCard({ question, index }: QuestionCardProps) {
  const isEssay = question.type === 'Tự luận';

  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden group">
      <div className="p-5 border-b border-slate-100 flex justify-between items-start">
        <div className="flex gap-3">
          <span className="flex items-center justify-center w-auto h-8 px-2.5 rounded-lg bg-primary text-white font-bold text-sm">Câu {index + 1}</span>
          <div>
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">{question.topic} • {question.difficulty_level}</span>
            <div 
              className="mt-2 text-slate-800 leading-relaxed latex-font"
              dangerouslySetInnerHTML={{ __html: question.content }}
            />
          </div>
        </div>
        <button className="flex items-center justify-center gap-1 text-primary hover:bg-primary/5 px-3 min-h-[48px] rounded-lg text-sm font-medium transition-all border border-transparent hover:border-primary/20 shrink-0">
          <RefreshCw className="w-4 h-4" />
          Đổi câu hỏi
        </button>
      </div>
      
      {!isEssay ? (
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/50">
          {question.options.map((opt, idx) => {
            const letter = String.fromCharCode(65 + idx); // A, B, C, D
            const isCorrect = question.correct_answer === letter;
            return (
              <div key={idx} className={`flex items-center gap-3 p-3 bg-white border ${isCorrect ? 'border-2 border-primary' : 'border-slate-200'} rounded-lg cursor-pointer hover:border-primary transition-colors min-h-[48px]`}>
                <span className={`w-6 h-6 flex items-center justify-center rounded-full border ${isCorrect ? 'bg-primary text-white border-primary' : 'border-slate-300'} text-xs font-bold`}>{letter}</span>
                <div className="latex-font flex-grow" dangerouslySetInnerHTML={{ __html: opt }} />
                {isCorrect && <CheckCircle2 className="text-primary w-5 h-5 ml-auto" />}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="p-5 bg-slate-50/50 space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-white border border-dashed border-slate-300 rounded-xl">
            <div className="flex items-center gap-2">
              <FileText className="text-amber-500 w-6 h-6" />
              <span className="text-sm font-bold text-slate-600">LOẠI CÂU HỎI: TỰ LUẬN</span>
            </div>
            <button className="flex items-center justify-center gap-2 px-4 min-h-[48px] bg-white border border-primary text-primary hover:bg-primary hover:text-white rounded-lg text-sm font-semibold transition-all">
              <BookOpen className="w-5 h-5" />
              Xem hướng dẫn chấm & Lời giải mẫu
            </button>
          </div>
        </div>
      )}
      
      <div className="px-5 py-3 bg-white border-t border-slate-100 flex items-center gap-4">
        {!isEssay && (
          <button className="text-xs text-slate-500 hover:text-primary flex items-center justify-center gap-1 min-h-[48px] px-2 rounded hover:bg-slate-50">
            <Eye className="w-4 h-4" /> Xem lời giải chi tiết
          </button>
        )}
        <button className="text-xs text-slate-500 hover:text-red-500 flex items-center justify-center gap-1 min-h-[48px] px-2 rounded hover:bg-slate-50">
          <Flag className="w-4 h-4" /> Báo lỗi AI
        </button>
      </div>
    </div>
  )
}
