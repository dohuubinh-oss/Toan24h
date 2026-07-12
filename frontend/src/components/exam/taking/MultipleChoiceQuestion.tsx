import React, { useState } from 'react'
import { Sparkles, CheckCircle2, Flag } from 'lucide-react'
import MathText from '@/components/ui/MathText'
import ExplanationPopup from './ExplanationPopup'

export interface MultipleChoiceOption {
  id: string
  text: string
}

interface MultipleChoiceQuestionProps {
  questionId: number
  index: number
  topic?: string
  content: string
  options: MultipleChoiceOption[]
  selectedOptionId: string | null
  selectedExplanation?: string
  isHintOpen: boolean
  isFlagged: boolean
  onSelectOption: (optionId: string, explanation?: string) => void
  onToggleHint: () => void
  onToggleFlag: () => void
}

export default function MultipleChoiceQuestion({
  questionId,
  index,
  content,
  options,
  selectedOptionId,
  selectedExplanation,
  isHintOpen,
  isFlagged,
  onSelectOption,
  onToggleHint,
  onToggleFlag,
}: MultipleChoiceQuestionProps) {
  const [pendingOptionId, setPendingOptionId] = useState<string | null>(null)

  const handleOptionClick = (optionId: string) => {
    // If clicking an already selected option, re-open the popup with existing explanation
    setPendingOptionId(optionId)
  }

  const handleExplanationSubmit = (explanation: string) => {
    if (pendingOptionId) {
      onSelectOption(pendingOptionId, explanation)
      setPendingOptionId(null)
    }
  }

  const handleExplanationClose = () => {
    setPendingOptionId(null)
  }

  return (
    <main className="flex-grow flex flex-row items-start justify-center p-6 sm:p-12 relative w-full">
      <div className={`w-full max-w-4xl space-y-8 transition-all duration-500 ${isHintOpen ? 'mr-[340px]' : ''}`}>
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 p-10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-primary"></div>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-bold rounded-lg uppercase">
                Câu hỏi {index + 1}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={onToggleFlag}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm cursor-pointer transition-all active:scale-95 ${
                    isFlagged 
                      ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                  title="Đánh dấu câu hỏi này để xem lại sau"
                >
                  <Flag className={`w-5 h-5 ${isFlagged ? 'fill-amber-500' : ''}`} />
                  <span className="hidden sm:inline">{isFlagged ? 'Đã đánh dấu' : 'Đánh dấu'}</span>
                </button>
                <button 
                  data-hint-toggle="true"
                  onClick={onToggleHint}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-full font-semibold text-sm cursor-pointer hover:bg-blue-700 transition-all shadow-md shadow-primary/20 active:scale-95"
                >
                  <Sparkles className="w-5 h-5" />
                  <span>Gợi ý từ AI</span>
                </button>
              </div>
            </div>
            
            <div className="text-2xl font-medium text-slate-800 dark:text-slate-100 leading-relaxed">
              <MathText content={content} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {options.map((option) => {
            const isSelected = selectedOptionId === option.id;
            
            return (
              <button 
                key={option.id}
                onClick={() => handleOptionClick(option.id)}
                className={`group relative flex items-center gap-6 p-6 rounded-xl border-2 transition-all shadow-sm text-left
                  ${isSelected 
                    ? 'bg-white dark:bg-slate-900 border-primary shadow-primary/5' 
                    : 'bg-white dark:bg-slate-900 border-transparent hover:border-slate-200 dark:hover:border-slate-700'
                  }
                `}
              >
                <div className={`w-12 h-12 flex items-center justify-center font-bold rounded-lg transition-colors text-xl
                  ${isSelected
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:bg-primary group-hover:text-white'
                  }
                `}>
                  {option.id}
                </div>
                <div className="flex-1">
                  <span className="text-xl font-medium text-slate-900 dark:text-white">
                    <MathText content={option.text} />
                  </span>
                </div>
                {isSelected && (
                  <div className="absolute top-4 right-4 text-primary">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>
      
      <ExplanationPopup 
        isOpen={pendingOptionId !== null} 
        onClose={handleExplanationClose} 
        onSubmit={handleExplanationSubmit}
        initialExplanation={pendingOptionId === selectedOptionId ? selectedExplanation : ''}
      />
    </main>
  )
}
