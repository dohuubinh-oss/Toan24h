import React from 'react'
import MathText from '@/components/ui/MathText'

interface SolutionGuideSectionProps {
  solution?: string | null
  className?: string
  isSubQuestion?: boolean
}

export default function SolutionGuideSection({ 
  solution, 
  className = '', 
  isSubQuestion = false 
}: SolutionGuideSectionProps) {
  if (!solution || !solution.trim()) return null

  return (
    <div 
      data-testid="solution-guide-section"
      className={`p-4 rounded-xl border border-dashed border-orange-300 bg-orange-50/50 ${!isSubQuestion ? 'mb-0' : 'mb-8'} ${className}`}
    >
      <h4 className="text-[10px] font-bold text-orange-600 uppercase mb-2 tracking-widest">
        HƯỚNG DẪN CHẤM / LỜI GIẢI MẪU:
      </h4>
      <MathText content={solution} className="text-sm text-slate-700 leading-relaxed" />
    </div>
  )
}
