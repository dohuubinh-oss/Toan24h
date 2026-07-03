import React from 'react'
import { BookOpen, Microscope, Presentation, Megaphone, TriangleAlert, Zap, Lightbulb } from 'lucide-react'
import { BackendLectureExample } from '@/lib/lectureApi'
import MathText from '@/components/ui/MathText'

interface LectureContentProps {
  basicConcept?: string;
  examples?: BackendLectureExample[];
}

export default function LectureContent({ 
  basicConcept,
  examples = []
}: LectureContentProps) {
  
  return (
    <div className="space-y-8">
      {/* Concept Explanation */}
      {basicConcept && (
        <section className="card-premium">
          <div className="flex items-center gap-3 mb-6">
            <BookOpen className="text-primary" size={32} />
            <h2 className="text-xl font-bold">1. Giải thích khái niệm</h2>
          </div>
          <MathText content={basicConcept} className="prose max-w-none space-y-4 leading-relaxed" />
        </section>
      )}

      {/* Exercise Analysis */}
      {examples.map((example, idx) => {
        let parsedSteps: any[] = [];
        try {
          parsedSteps = JSON.parse(example.steps || '[]');
        } catch (e) {
          console.error("Failed to parse steps", e);
        }

        return (
          <section key={example.id} className="card-premium">
            <div className="flex items-center gap-3 mb-6">
              <Microscope className="text-primary" size={32} />
              <h2 className="text-xl font-bold">2.{idx + 1} Phân tích bài tập mẫu</h2>
            </div>
            
            <div className="bg-slate-50 p-5 rounded-lg border border-slate-200 mb-6">
              <p className="font-bold mb-2">Đề bài:</p>
              {example.problemImage && (
                <div className="flex justify-center mb-4">
                  <img src={example.problemImage} alt="Problem" className="max-w-full rounded-lg shadow-sm" />
                </div>
              )}
              <MathText content={example.problem} className="italic" />
            </div>

            <div className="space-y-6">
              {parsedSteps.map((step, stepIdx) => (
                <div key={stepIdx} className="flex gap-4">
                  <div className="flex-none flex flex-col items-center">
                    <div className="size-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">{step.step || stepIdx + 1}</div>
                    {stepIdx !== parsedSteps.length - 1 && <div className="w-0.5 h-full bg-slate-200 my-1"></div>}
                  </div>
                  <div className={stepIdx !== parsedSteps.length - 1 ? "pb-6" : ""}>
                    <h4 className="font-bold text-ink">{step.title}</h4>
                    <MathText content={step.content} className="text-slate-600 mt-1" />
                    {step.formula && (
                      <div className="mt-2 text-primary font-bold">
                        <MathText content={step.formula.includes('$') ? step.formula : `$$${step.formula}$$`} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {example.conclusion && (
                <div className="flex gap-4 mt-6">
                  <div className="flex-none flex flex-col items-center">
                    <div className="size-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-sm">✓</div>
                  </div>
                  <div>
                    <h4 className="font-bold text-ink">Kết luận</h4>
                    <MathText content={example.conclusion} className="mt-1 font-bold text-green-600" />
                  </div>
                </div>
              )}

              {example.solutionImage && (
                <div className="mt-4 flex justify-center">
                  <img src={example.solutionImage} alt="Solution" className="max-w-full rounded-lg shadow-sm" />
                </div>
              )}

              {example.tips && (
                <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2 text-amber-600 font-bold">
                    <Lightbulb size={20} />
                    <h4>Mẹo giải / Lưu ý</h4>
                  </div>
                  <MathText content={example.tips} className="text-sm text-amber-800" />
                </div>
              )}
            </div>
          </section>
        )
      })}
    </div>
  )
}
