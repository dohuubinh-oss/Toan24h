import React from 'react';
import { CheckCircle } from 'lucide-react';
import MathText from '../ui/MathText';

export interface SubQuestion {
  content: string;
  options?: string[];
  correctAnswer?: string;
  solution?: string;
  isEssay?: boolean;
}

interface ContentQuestionProps {
  sharedContext?: string;
  
  // Single Question Props
  content?: string;
  options?: string[];
  correctAnswer?: string;
  solution?: string;
  isEssay?: boolean;
  
  // Group Question Props
  subQuestions?: SubQuestion[];
}

export default function ContentQuestion({
  sharedContext,
  content,
  options,
  correctAnswer,
  solution,
  isEssay,
  subQuestions
}: ContentQuestionProps) {
  
  // Helper to render a single question's body (either standalone or sub-question)
  const renderQuestionBody = (
    qContent: string, 
    qOptions?: string[], 
    qCorrect?: string, 
    qSolution?: string, 
    qIsEssay?: boolean, 
    index?: number
  ) => {
    const isSubQuestion = index !== undefined;
    
    return (
      <div key={index} className={`relative ${isSubQuestion ? 'pl-6 ml-2' : ''}`}>
        {/* Dot marker for sub-questions */}
        {isSubQuestion && (
          <span className="absolute left-0 top-2 w-1.5 h-1.5 bg-slate-400 rounded-full"></span>
        )}
        
        <div className={`${!isSubQuestion ? 'pl-7' : ''}`}>
          <div className="flex gap-2 text-lg leading-relaxed text-slate-800 mb-6">
            {isSubQuestion && <span className="font-bold shrink-0">{index + 1}.</span>}
            <MathText 
              content={qContent} 
              className="flex-1" 
            />
          </div>

          {/* Multiple Choice Options */}
          {!qIsEssay && qOptions && qOptions.length > 0 && (
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-3 mb-6 ${isSubQuestion ? '' : ''}`}>
              {qOptions.map((opt, idx) => {
                const label = String.fromCharCode(65 + idx); // A, B, C, D
                const isCorrect = opt === qCorrect && qCorrect !== undefined && qCorrect !== '';
                
                return (
                  <div key={idx} className={`flex items-center p-3 rounded-xl border transition-all ${isCorrect ? 'bg-primary/5 border-primary/30 shadow-sm font-bold text-primary' : 'bg-white border-slate-200'}`}>
                    <span className={`font-bold mr-3 shrink-0 ${isCorrect ? 'text-primary' : 'text-slate-700'}`}>{label}.</span>
                    <MathText content={opt} className={`text-sm ${isCorrect ? 'font-medium' : 'text-slate-700 font-medium'}`} />
                    {isCorrect && <CheckCircle className="w-4 h-4 text-primary ml-auto shrink-0" />}
                  </div>
                );
              })}
            </div>
          )}

          {/* Solution */}
          {qSolution && (
            <div className={`p-4 rounded-xl border border-dashed border-orange-300 bg-orange-50/50 ${!isSubQuestion ? 'mb-0' : 'mb-8'}`}>
              <h4 className="text-[10px] font-bold text-orange-600 uppercase mb-2 tracking-widest">HƯỚNG DẪN CHẤM / LỜI GIẢI MẪU:</h4>
              <MathText content={qSolution} className="text-sm text-slate-700" />
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Shared Context for Group Questions */}
      {sharedContext && (
        <div className="pl-4 border-l-[3px] border-primary mb-8 ml-2">
          <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest mb-2">Nội dung dẫn chung</h4>
          <MathText content={sharedContext} className="text-lg font-bold text-slate-800 leading-relaxed" />
        </div>
      )}

      {/* Render Sub-questions if Group */}
      {subQuestions && subQuestions.length > 0 ? (
        <div className="space-y-2">
          {subQuestions.map((sq, idx) => 
            renderQuestionBody(sq.content, sq.options, sq.correctAnswer, sq.solution, sq.isEssay, idx)
          )}
        </div>
      ) : (
        /* Render Single Question */
        content ? renderQuestionBody(content, options, correctAnswer, solution, isEssay) : null
      )}
    </>
  );
}
