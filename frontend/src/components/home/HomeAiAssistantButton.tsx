'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Sparkles, ArrowRight, BookOpen, CheckCircle2, ChevronRight, X } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'

interface QuickPrompt {
  id: string
  title: string
  category: string
  formula: string
  explanation: string
  lectureUrl: string
}

const QUICK_PROMPTS: QuickPrompt[] = [
  {
    id: 'viete',
    title: 'Cách giải nhanh phương trình bậc hai bằng Hệ thức Viète',
    category: 'Đại số 9',
    formula: 'x_1 + x_2 = -b/a,  x_1 * x_2 = c/a',
    explanation:
      'Với phương trình ax² + bx + c = 0 (a ≠ 0) có nghiệm: Tổng hai nghiệm là x₁ + x₂ = -b/a, Tích hai nghiệm là x₁ · x₂ = c/a. Mẹo nhẩm nhanh: Nếu a + b + c = 0 thì x₁ = 1, x₂ = c/a. Nếu a - b + c = 0 thì x₁ = -1, x₂ = -c/a.',
    lectureUrl: '/lectures',
  },
  {
    id: 'fractions',
    title: 'Phương pháp tách phân số quy luật Lớp 5 & 6',
    category: 'Số học 5-6',
    formula: 'k / [n(n+k)] = 1/n - 1/(n+k)',
    explanation:
      'Công thức triệt tiêu liên hoàn: k / [n · (n + k)] = 1/n - 1/(n + k). Ví dụ: 1/(1·2) + 1/(2·3) + ... + 1/(99·100) = (1 - 1/2) + (1/2 - 1/3) + ... + (1/99 - 1/100) = 1 - 1/100 = 99/100.',
    lectureUrl: '/lectures',
  },
  {
    id: 'geometry-right-triangle',
    title: 'Hệ thức lượng trong tam giác vuông Lớp 9',
    category: 'Hình học 9',
    formula: 'h² = b\' * c\',  b² = a * b\',  c² = a * c\'',
    explanation:
      'Cho tam giác ABC vuông tại A, đường cao AH (b = AC, c = AB, a = BC, h = AH, b\' = CH, c\' = BH): Ta có h² = b\' · c\', b² = a · b\', c² = a · c\' và b · c = a · h.',
    lectureUrl: '/lectures',
  },
]

export default function HomeAiAssistantButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedPrompt, setSelectedPrompt] = useState<QuickPrompt>(QUICK_PROMPTS[0])

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-40 group">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Trợ lý AI Toán học và làm bài ngay"
          className="w-14 h-14 sm:w-16 sm:h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-2xl shadow-blue-600/40 flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <Sparkles className="w-7 h-7 sm:w-8 sm:h-8" />
        </button>
        <div className="absolute -top-10 right-0 bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Hỏi AI ngay!
        </div>
      </div>

      {/* Quick AI Assistant Modal */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        maxWidth="2xl"
        showCloseButton={false}
        ariaLabel="Trợ lý Toán học MathAI"
      >
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                  Trợ lý Toán học MathAI
                </h3>
                <p className="text-xs sm:text-sm text-slate-500">
                  Tra cứu nhanh phương pháp giải &amp; công thức trọng tâm
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Prompts List */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
              Chọn chủ đề trọng tâm để xem giải thích:
            </p>
            <div className="space-y-2">
              {QUICK_PROMPTS.map((prompt) => {
                const isSelected = selectedPrompt.id === prompt.id
                return (
                  <button
                    key={prompt.id}
                    type="button"
                    onClick={() => setSelectedPrompt(prompt)}
                    className={`w-full text-left p-3 sm:p-3.5 rounded-xl border min-h-[48px] flex items-center justify-between gap-3 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/70 text-blue-950 font-medium'
                        : 'border-slate-200/80 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 shrink-0">
                        {prompt.category}
                      </span>
                      <span className="text-xs sm:text-sm truncate">
                        {prompt.title}
                      </span>
                    </div>
                    <ChevronRight className={`w-4 h-4 shrink-0 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                  </button>
                )
              })}
            </div>
          </div>

          {/* Explanation Card */}
          <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-700 uppercase tracking-wide flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Công thức cốt lõi:
              </span>
              <code className="text-xs bg-white px-2 py-0.5 rounded border border-slate-200 font-mono text-slate-800">
                {selectedPrompt.formula}
              </code>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              {selectedPrompt.explanation}
            </p>
          </div>

          {/* Footer Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <Link
              href={selectedPrompt.lectureUrl}
              onClick={() => setIsOpen(false)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all min-h-[44px]"
            >
              <BookOpen className="w-4 h-4" />
              <span>Xem bài giảng chuyên đề</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/exams"
              onClick={() => setIsOpen(false)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 text-slate-600 hover:text-slate-900 text-sm font-medium hover:bg-slate-100 rounded-xl transition-all min-h-[44px]"
            >
              <span>Kho đề thi tự luyện</span>
            </Link>
          </div>
        </div>
      </Modal>
    </>
  )
}
