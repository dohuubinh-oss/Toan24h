import React from 'react';
import { CheckCircle } from 'lucide-react';
import DOMPurify from 'isomorphic-dompurify';
import MathText from '../ui/MathText';
import SolutionGuideSection from './SolutionGuideSection';

export interface SubQuestion {
  content: string;
  diagram_svg?: string | null;
  diagramSvg?: string | null;
  options?: string[];
  correctAnswer?: string;
  solution?: string;
  isEssay?: boolean;
}

interface ContentQuestionProps {
  sharedContext?: string | null;
  shared_content?: string | null;
  sharedContent?: string | null;
  diagram_svg?: string | null;
  diagramSvg?: string | null;
  type_question?: 'group' | 'single' | string;
  
  // Single Question Props
  content?: string;
  options?: string[];
  correctAnswer?: string;
  solution?: string;
  isEssay?: boolean;
  
  // Group Question Props
  subQuestions?: SubQuestion[];

  // Configurable Display Props
  renderOptions?: (options: string[], correctAnswer?: string) => React.ReactNode;
  optionLayout?: 'grid-2' | 'grid-1' | 'list';
  showCorrectBadge?: boolean;
}

export default function ContentQuestion({
  sharedContext,
  shared_content,
  sharedContent,
  diagram_svg,
  diagramSvg,
  type_question,
  content,
  options,
  correctAnswer,
  solution,
  isEssay,
  subQuestions,
  renderOptions,
  optionLayout = 'grid-2',
  showCorrectBadge = true
}: ContentQuestionProps) {
  const effectiveSharedContext = sharedContext || shared_content || sharedContent;
  const effectiveDiagram = diagram_svg || diagramSvg;
  const isGroupQuestion = (subQuestions && subQuestions.length > 0) || type_question === 'group' || Boolean(effectiveSharedContext);

  const renderIllustration = (diagram?: string | null) => {
    if (!diagram || typeof diagram !== 'string') return null;
    const trimmed = diagram.trim();
    if (!trimmed || trimmed === 'null' || trimmed === 'undefined' || trimmed === 'none' || trimmed === '[]' || trimmed === '{}') {
      return null;
    }

    let clean = trimmed;
    if (clean.includes('```')) {
      const match = clean.match(/```(?:xml|svg)?\s*([\s\S]*?)\s*```/i);
      if (match && match[1]) {
        clean = match[1].trim();
      }
    }
    const svgStart = clean.indexOf('<svg');
    const svgEnd = clean.lastIndexOf('</svg>');
    const isSvg = svgStart !== -1 && svgEnd !== -1 && svgEnd >= svgStart;

    // Nếu không phải SVG, kiểm tra xem có phải URL ảnh hợp lệ không
    const isImageUrl = !isSvg && (
      clean.startsWith('http://') || 
      clean.startsWith('https://') || 
      clean.startsWith('/') || 
      clean.startsWith('uploads/') || 
      clean.startsWith('data:image/')
    );

    // Tuyệt đối không render nếu không phải SVG và không phải URL ảnh hợp lệ
    if (!isSvg && !isImageUrl) {
      return null;
    }

    const finalSvg = isSvg ? clean.substring(svgStart, svgEnd + 6) : '';
    
    let imgSrc = clean;
    if (!isSvg && clean.startsWith('uploads/')) {
      imgSrc = `/${clean}`;
    }

    return (
      <div className="my-3 flex justify-center" data-testid="question-illustration">
        <div className="max-w-[540px] w-full flex items-center justify-center overflow-hidden py-1">
          {isSvg ? (
            <div 
              className="w-full flex items-center justify-center [&>svg]:max-w-full [&>svg]:max-h-[380px] [&>svg]:h-auto [&>svg]:w-auto [&>svg]:mx-auto [&>svg>rect:first-child]:fill-transparent [&>svg>rect:first-child]:stroke-none"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(finalSvg) }} 
            />
          ) : (
            <img 
              src={imgSrc} 
              alt="Hình vẽ minh họa bài toán" 
              onError={(e) => {
                // Tự động ẩn container nếu ảnh bị lỗi 404
                const container = e.currentTarget.closest('[data-testid="question-illustration"]');
                if (container) (container as HTMLElement).style.display = 'none';
              }}
              className="max-w-full max-h-[380px] h-auto w-auto object-contain mx-auto"
            />
          )}
        </div>
      </div>
    );
  };
  
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
            <div className="mb-6">
              {renderOptions ? (
                renderOptions(qOptions, qCorrect)
              ) : (
                <div className={`grid gap-3 ${
                  optionLayout === 'grid-2' ? 'grid-cols-1 md:grid-cols-2' :
                  optionLayout === 'grid-1' ? 'grid-cols-1' :
                  'flex flex-col'
                }`}>
                  {qOptions.map((opt, idx) => {
                    const label = String.fromCharCode(65 + idx); // A, B, C, D
                    const isCorrect = showCorrectBadge && opt === qCorrect && qCorrect !== undefined && qCorrect !== '';
                    
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
            </div>
          )}

          {/* Solution */}
          <SolutionGuideSection solution={qSolution} isSubQuestion={isSubQuestion} />
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Hiển thị hình vẽ minh hoạ ở đầu (ngay trước nội dung câu hỏi) nếu là câu hỏi đơn */}
      {!isGroupQuestion && effectiveDiagram && (
        <div className="mb-5">
          {renderIllustration(effectiveDiagram)}
        </div>
      )}

      {/* Shared Context for Group Questions */}
      {effectiveSharedContext && (
        <div className="pl-4 border-l-[3px] border-primary mb-4 ml-2">
          <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest mb-2">Nội dung dẫn chung</h4>
          <MathText content={effectiveSharedContext} className="text-lg font-bold text-slate-800 leading-relaxed" />
        </div>
      )}

      {/* Hiển thị hình vẽ minh hoạ dưới component Nội dung dẫn chung nếu là câu hỏi chùm */}
      {isGroupQuestion && effectiveDiagram && (
        <div className="mb-6 ml-2">
          {renderIllustration(effectiveDiagram)}
        </div>
      )}

      {/* Render Sub-questions if Group */}
      {subQuestions && subQuestions.length > 0 ? (
        <div className="space-y-2">
          {subQuestions.map((sq, idx) => 
            renderQuestionBody(
              sq.content, 
              sq.options, 
              sq.correctAnswer, 
              sq.solution, 
              sq.isEssay, 
              idx
            )
          )}
        </div>
      ) : (
        /* Render Single Question */
        content ? renderQuestionBody(content, options, correctAnswer, solution, isEssay) : null
      )}
    </>
  );
}
