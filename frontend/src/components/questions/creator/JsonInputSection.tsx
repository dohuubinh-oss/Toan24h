import React from 'react'
import { QuestionBlock, Question } from '../../../types/question'
import JsonInputCard from '@/components/common/JsonInputCard'

interface JsonInputSectionProps {
  onProcessJson?: (blocks: QuestionBlock[]) => void;
  onAiExtract?: () => void;
  currentGlobalIndex?: number;
  totalQuestions?: number;
  currentQuestion?: Question | null;
  onNext?: () => void;
  onPrev?: () => void;
}

const QUESTION_JSON_HINT = `[{
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

export default function JsonInputSection({
  onProcessJson = () => {},
  onAiExtract
}: JsonInputSectionProps) {
  const handleProcess = (jsonInput: string) => {
    const parsed = JSON.parse(jsonInput) as QuestionBlock[];
    if (!Array.isArray(parsed)) {
      throw new Error('Dữ liệu phải là mảng (array)');
    }
    
    const processedBlocks = parsed.map(block => {
      const isGroup = block.questions.length > 1 || block.questions.some(q => q.type_question?.toString().toLowerCase() === 'group');
      return {
        ...block,
        is_group: isGroup,
        questions: block.questions.map(q => {
          const processedQ = { ...q };

          if (processedQ.solution_guide && typeof processedQ.solution_guide === 'object') {
            const parsedGuide = processedQ.solution_guide as any;
            let html = `<div class="exercise-content bg-transparent p-4">`
            
            if (parsedGuide.problem) {
               html += `<div class="bg-slate-50 p-5 rounded-lg border border-slate-200 mb-8">
                  <p class="italic text-slate-700 !m-0">${parsedGuide.problem}</p>
                </div>`
            }

            const stepsData = parsedGuide.steps || parsedGuide.Steps;
            const hasTimeline = (stepsData && Array.isArray(stepsData) && stepsData.length > 0) || parsedGuide.conclusion || parsedGuide.tips;

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
              if (parsedGuide.conclusion) {
                  timelineItems.push({
                      type: 'conclusion',
                      content: parsedGuide.conclusion
                  });
              }
              if (parsedGuide.tips) {
                  timelineItems.push({
                      type: 'tips',
                      content: parsedGuide.tips
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
  };

  return (
    <section className="space-y-4">
      <JsonInputCard
        title="Nhập nhanh bằng JSON"
        badge="Thông minh"
        placeholder={QUESTION_JSON_HINT}
        buttonText="Xử lý JSON"
        onProcess={handleProcess}
        onAiExtract={onAiExtract}
      />
    </section>
  )
}
