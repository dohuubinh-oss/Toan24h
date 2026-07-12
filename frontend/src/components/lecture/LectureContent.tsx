import React from 'react'
import { BookOpen, ChevronDown, Play, FileEdit, Lightbulb } from 'lucide-react'
import { DangToanItem, MediaItem } from '@/components/lecture/creator/LectureCreatorContext'
import MathText from '@/components/ui/MathText'

interface LectureConceptProps {
  basicConcept?: string;
  mediaItems?: MediaItem[];
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

export function LectureConcept({ basicConcept, mediaItems = [] }: LectureConceptProps) {
  if (!basicConcept && mediaItems.length === 0) return null;

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
            {basicConcept && (
               <div 
                 className="prose dark:prose-invert max-w-none mb-6"
                 dangerouslySetInnerHTML={{ __html: basicConcept }}
               />
            )}
            
            {mediaItems.map((item, idx) => (
              <div key={idx} className="group flex flex-col sm:flex-row gap-4 p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="flex flex-col w-full">
                  <div className={`relative w-full rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 group-hover:border-primary/30 transition-colors ${item.type === 'video' ? 'aspect-video' : ''}`}>
                    {item.type === 'video' ? (
                       <iframe src={item.url} className="absolute inset-0 w-full h-full" allowFullScreen></iframe>
                    ) : (
                       <img src={getMediaUrl(item.url)} alt="Media" className="w-full h-auto object-contain" />
                    )}
                  </div>
                </div>
              </div>
            ))}
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
          <div className="flex items-center gap-2 text-primary">
            <FileEdit size={24} />
            <h3 className="text-xl font-bold">2. Phân tích bài tập mẫu</h3>
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
                        <div className="flex items-center gap-2 text-primary">
                          <Lightbulb size={20} />
                          <h4 className="font-bold">{method.methodName || `Phương pháp ${j + 1}`}</h4>
                        </div>
                        {method.methodContent && (
                           <div 
                             className="prose dark:prose-invert max-w-none text-sm text-slate-600 dark:text-slate-400"
                             dangerouslySetInnerHTML={{ __html: method.methodContent }}
                           />
                        )}
                      </div>
                      
                      {method.exercise && (
                        <div className="space-y-6 w-full mt-4">
                          {method.exercise.problem && (
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                              <h5 className="font-bold text-slate-900 dark:text-white mb-3">Đề bài:</h5>
                              <MathText content={method.exercise.problem} className="text-slate-800 dark:text-slate-200" />
                              {method.problemImage && (
                                 <img src={getMediaUrl(method.problemImage)} alt="Problem" className="mt-4 w-full h-auto rounded-lg" />
                              )}
                            </div>
                          )}
                          
                          <div className="space-y-4 px-2">
                            <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-2">Các bước giải</h4>
                            {method.exercise.steps && method.exercise.steps.map((step, k) => (
                              <div className="flex gap-4" key={k}>
                                <div className="flex-none flex flex-col items-center">
                                  <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm shadow-md shadow-primary/20">
                                    {step.step}
                                  </div>
                                  {k < method.exercise!.steps.length - 1 && (
                                    <div className="w-0.5 h-full bg-slate-200 dark:bg-slate-700 my-1"></div>
                                  )}
                                </div>
                                <div className="pb-4 w-full pt-1">
                                  <MathText content={step.title} className="font-bold text-slate-800 dark:text-slate-200 text-base" />
                                  <MathText content={step.content} className="text-slate-600 dark:text-slate-400 mt-1" />
                                  {step.formula && <MathText content={step.formula.includes('$') ? step.formula : `$$${step.formula}$$`} className="mt-2 text-primary font-bold" />}
                                </div>
                              </div>
                            ))}

                            {(method.exercise.conclusion || method.solutionImage) && (
                              <div className="flex gap-4 mt-4">
                                <div className="flex-none flex flex-col items-center">
                                  <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-green-500/20">
                                    ✓
                                  </div>
                                </div>
                                <div className="pb-4 pt-1 w-full">
                                  <h4 className="font-bold text-green-600 dark:text-green-500">Kết luận</h4>
                                  {method.exercise.conclusion && (
                                    <MathText content={method.exercise.conclusion} className="text-slate-600 dark:text-slate-300 mt-1 font-medium" />
                                  )}
                                  {method.solutionImage && (
                                    <img src={getMediaUrl(method.solutionImage)} alt="Solution" className="mt-4 w-full h-auto rounded-lg" />
                                  )}
                                </div>
                              </div>
                            )}

                            {method.exercise.tips && (
                              <div className="flex gap-4 mt-4">
                                <div className="flex-none flex flex-col items-center">
                                  <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-amber-500/20">
                                    💡
                                  </div>
                                </div>
                                <div className="pb-4 pt-1 w-full">
                                  <h4 className="font-bold text-amber-600 dark:text-amber-500">Mẹo giải / Gợi ý</h4>
                                  <MathText content={method.exercise.tips} className="text-slate-600 dark:text-slate-300 mt-1" />
                                </div>
                              </div>
                            )}
                          </div>
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
