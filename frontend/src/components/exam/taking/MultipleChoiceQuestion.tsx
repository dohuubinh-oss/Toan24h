import React from 'react'

export interface MultipleChoiceOption {
  id: string
  text: string
}

interface MultipleChoiceQuestionProps {
  questionId: number
  content: string
  options: MultipleChoiceOption[]
  selectedOptionId: string | null
  isFlagged: boolean
  onSelectOption: (optionId: string) => void
  onToggleFlag: () => void
}

export default function MultipleChoiceQuestion({
  questionId,
  content,
  options,
  selectedOptionId,
  isFlagged,
  onSelectOption,
  onToggleFlag,
}: MultipleChoiceQuestionProps) {
  return (
    <div className="max-w-4xl mx-auto px-6 py-10 mt-10">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm mb-8 transition-shadow hover:shadow-md">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-start justify-between mb-6">
            <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-xl font-bold border border-blue-100 dark:border-blue-900/50">
              <span className="material-icons text-sm">quiz</span>
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
              <span className="material-icons text-base">{isFlagged ? 'flag' : 'outlined_flag'}</span>
              <span>{isFlagged ? 'Bỏ đánh dấu' : 'Đánh dấu'}</span>
            </button>
          </div>
          <div className="prose prose-slate dark:prose-invert max-w-none prose-p:text-slate-700 dark:prose-p:text-slate-300 prose-p:text-lg prose-p:leading-relaxed font-medium">
            <p>{content}</p>
          </div>
        </div>

        <div className="p-8 bg-slate-50 dark:bg-slate-950/50 rounded-b-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {options.map((option) => (
              <label
                key={option.id}
                className="group relative flex items-center p-5 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all duration-200 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50 dark:has-[:checked]:bg-blue-900/20 has-[:checked]:ring-4 has-[:checked]:ring-blue-500/20"
              >
                <input
                  type="radio"
                  name={`q${questionId}`}
                  value={option.id}
                  checked={selectedOptionId === option.id}
                  onChange={() => onSelectOption(option.id)}
                  className="sr-only"
                />
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold mr-4 group-has-[:checked]:bg-blue-500 group-has-[:checked]:text-white transition-colors">
                  {option.id}
                </div>
                <div className="text-slate-700 dark:text-slate-300 font-medium text-lg">{option.text}</div>
                <div className="absolute right-5 opacity-0 group-has-[:checked]:opacity-100 transition-opacity">
                  <span className="material-icons text-blue-500">check_circle</span>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
