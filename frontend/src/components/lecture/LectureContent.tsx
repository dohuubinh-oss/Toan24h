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
    <section className="bg-[#F8FAFC] dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-primary/30 transition-all overflow-hidden">
      <details className="group" open>
        <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
          <div className="flex items-center gap-2 text-primary">
            <BookOpen size={24} />
            <h3 className="text-xl font-bold">1. Giải thích khái niệm</h3>
          </div>
          <ChevronDown className="text-slate-400 transition-transform duration-300 group-open:rotate-180" size={24} />
        </summary>
        <div className="px-6 pb-6 pt-0">
          <div className="space-y-4">
            <div 
              className="prose dark:prose-invert max-w-none mb-6"
              dangerouslySetInnerHTML={{ __html: basicConcept }}
            />
          </div>
        </div>
      </details>
    </section>
  )
}

export function LectureExamples({ examples = [] }: LectureExamplesProps) {
  if (examples.length === 0) return null;

  return (
    <section className="bg-[#F8FAFC] dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-primary/30 transition-all overflow-hidden">
      <details className="group" open>
        <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
          <div className="flex items-center gap-2">
            <FileEdit size={24} className="text-primary" />
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">2. Phân tích bài tập mẫu</h3>
          </div>
          <ChevronDown className="text-slate-400 transition-transform duration-300 group-open:rotate-180" size={24} />
        </summary>
        <div className="px-6 pb-6 pt-0">
          <div className="space-y-6">
            <div className="space-y-8">
              {examples.map((dt, i) => (
                <div key={dt.id} className="bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-slate-200/60 dark:border-slate-700 shadow-sm hover:shadow-md transition-all p-8 space-y-8">
                  <div className="relative overflow-hidden bg-primary/10 px-6 py-3 rounded-xl flex w-full items-center gap-2">
                    <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-primary"></div>
                    <span className="font-bold text-primary text-base">Dạng {i + 1}:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-base">{dt.dangToanName}</span>
                  </div>

                  {dt.methods.map((method, j) => (
                    <div key={method.id} className="space-y-6 border-t border-slate-200 dark:border-slate-700 pt-6 mt-6 first:border-0 first:pt-0 first:mt-0">
                      <div className="space-y-3 mb-6">
                        <div className="flex items-center gap-2">
                          <Lightbulb size={20} className="text-primary" />
                          <h4 className="font-bold text-slate-800 dark:text-slate-200">{method.methodName || `Phương pháp ${j + 1}`}</h4>
                        </div>
                        {method.methodContent && (
                           <div 
                             className="prose dark:prose-invert max-w-none text-sm text-slate-600 dark:text-slate-400"
                             dangerouslySetInnerHTML={{ __html: method.methodContent }}
                           />
                        )}
                      </div>
                      
                      {method.exercise && method.exercise.content && (
                        <div className="space-y-6 w-full mt-4 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                          <div 
                            className="prose dark:prose-invert max-w-none text-slate-800 dark:text-slate-200"
                            dangerouslySetInnerHTML={{ __html: method.exercise.content }}
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
