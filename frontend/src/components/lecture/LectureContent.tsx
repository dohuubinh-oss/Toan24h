import React from 'react'
import { BookOpen, ChevronDown, Play, FileEdit, Lightbulb } from 'lucide-react'
import { DangToanItem } from '@/components/lecture/creator/LectureCreatorContext'
import MathText from '@/components/ui/MathText'

interface LectureConceptProps {
  basicConcept: string;
}

interface LectureExamplesProps {
  examples?: DangToanItem[];
}

const getMediaUrl = (url: string) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace('/api/v1', '') : 'http://localhost:8080';
  return baseUrl + url;
}

export function LectureConcept({ basicConcept }: LectureConceptProps) {
  if (!basicConcept) return null;

  return (
    <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col mb-6">
      <details className="group" open>
        <summary className="p-4 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-4 cursor-pointer list-none">
          <div className="flex items-center gap-2 px-2 text-primary">
            <BookOpen size={20} />
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-700 dark:text-slate-300">1. Giải thích khái niệm</h2>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <ChevronDown className="text-slate-400 transition-transform duration-300 group-open:rotate-180" size={20} />
          </div>
        </summary>
        <div className="p-8 pt-4 flex-grow">
          <div className="flex flex-col h-full">
            <div className="flex-grow rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-5">
              <MathText 
                className="prose dark:prose-invert max-w-none"
                content={basicConcept}
              />
            </div>
          </div>
        </div>
      </details>
    </section>
  )
}

export function LectureExamples({ examples = [] }: LectureExamplesProps) {
  if (examples.length === 0) return null;

  return (
    <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col mb-6">
      <details className="group" open>
        <summary className="p-4 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-4 cursor-pointer list-none">
          <div className="flex items-center gap-2 px-2 text-primary">
            <FileEdit size={20} />
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-700 dark:text-slate-300">2. Phân tích bài tập mẫu</h2>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <ChevronDown className="text-slate-400 transition-transform duration-300 group-open:rotate-180" size={20} />
          </div>
        </summary>
        <div className="px-6 pb-6 pt-2 flex-grow">
          <div className="flex flex-col h-full">
            <div className="flex-grow space-y-8">
              {examples.map((dt, i) => (
                <div key={dt.id} className="space-y-8">
                  <div className="relative overflow-hidden bg-primary/10 px-6 py-3 rounded-xl flex w-full items-center gap-2">
                    <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-primary"></div>
                    <span className="font-bold text-primary text-base">Dạng {i + 1}:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-base">{dt.dangToanName}</span>
                  </div>

                  {dt.methods.map((method, j) => (
                    <div key={method.id} className="space-y-6 mt-6 first:mt-4">
                      <div className="space-y-3 mb-6">
                        <div className="flex items-center gap-2">
                          <Lightbulb size={20} className="text-primary" />
                          <h4 className="font-bold text-slate-800 dark:text-slate-200">{method.methodName || `Phương pháp ${j + 1}`}</h4>
                        </div>
                        {method.methodContent && (
                           <MathText 
                             className="prose dark:prose-invert max-w-none text-sm text-slate-600 dark:text-slate-400"
                             content={method.methodContent}
                           />
                        )}
                      </div>
                      
                      {method.exercise && method.exercise.content && (
                        <div className="space-y-6 w-full mt-4">
                          <MathText 
                            className="prose dark:prose-invert max-w-none text-slate-800 dark:text-slate-200"
                            content={method.exercise.content}
                          />
                        </div>
                      )}
                    </div>

                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </details>
    </section>
  )
}
