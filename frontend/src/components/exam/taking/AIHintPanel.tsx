import React, { useEffect, useRef, useState } from 'react'
import { Sparkles, X, Lightbulb, CheckCircle2, Lock, Unlock, AlertTriangle, Zap, BookOpen, GraduationCap } from 'lucide-react'
import MathText from '@/components/ui/MathText'
import { Question } from '@/types/question'

interface AiHintPanelProps {
  isOpen: boolean
  onClose: () => void
  question: Question | null
  unlockedLevel: number
  onUnlock: (questionId: string, cost: number) => Promise<boolean>
}

export default function AIHintPanel({ isOpen, onClose, question, unlockedLevel, onUnlock }: AiHintPanelProps) {
  const panelRef = useRef<HTMLElement>(null)
  const [unlocking, setUnlocking] = useState(false)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node
      const isToggleButton = target instanceof Element && target.closest('[data-hint-toggle="true"]')
      if (isOpen && panelRef.current && !panelRef.current.contains(target) && !isToggleButton) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onClose])

  if (!question) return null

  // Define hints available
  const hints = [
    { level: 1, title: 'Gợi ý', icon: Lightbulb, content: question.hint, color: 'blue' },
    { level: 2, title: 'Lỗi thường gặp', icon: AlertTriangle, content: question.mistakes, color: 'red' },
    { level: 3, title: 'Mẹo giải nhanh', icon: Zap, content: question.quick_solve_tips, color: 'amber' },
    { level: 4, title: 'Phương pháp tổng quát', icon: BookOpen, content: question.general_method, color: 'indigo' },
  ].filter(h => h.content) // Only show if content exists

  const handleUnlockNext = async (cost: number) => {
    if (unlocking) return
    setUnlocking(true)
    await onUnlock(question.id as string, cost)
    setUnlocking(false)
  }

  return (
    <aside 
      ref={panelRef}
      className={`absolute top-0 bottom-0 right-0 w-[500px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl transition-transform duration-500 z-[10000] flex flex-col
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
    >
      <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <h3 className="font-bold text-slate-800 dark:text-white">Trợ lý AI</h3>
        </div>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg cursor-pointer text-slate-500 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {hints.map((hint, idx) => {
          const isUnlocked = unlockedLevel >= idx + 1
          const isNextToUnlock = unlockedLevel === idx
          const Icon = hint.icon

          // We use tailwind classes explicitly because dynamic interpolation like bg-${color}-50 may be purged if not safelisted
          // Actually, let's use a safe color map
          let colors = {
            bg: 'bg-blue-50 dark:bg-blue-900/20',
            border: 'border-blue-100 dark:border-blue-800/30',
            icon: 'text-blue-600 dark:text-blue-400',
            title: 'text-blue-900 dark:text-blue-100',
            text: 'text-blue-800 dark:text-blue-200'
          }
          if (hint.color === 'red') {
            colors = { bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-100 dark:border-red-800/30', icon: 'text-red-600 dark:text-red-400', title: 'text-red-900 dark:text-red-100', text: 'text-red-800 dark:text-red-200' }
          } else if (hint.color === 'amber') {
            colors = { bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-100 dark:border-amber-800/30', icon: 'text-amber-600 dark:text-amber-400', title: 'text-amber-900 dark:text-amber-100', text: 'text-amber-800 dark:text-amber-200' }
          } else if (hint.color === 'indigo') {
            colors = { bg: 'bg-indigo-50 dark:bg-indigo-900/20', border: 'border-indigo-100 dark:border-indigo-800/30', icon: 'text-indigo-600 dark:text-indigo-400', title: 'text-indigo-900 dark:text-indigo-100', text: 'text-indigo-800 dark:text-indigo-200' }
          }

          if (isUnlocked) {
            return (
              <div key={hint.level} className={`${colors.bg} p-4 rounded-xl border ${colors.border}`}>
                <div className="flex items-start gap-3">
                  <Icon className={`w-5 h-5 ${colors.icon} mt-0.5 shrink-0`} />
                  <div className="flex-1 overflow-hidden">
                    <h4 className={`font-semibold ${colors.title} text-sm mb-2`}>{hint.title}</h4>
                    <div className={`text-sm ${colors.text} leading-relaxed max-w-full overflow-x-auto`}>
                      <MathText content={hint.content as string} />
                    </div>
                  </div>
                </div>
              </div>
            )
          }

          if (isNextToUnlock) {
            return (
              <button 
                key={hint.level}
                onClick={() => handleUnlockNext(1)}
                disabled={unlocking}
                className="w-full relative group overflow-hidden rounded-xl text-left"
              >
                <div className="absolute inset-0 bg-slate-900/60 hover:bg-slate-900/70 backdrop-blur-[2px] z-10 flex items-center justify-center flex-col gap-2 transition-all cursor-pointer">
                  <div className="p-3 bg-white/90 dark:bg-slate-800/90 rounded-full shadow-lg text-primary group-hover:scale-110 transition-transform">
                    {unlocking ? <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div> : <Unlock className="w-5 h-5" />}
                  </div>
                  <span className="text-white font-medium text-sm drop-shadow-md">Mở khóa {hint.title} (-1 điểm)</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-200 dark:border-slate-700 blur-[3px] select-none">
                  <div className="w-3/4 h-4 bg-slate-300 dark:bg-slate-600 rounded mb-2"></div>
                  <div className="w-full h-4 bg-slate-300 dark:bg-slate-600 rounded mb-2"></div>
                  <div className="w-5/6 h-4 bg-slate-300 dark:bg-slate-600 rounded"></div>
                </div>
              </button>
            )
          }

          return null
        })}

        {/* Final Solution Guide - Costs 5 points, available after all previous hints unlocked or if no hints exist */}
        {unlockedLevel >= hints.length && question.solution_guide && (
          unlockedLevel >= hints.length + 1 ? (
            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/30">
              <div className="flex items-start gap-3">
                <GraduationCap className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                <div className="flex-1 overflow-hidden">
                  <h4 className="font-semibold text-emerald-900 dark:text-emerald-100 text-sm mb-2">Giải chi tiết</h4>
                  <div className="text-sm text-emerald-800 dark:text-emerald-200 leading-relaxed max-w-full overflow-x-auto">
                    <MathText content={question.solution_guide} />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <button 
              onClick={() => handleUnlockNext(5)}
              disabled={unlocking}
              className="w-full relative group overflow-hidden rounded-xl mt-8 text-left"
            >
              <div className="absolute inset-0 bg-slate-900/70 hover:bg-slate-900/80 backdrop-blur-[4px] z-10 flex items-center justify-center flex-col gap-2 transition-all cursor-pointer">
                <div className="p-3 bg-amber-400 dark:bg-amber-500 rounded-full shadow-lg text-white group-hover:scale-110 transition-transform">
                  {unlocking ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Lock className="w-5 h-5" />}
                </div>
                <span className="text-white font-medium text-sm drop-shadow-md">Mở khóa Giải chi tiết (-5 điểm)</span>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-900/10 p-6 border border-emerald-200 dark:border-emerald-800/30 blur-[4px] select-none">
                <div className="w-full h-6 bg-slate-300 dark:bg-slate-600 rounded mb-3"></div>
                <div className="w-11/12 h-6 bg-slate-300 dark:bg-slate-600 rounded mb-3"></div>
                <div className="w-4/5 h-6 bg-slate-300 dark:bg-slate-600 rounded"></div>
              </div>
            </button>
          )
        )}
        
        {/* If no hints available at all */}
        {hints.length === 0 && !question.solution_guide && (
          <div className="text-center p-6 text-slate-500">
            Câu hỏi này chưa có gợi ý từ AI.
          </div>
        )}
      </div>
    </aside>
  )
}
