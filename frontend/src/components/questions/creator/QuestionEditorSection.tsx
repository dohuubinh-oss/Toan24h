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



  const isGroup = currentBlock?.is_group === true;

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
              className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${!isEssay ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
              onClick={() => handleSetEssay(false)}
            >
              Trắc nghiệm
            </button>
            <button
              className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${isEssay ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
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
              const isSelected = currentQuestion?.correct_answer === currentOptValue && currentOptValue !== '';
              
              return (
              <div key={opt} className="flex items-center gap-4 group">
                <div className="flex-shrink-0">
                  <input
                    className="w-6 h-6 text-primary border-slate-300 focus:ring-primary rounded-full"
                    name="correct-ans"
                    type="radio"
                    checked={isSelected}
                    onChange={() => updateQuestion('correct_answer', currentOptValue)}
                  />
                </div>
                <div
                  onClick={() => updateQuestion('correct_answer', currentOptValue)}
                  className={`flex-grow flex items-center rounded-2xl px-4 py-2.5 transition-all cursor-text ${isSelected
                      ? 'bg-white border-[1.5px] border-primary/50 ring-[3px] ring-primary/10 shadow-sm'
                      : 'bg-[#F8FAFC] border border-slate-100 hover:border-slate-200/80 focus-within:bg-white focus-within:border-primary/30 focus-within:shadow-sm'
                    }`}
                >
                  <span className={`font-bold mr-3 text-sm ${isSelected ? 'text-primary' : 'text-slate-400'}`}>
                    {opt}.
                  </span>
                  <div className="flex-grow">
                    <RichTextEditor
                      inline={true}
                      hideToolbar={true}
                      placeholder={`Nhập đáp án ${opt}...`}
                      content={currentOptValue}
                      onChange={(val) => {
                        const newOptions = [...(currentQuestion?.options || ['', '', '', ''])];
                        const oldVal = newOptions[idx];
                        newOptions[idx] = val;
                        updateQuestion('options', newOptions);
                        
                        // Update correct_answer if the changed option was the correct one
                        if (currentQuestion?.correct_answer === oldVal && oldVal !== '') {
                           updateQuestion('correct_answer', val);
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            )})}
          </div>
        ) : (
          <RichTextEditor
            hideToolbar={true}
            inline={true}
            content={currentQuestion?.correct_answer || ''}
            onChange={(val) => updateQuestion('correct_answer', val)}
          />
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
