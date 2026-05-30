import React, { useState } from 'react'
import { Wand2, X, Lightbulb, Loader2 } from 'lucide-react'

interface AIHintPanelProps {
  hint: string
  onGetHint: () => void
  isHintLoading: boolean
  remainingHints: number
}

export default function AIHintPanel({ hint, onGetHint, isHintLoading, remainingHints }: AIHintPanelProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div
      className={`fixed top-24 left-6 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl flex flex-col pointer-events-auto transition-transform duration-300 z-50 overflow-hidden ${
        isOpen ? 'translate-x-0' : '-translate-x-[calc(100%+24px)]'
      }`}
    >
      <button
        data-testid="ai-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="absolute -right-12 top-4 w-12 h-12 bg-white dark:bg-slate-900 border border-l-0 border-slate-200 dark:border-slate-800 rounded-r-xl shadow-lg flex items-center justify-center cursor-pointer text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors"
        style={!isOpen ? { transform: 'translateX(48px)' } : { display: 'none' }}
      >
        <Wand2 className="w-6 h-6" />
      </button>

      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 flex items-center justify-between">
        <h3 className="font-bold text-white flex items-center gap-2">
          <Wand2 className="w-5 h-5" />
          Trợ giảng AI
        </h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 max-h-[400px] overflow-y-auto">
        {hint ? (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800/50">
            <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{hint}</p>
          </div>
        ) : (
          <div className="text-center py-6">
            <Lightbulb className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Bạn đang gặp khó khăn? Hãy để AI gợi ý cách làm nhé.
            </p>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
        <button
          data-testid="get-hint-btn"
          onClick={onGetHint}
          disabled={isHintLoading || remainingHints <= 0}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {isHintLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Đang suy nghĩ...
            </>
          ) : (
            <>
              <Lightbulb className="w-5 h-5" />
              Gợi ý từ AI
            </>
          )}
        </button>
        <p className="text-center text-xs text-slate-500 mt-3 font-semibold">Còn {remainingHints} lượt</p>
      </div>
    </div>
  )
}
