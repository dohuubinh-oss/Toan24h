import React, { useState } from 'react'
import { Settings2, X, PlusCircle, Wand2, ChevronDown } from 'lucide-react'
import { Question } from '../../../types/question'
import { Label } from '../../ui/Label'
import { Input } from '../../ui/Input'
import { cn } from '@/lib/utils'

interface QuestionSettingsSidebarProps {
  currentQuestion?: Question | null;
  updateQuestion?: (key: keyof Question, value: any) => void;
}

import { TOPIC_MAPPING } from '@/constants/topics'

export default function QuestionSettingsSidebar({
  currentQuestion = null,
  updateQuestion = () => { }
}: QuestionSettingsSidebarProps) {
  const [tagInput, setTagInput] = useState('');

  const difficultyLevels = ["Nhận biết", "Thông hiểu", "Vận dụng", "Vận dụng cao"];

  const handleAddTag = () => {
    if (tagInput.trim() && currentQuestion) {
      const currentTags = currentQuestion.tags || [];
      if (!currentTags.includes(tagInput.trim())) {
        updateQuestion('tags', [...currentTags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (currentQuestion) {
      const currentTags = currentQuestion.tags || [];
      updateQuestion('tags', currentTags.filter(t => t !== tagToRemove));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <div className="space-y-6 lg:sticky lg:top-24">
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-100">
          <h3 className="font-bold flex items-center gap-2">
            <Settings2 className="text-primary w-5 h-5" />
            Thiết lập câu hỏi
          </h3>
        </div>

        <div className="p-5 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs ml-1 mb-1">Phân loại</Label>
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => updateQuestion('cate', 'exam')}
                className={cn(
                  "flex-1 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer",
                  (!currentQuestion?.cate || currentQuestion?.cate === 'exam')
                    ? "bg-white text-primary shadow-sm font-semibold"
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                Đề thi
              </button>
              <button
                type="button"
                onClick={() => updateQuestion('cate', 'practice')}
                className={cn(
                  "flex-1 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer",
                  currentQuestion?.cate === 'practice'
                    ? "bg-white text-primary shadow-sm font-semibold"
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                Bài tập
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs ml-1 mb-1">Tên Sách</Label>
            <Input
              type="text"
              placeholder="VD: SGK Toán 9 Tập 1..."
              className="bg-slate-50 text-sm placeholder:text-slate-400 font-medium"
              value={currentQuestion?.book_name || ''}
              onChange={(e) => updateQuestion('book_name', e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs ml-1 mb-1">Khối lớp</Label>
            <div className="relative">
              <select
                className="w-full appearance-none bg-none px-3 h-12 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all cursor-pointer"
                value={currentQuestion?.grade?.toString() || ""}
                onChange={(e) => {
                  updateQuestion('grade', e.target.value === "chuyen_cap" ? "chuyen_cap" : parseInt(e.target.value, 10));
                  updateQuestion('topic', '');
                }}
              >
                <option value="" disabled>Chọn khối lớp</option>
                <option value="5">Lớp 5</option>
                <option value="6">Lớp 6</option>
                <option value="7">Lớp 7</option>
                <option value="8">Lớp 8</option>
                <option value="9">Lớp 9</option>
                <option value="chuyen_cap">Chuyển cấp</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none w-5 h-5" />
            </div>
          </div>

          {currentQuestion?.grade && (
            <div className="space-y-1.5">
              <Label className="text-xs ml-1 mb-1">Chuyên đề</Label>
              <div className="relative">
                <select
                  className="w-full appearance-none bg-none px-3 h-12 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all cursor-pointer"
                  value={currentQuestion?.topic || ""}
                  onChange={(e) => updateQuestion('topic', e.target.value)}
                >
                  <option value="" disabled>Chọn chuyên đề</option>
                  {(TOPIC_MAPPING[currentQuestion?.grade?.toString()] || []).length > 0 ? (
                    TOPIC_MAPPING[currentQuestion?.grade?.toString()].map(topic => (
                      <option key={topic} value={topic}>{topic}</option>
                    ))
                  ) : (
                    <option value="" disabled>Chưa có dữ liệu chuyên đề cho khối này</option>
                  )}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none w-5 h-5" />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs ml-1 mb-1">Điểm</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="VD: 0.5"
                className="bg-slate-50 text-sm placeholder:text-slate-400 font-medium"
                value={currentQuestion?.point || ''}
                onChange={(e) => updateQuestion('point', parseFloat(e.target.value))}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs ml-1 mb-1">Độ khó</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="0 - 10"
                className="bg-slate-50 text-sm placeholder:text-slate-400 font-medium"
                value={currentQuestion?.difficulty_point || ''}
                onChange={(e) => updateQuestion('difficulty_point', parseFloat(e.target.value))}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs ml-1 mb-1">Mức độ</Label>
            <div className="grid grid-cols-2 gap-2">
              {difficultyLevels.map(level => {
                const isActive = currentQuestion?.difficulty_level === level;
                return (
                  <button
                    key={level}
                    onClick={() => updateQuestion('difficulty_level', level)}
                    className={`py-2 px-2 text-[11px] font-bold rounded-xl transition-all text-center uppercase tracking-wider ${isActive
                        ? 'border-2 border-primary text-white bg-primary shadow-md shadow-primary/20'
                        : 'border border-slate-200 text-slate-600 bg-slate-50 hover:bg-slate-100'
                      }`}
                  >
                    {level}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs ml-1 mb-1">Thẻ (Tags)</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {(currentQuestion?.tags || []).map((tag, idx) => (
                <span key={idx} className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary text-[11px] font-bold rounded-full uppercase tracking-wider">
                  {tag}
                  <button onClick={() => handleRemoveTag(tag)} className="hover:text-blue-800">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="relative">
              <Input
                className="bg-slate-50 pr-10 text-sm placeholder:text-slate-400 font-medium"
                placeholder="Thêm thẻ mới..."
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button onClick={handleAddTag} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors cursor-pointer">
                <PlusCircle className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-primary/5 border border-primary/10 rounded-2xl p-6">
        <div className="flex gap-4">
          <Wand2 className="text-primary w-6 h-6 flex-shrink-0 mt-1" />
          <div>
            <h4 className="text-sm font-bold text-slate-900 mb-2 uppercase tracking-widest">Quy trình thông minh</h4>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              AI sẽ tự động bóc tách đề bài, chuyển đổi ký tự sang LaTeX, xác định cấp độ và gợi ý đáp án đúng cùng lời giải chỉ trong vài giây.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
