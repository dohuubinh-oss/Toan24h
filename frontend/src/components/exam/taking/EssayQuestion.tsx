import React from 'react'
import { FileEdit, Flag, FlagOff } from 'lucide-react'
import MathInput from '@/components/ui/MathInput'

interface EssayQuestionProps {
  questionId: number
  content: string
  answer: string
  isFlagged: boolean
  onAnswerChange: (val: string) => void
  onToggleFlag: () => void
}

export default function EssayQuestion({
  questionId,
  content,
  answer,
  isFlagged,
  onAnswerChange,
  onToggleFlag,
}: EssayQuestionProps) {
  return (
    <div className="max-w-5xl mx-auto px-6 py-10 mt-10">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm mb-8 transition-shadow hover:shadow-md flex flex-col md:flex-row overflow-hidden">
        
        {/* Left Side: Question */}
        <div className="w-full md:w-1/2 p-8 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
          <div className="flex items-start justify-between mb-6">
            <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-xl font-bold border border-blue-100 dark:border-blue-900/50">
              <FileEdit className="w-4 h-4" />
              Câu {questionId}
            </div>
            <button
              onClick={onToggleFlag}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-colors border ${
                isFlagged
                  ? 'text-red-600 bg-red-50 hover:bg-red-100 border-red-200'
                  : 'text-amber-600 bg-amber-50 hover:bg-amber-100 border-amber-200'
              }`}
            >
              {isFlagged ? <Flag className="w-4 h-4" /> : <FlagOff className="w-4 h-4" />}
              <span>{isFlagged ? 'Bỏ đánh dấu' : 'Đánh dấu'}</span>
            </button>
          </div>
          <div className="prose prose-slate dark:prose-invert max-w-none prose-p:text-slate-700 dark:prose-p:text-slate-300 prose-p:text-lg prose-p:leading-relaxed font-medium">
            <p>{content}</p>
          </div>
        </div>

        {/* Right Side: Editor */}
        <div className="w-full md:w-1/2 flex flex-col bg-slate-50 dark:bg-slate-950/50">
          <div className="p-8 flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                Lời giải của bạn
              </label>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl flex-1 flex flex-col">
              {/* MathLive Editor */}
              <div className="p-4 flex-1">
                <MathInput 
                  value={answer} 
                  onChange={onAnswerChange} 
                />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
