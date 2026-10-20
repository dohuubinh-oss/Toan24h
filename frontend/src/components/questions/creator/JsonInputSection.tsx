import React from 'react'
import { QuestionBlock, Question } from '../../../types/question'
import JsonInputCard from '@/components/common/JsonInputCard'
import {
  formatTextToHtml,
  formatQuestionContent,
  formatSolutionGuide
} from './utils/questionTextFormatter'

interface JsonInputSectionProps {
  onProcessJson?: (blocks: QuestionBlock[]) => void;
  onAiExtract?: () => void;
  currentGlobalIndex?: number;
  totalQuestions?: number;
  currentQuestion?: Question | null;
  onNext?: () => void;
  onPrev?: () => void;
  initialValue?: string;
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
  onAiExtract,
  initialValue = ''
}: JsonInputSectionProps) {
  const handleProcess = (jsonInput: string) => {
    const parsed = JSON.parse(jsonInput) as QuestionBlock[];
    if (!Array.isArray(parsed)) {
      throw new Error('Dữ liệu phải là mảng (array)');
    }
    
    const processedBlocks = parsed.map(block => {
      const isGroup = block.questions.length > 1 || block.questions.some(q => q.type_question?.toString().toLowerCase() === 'group');
      const formattedShared = block.shared_content ? formatTextToHtml(block.shared_content) : '';

      return {
        ...block,
        shared_content: formattedShared,
        is_group: isGroup,
        questions: block.questions.map(q => {
          const processedQ = { ...q };

          // Chuẩn hóa và tự động xuống dòng/HTML cho nội dung câu hỏi
          if (processedQ.content) {
            processedQ.content = formatQuestionContent(processedQ.content);
          }

          // Chuẩn hóa và tự động xuống dòng/HTML cho lời giải chi tiết
          if (processedQ.solution_guide) {
            processedQ.solution_guide = formatSolutionGuide(processedQ.solution_guide);
          }

          // Làm sạch tiền tố A., B., C., D. ở các phương án trắc nghiệm
          if (processedQ.options && Array.isArray(processedQ.options)) {
            processedQ.options = processedQ.options.map(opt =>
              opt.replace(/^(?:<p>\s*)?[A-Da-d][.)]\s*/i, match =>
                match.startsWith('<p>') ? '<p>' : ''
              )
            );
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
        initialValue={initialValue}
      />
    </section>
  )
}
