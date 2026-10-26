'use client'

import React, { useState, useEffect } from 'react'
import { BookOpen, Lightbulb, Zap, CheckCircle2, ChevronRight, X } from 'lucide-react'
import MathText from '@/components/ui/MathText'

export interface QuestionHintTabsProps {
  hint?: string | null
  shortAnswer?: string | null
  solutionGuide?: string | null
  // In case mistakes or generalMethod are also passed, keep compatibility
  mistakes?: string | null
  generalMethod?: string | null
  onClose?: () => void
  onToggleHint?: () => void
  className?: string
  initialTab?: string
}

interface StepItem {
  id: string
  label: string
  stepTitle: string
  icon: React.ComponentType<{ className?: string }>
  content?: string | null
}

export default function QuestionHintTabs({
  hint,
  shortAnswer,
  solutionGuide,
  mistakes,
  generalMethod,
  onClose,
  onToggleHint,
  className = '',
  initialTab,
}: QuestionHintTabsProps) {
  // Thứ tự sư phạm chuẩn theo yêu cầu: hint -> short_answer -> lời giải mẫu
  const rawSteps: StepItem[] = [
    {
      id: 'hint',
      label: 'Gợi ý hướng giải',
      stepTitle: 'Gợi ý hướng giải bài toán',
      icon: Lightbulb,
      content: hint
    },
    {
      id: 'short_answer',
      label: 'Mẹo giải nhanh',
      stepTitle: 'Mẹo giải nhanh & Lời giải ngắn',
      icon: Zap,
      content: shortAnswer
    },
    {
      id: 'solution_guide',
      label: 'Lời giải mẫu',
      stepTitle: 'Lời giải chi tiết (Đáp án chuẩn)',
      icon: BookOpen,
      content: solutionGuide
    }
  ]

  // Filter only available steps with non-empty content
  const availableSteps = rawSteps.filter(s => !!s.content && s.content.trim().length > 0)

  const [activeStepId, setActiveStepId] = useState<string>(() => {
    if (initialTab && availableSteps.some(s => s.id === initialTab)) {
      return initialTab
    }
    return availableSteps[0]?.id || 'hint'
  })

  // Synchronize when steps change
  useEffect(() => {
    if (availableSteps.length > 0 && !availableSteps.some(s => s.id === activeStepId)) {
      setActiveStepId(availableSteps[0].id)
    }
  }, [availableSteps, activeStepId])

  const currentIndex = availableSteps.findIndex(s => s.id === activeStepId)
  const currentStep = availableSteps[currentIndex] || availableSteps[0]
  const hasNextStep = currentIndex >= 0 && currentIndex < availableSteps.length - 1
  const nextStep = hasNextStep ? availableSteps[currentIndex + 1] : null

  const handleNextStep = () => {
    if (nextStep) {
      setActiveStepId(nextStep.id)
    } else if (onClose) {
      onClose()
    }
  }

  if (availableSteps.length === 0) {
    return (
      <div 
        data-testid="question-hints-inline"
        className={`bg-emerald-50/60 border border-emerald-200 rounded-2xl p-6 shadow-sm transition-all ${className}`}
      >
        <div className="flex items-center justify-between pb-3 border-b border-emerald-200/60">
          <div className="flex items-center gap-2 text-emerald-900 font-bold text-base">
            <BookOpen className="w-5 h-5 text-emerald-600" />
            <span>Gợi ý bài toán</span>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-emerald-700 hover:text-emerald-950 p-1.5 rounded-lg hover:bg-emerald-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <p className="mt-3 text-slate-500 italic text-sm">
          Câu hỏi này chưa có gợi ý riêng. Bạn hãy đọc kỹ đề bài và áp dụng kiến thức lý thuyết đã học nhé!
        </p>
      </div>
    )
  }

  const StepIcon = currentStep.icon

  return (
    <div 
      data-testid="question-hints-inline"
      className={`bg-emerald-50/40 border border-emerald-200 rounded-2xl p-6 shadow-sm transition-all space-y-4 ${className}`}
    >
      {/* Header styled like Hình 3: green BookOpen icon, title, next step & close button */}
      <div className="flex items-center justify-between pb-3 border-b border-emerald-200/60">
        <div className="flex items-center gap-2.5">
          <BookOpen className="w-5 h-5 text-emerald-600 shrink-0" />
          <h4 className="text-emerald-900 font-bold text-base">
            {currentStep.stepTitle}
          </h4>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full hidden sm:inline-block">
            Bước {currentIndex + 1}/{availableSteps.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {hasNextStep && (
            <button
              type="button"
              onClick={handleNextStep}
              className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1 shadow-xs active:scale-95"
            >
              <span>Xem tiếp: {nextStep?.label}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              title="Đóng"
              className="text-emerald-700 hover:text-emerald-950 p-1.5 rounded-lg hover:bg-emerald-100/80 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Step Navigation Pills in Emerald styling */}
      {availableSteps.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {availableSteps.map((step, idx) => {
            const isActive = step.id === activeStepId
            const IconComponent = step.icon

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setActiveStepId(step.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer border ${
                  isActive 
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' 
                    : 'bg-white text-emerald-800 border-emerald-200 hover:bg-emerald-100/60'
                }`}
              >
                <IconComponent className="w-3.5 h-3.5 shrink-0" />
                <span>{step.label}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* Content Rendered with MathText (same as Hình 3) */}
      <div className="text-slate-800 leading-relaxed text-base pt-1 overflow-x-auto max-w-full">
        <MathText content={currentStep.content || ''} />
      </div>
    </div>
  )
}
