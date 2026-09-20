import React, { useState, useEffect } from 'react'
import {
  AlignLeft, Bold, Italic, ImagePlus, FileQuestion,
  CheckCircle2, FileText, Info, Lightbulb, Rocket, Brain, Plus, AlertCircle
} from 'lucide-react'
import { Question, QuestionBlock } from '../../../types/question'

interface QuestionEditorSectionProps {
  currentBlock?: QuestionBlock | null;
  currentQuestion?: Question | null;
  updateBlock?: (key: keyof QuestionBlock, value: any) => void;
  updateQuestion?: (key: keyof Question, value: any) => void;
}

import SharedEditorCard from './editor/SharedEditorCard'
import RichTextEditor from './editor/RichTextEditor'

function QuestionEditorSection({
  currentBlock = null,
  currentQuestion = null,
  updateBlock = () => { },
  updateQuestion = () => { }
}: QuestionEditorSectionProps) {
  const isEssay = currentQuestion?.type === 'Tự luận';

  const handleSetEssay = (val: boolean) => {
    if (updateQuestion) {
      updateQuestion('type', val ? 'Tự luận' : 'Trắc nghiệm');
    }
  };

  const isGroup = currentBlock?.is_group === true || currentQuestion?.type_question === 'group';

  // Helper to check if a multiple-choice option is selected as correct (accurate KaTeX / HTML matching for AI questions & shuffled answers)
  const isOptionSelected = (optLetter: string, optValue: string, optIdx: number) => {
    if (!currentQuestion?.correct_answer) return false;
    const ans = currentQuestion.correct_answer.trim();
    if (!ans) return false;

    // 1. Direct exact or trimmed match with option content
    if (optValue && (ans === optValue || ans === optValue.trim())) {
      return true;
    }

    // 2. Normalize math delimiters and HTML tags for precise AI KaTeX / HTML matching
    const normalizeContent = (text: string) => {
      if (!text) return '';
      return text
        .replace(/<[^>]*>?/gm, '') // Strip HTML tags
        .replace(/\\\(/g, '$').replace(/\\\)/g, '$') // Normalize \( \) to $
        .replace(/\\\[/g, '$$').replace(/\\\]/g, '$$') // Normalize \[ \] to $$
        .replace(/\s+/g, ' ') // Collapse multiple spaces
        .trim();
    };

    const cleanAns = normalizeContent(ans);
    const cleanOpt = normalizeContent(optValue);
    if (cleanOpt && cleanAns && cleanAns === cleanOpt) {
      return true;
    }

    // 3. Fallback matching letter 'A', 'B', 'C', 'D' or '0', '1', '2', '3'
    if (ans.toUpperCase() === optLetter || ans.toUpperCase() === `${optLetter}.` || ans === optIdx.toString()) {
      return true;
    }

    return false;
  };

  // Handler when selecting an option as correct
  const handleSelectCorrectOption = (optLetter: string, optIdx: number) => {
    const currentOptValue = currentQuestion?.options?.[optIdx] || '';
    // If option has non-empty text, use that text; otherwise use the letter (A, B, C, D)
    const targetValue = currentOptValue.trim() !== '' ? currentOptValue : optLetter;
    updateQuestion('correct_answer', targetValue);
  };

  // Handler when option content changes
  const handleOptionContentChange = (val: string, optLetter: string, optIdx: number) => {
    const currentOptValue = currentQuestion?.options?.[optIdx] || '';
    const wasSelected = isOptionSelected(optLetter, currentOptValue, optIdx);

    const newOptions = [...(currentQuestion?.options || ['', '', '', ''])];
    newOptions[optIdx] = val;
    updateQuestion('options', newOptions);

    // If this option was selected as the correct answer, keep correct_answer in sync
    if (wasSelected) {
      updateQuestion('correct_answer', val.trim() !== '' ? val : optLetter);
    }
  };

  return (
    <div className="space-y-6">
      {/* Shared Context Card - Only show if group */}
      {isGroup && (
        <SharedEditorCard
          title="Nội dung dẫn chung"
          icon={<AlignLeft className="text-primary w-5 h-5" />}
          content={currentBlock?.shared_content || ''}
          onContentChange={(val) => updateBlock('shared_content', val)}
          placeholder="Nhập ngữ cảnh chung cho các câu hỏi nhỏ..."
        />
      )}

      {/* Question Content Card */}
      <SharedEditorCard
        title="Nội dung câu hỏi"
        icon={<FileQuestion className="text-primary w-5 h-5" />}
        content={currentQuestion?.content || ''}
        onContentChange={(val) => updateQuestion('content', val)}
        placeholder="Nhập nội dung câu hỏi..."
      />

      {/* Answers Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <CheckCircle2 className="text-primary w-6 h-6" />
            Đáp án
          </h2>
          <div className="bg-slate-100 p-1 rounded-xl flex">
            <button
              className={`px-5 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${!isEssay ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
              onClick={() => handleSetEssay(false)}
            >
              Trắc nghiệm
            </button>
            <button
              className={`px-5 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${isEssay ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
              onClick={() => handleSetEssay(true)}
            >
              Tự luận
            </button>
          </div>
        </div>

        {!isEssay ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {['A', 'B', 'C', 'D'].map((opt, idx) => {
              const currentOptValue = currentQuestion?.options?.[idx] || '';
              const isSelected = isOptionSelected(opt, currentOptValue, idx);
              
              return (
                <div 
                  key={opt} 
                  className={`flex items-start gap-3.5 p-3 rounded-2xl border transition-all ${
                    isSelected
                      ? 'bg-primary/5 border-primary ring-2 ring-primary/20 shadow-sm'
                      : 'bg-[#F8FAFC] border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 pt-2 shrink-0">
                    <input
                      id={`opt-radio-${opt}`}
                      className="w-5 h-5 text-primary border-slate-300 focus:ring-primary rounded-full cursor-pointer"
                      name="correct-ans"
                      type="radio"
                      checked={isSelected}
                      onChange={() => handleSelectCorrectOption(opt, idx)}
                    />
                    <label 
                      htmlFor={`opt-radio-${opt}`}
                      onClick={() => handleSelectCorrectOption(opt, idx)}
                      className={`font-black text-sm px-2.5 py-1 rounded-lg cursor-pointer transition-colors ${
                        isSelected 
                          ? 'bg-primary text-white shadow-xs' 
                          : 'bg-slate-200/80 text-slate-700 hover:bg-primary/10 hover:text-primary'
                      }`}
                    >
                      {opt}.
                    </label>
                  </div>
                  <div className="flex-grow bg-white rounded-xl border border-slate-200/70 p-1 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20">
                    <RichTextEditor
                      inline={true}
                      hideToolbar={true}
                      placeholder={`Nhập đáp án ${opt}...`}
                      content={currentOptValue}
                      onChange={(val) => handleOptionContentChange(val, opt, idx)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <label className="text-xs font-bold text-slate-600 block mb-2">Đáp án / Lời giải mẫu tự luận</label>
            <RichTextEditor
              hideToolbar={true}
              inline={true}
              content={currentQuestion?.correct_answer || ''}
              onChange={(val) => updateQuestion('correct_answer', val)}
            />
          </div>
        )}
      </div>

      {/* Solution Section */}
      <SharedEditorCard
        title="Lời giải chi tiết"
        icon={<FileText className="text-primary w-5 h-5" />}
        content={currentQuestion?.solution_guide || ''}
        onContentChange={(val) => updateQuestion('solution_guide', val)}
        placeholder="Nhập lời giải chi tiết..."
      />

      {/* Support Info */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 bg-white flex flex-wrap items-center justify-between">
          <div className="flex items-center gap-2 px-2">
            <Info className="text-primary w-5 h-5" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-700">Thông tin bổ trợ cho học sinh</h2>
          </div>
        </div>
        <div className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Lightbulb className="w-4 h-4" /> Gợi ý
            </label>
            <RichTextEditor
              hideToolbar={true}
              content={currentQuestion?.hint || ''}
              onChange={(val) => updateQuestion('hint', val)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Rocket className="w-4 h-4" /> Mẹo giải nhanh
            </label>
            <RichTextEditor
              hideToolbar={true}
              content={currentQuestion?.quick_solve_tips || ''}
              onChange={(val) => updateQuestion('quick_solve_tips', val)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Brain className="w-4 h-4" /> Phương pháp tổng quát
            </label>
            <RichTextEditor
              hideToolbar={true}
              content={currentQuestion?.general_method || ''}
              onChange={(val) => updateQuestion('general_method', val)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 text-red-500">
              <AlertCircle className="w-4 h-4" /> Lỗi thường gặp
            </label>
            <RichTextEditor
              hideToolbar={true}
              content={currentQuestion?.mistakes || ''}
              onChange={(val) => updateQuestion('mistakes', val)}
            />
          </div>
        </div>
      </div>


    </div>
  )
}

export default React.memo(QuestionEditorSection);
