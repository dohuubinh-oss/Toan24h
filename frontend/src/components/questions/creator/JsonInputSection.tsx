import React, { useState } from 'react'
import { Code2, Settings2 } from 'lucide-react'
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
      
      const processedBlocks = parsed.map(block => {
        return {
          ...block,
          questions: block.questions.map(q => {
            const processedQ = { ...q };

            // Removed Map correct_answer content to A, B, C, D

            // 2. Convert solution_guide object to HTML string
            if (processedQ.solution_guide && typeof processedQ.solution_guide === 'object') {
              const parsed = processedQ.solution_guide as any;
              let html = `<div class="exercise-content bg-transparent p-4">`
              
              if (parsed.problem) {
                 html += `<div class="bg-slate-50 p-5 rounded-lg border border-slate-200 mb-8">
                    <p class="font-bold text-slate-900 mb-2 !mt-0">Đề bài:</p>
                    <p class="italic text-slate-700 !m-0">${parsed.problem}</p>
                  </div>`
              }

              const stepsData = parsed.steps || parsed.Steps;
              const hasTimeline = (stepsData && Array.isArray(stepsData) && stepsData.length > 0) || parsed.conclusion || parsed.tips;

              if (hasTimeline) {
                html += `<div class="space-y-0">`
                
                let timelineItems: any[] = [];
                if (stepsData && Array.isArray(stepsData)) {
                    stepsData.forEach((step: any, idx: number) => {
                        timelineItems.push({
                            type: 'step',
                            idx: step.step || idx + 1,
                            title: step.title,
                            content: step.content,
                            formula: step.formula
                        });
                    });
                }
                if (parsed.conclusion) {
                    timelineItems.push({
                        type: 'conclusion',
                        content: parsed.conclusion
                    });
                }
                if (parsed.tips) {
                    timelineItems.push({
                        type: 'tips',
                        content: parsed.tips
                    });
                }

                timelineItems.forEach((item: any, i: number) => {
                    const isLast = i === timelineItems.length - 1;
                    
                    html += `<div class="flex gap-4">
                        <div class="flex-none flex flex-col items-center">`
                        
                    if (item.type === 'step') {
                        html += `<p class="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm !m-0">${item.idx}</p>`
                    } else if (item.type === 'conclusion') {
                        html += `<p class="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-sm !m-0">✓</p>`
                    } else if (item.type === 'tips') {
                        html += `<p class="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-sm !m-0">💡</p>`
                    }

                    if (!isLast) {
                        html += `<div class="w-0.5 h-full bg-slate-200 my-1"></div>`
                    }
                    
                    html += `</div>
                        <div class="${isLast ? '' : 'pb-8'} flex-1 pt-1">`
                        
                    if (item.type === 'step') {
                        if (item.title) {
                            html += `<h4 class="font-bold text-slate-900 !m-0">${item.title}</h4>`
                        }
                        if (item.content) {
                            html += `<p class="text-slate-600 mt-1 !mb-0">${item.content}</p>`
                        }
                        if (item.formula) {
                            html += `<p class="mt-3 text-blue-600 font-bold !m-0">${item.formula.includes('$') ? item.formula : '$$' + item.formula + '$$'}</p>`
                        }
                    } else if (item.type === 'conclusion') {
                        html += `<h4 class="font-bold text-slate-900 !m-0">Kết luận</h4>
                                 <p class="text-slate-600 mt-1 !mb-0">${item.content}</p>`
                    } else if (item.type === 'tips') {
                        html += `<h4 class="font-bold text-slate-900 !m-0">Gợi ý</h4>
                                 <p class="text-slate-600 mt-1 !mb-0">${item.content}</p>`
                    }

                    html += `</div></div>`
                });

                html += `</div>`
              }

              html += `</div>`
              processedQ.solution_guide = html;
            }

            return processedQ;
          })
        };
      });

      onProcessJson(processedBlocks);
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
    "solution_guide": {
      "problem": "Nội dung đề bài",
      "steps": [
        {
          "step": 1,
          "title": "Bước 1",
          "content": "Nội dung diễn giải",
          "formula": "x = 1"
        }
      ],
      "conclusion": "Kết luận",
      "tips": "Mẹo"
    }
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

    </section>
  )
}
