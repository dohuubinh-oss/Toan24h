'use client'

import React, { useState, useCallback, useRef } from 'react'
import { ArrowLeft, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, Trash2, Save } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import JsonInputSection from '@/components/questions/creator/JsonInputSection'
import QuestionEditorSection from '@/components/questions/creator/QuestionEditorSection'
import QuestionSettingsSidebar from '@/components/questions/creator/QuestionSettingsSidebar'
import { Button } from '@/components/ui/Button'
import { QuestionBlock, Question } from '@/types/question'
import { apiFetch } from '@/lib/api'
import { Loader2 } from 'lucide-react'
import { getQuestion, updateQuestion as apiUpdateQuestion } from '@/lib/api'
import { Suspense, useEffect } from 'react'
import { toast } from '@/components/ui/ToastProvider'

export default function CreateQuestionPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
      <CreateQuestionContent />
    </Suspense>
  )
}

function CreateQuestionContent() {
  const [questionBlocks, setQuestionBlocks] = useState<QuestionBlock[]>([])
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const editorRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const id = searchParams.get('id')
    if (id) {
      setEditId(id)
      getQuestion(id).then(q => {
        if (q) {
          // Wrap in QuestionBlock for compatibility with the editor format
          if (q.type_question === 'group' && q.subQuestions) {
            setQuestionBlocks([{
              shared_content: q.content,
              questions: q.subQuestions,
              is_group: true
            }])
          } else {
            setQuestionBlocks([{
              shared_content: '',
              questions: [q],
              is_group: false
            }])
          }
        }
      })
    }
  }, [searchParams])

  const scrollToEditor = () => {
    setTimeout(() => {
      if (editorRef.current) {
        const yOffset = -100; // offset for sticky header
        const element = editorRef.current;
        const y = element.getBoundingClientRect().top + window.scrollY + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }, 50)
  }

  const handleProcessJson = useCallback((blocks: QuestionBlock[]) => {
    setQuestionBlocks(blocks)
    setCurrentBlockIndex(0)
    setCurrentQuestionIndex(0)
    scrollToEditor()
  }, [])

  const handleNext = useCallback(() => {
    if (questionBlocks.length === 0) return;
    const currentBlock = questionBlocks[currentBlockIndex];
    if (currentQuestionIndex < currentBlock.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else if (currentBlockIndex < questionBlocks.length - 1) {
      setCurrentBlockIndex(prev => prev + 1);
      setCurrentQuestionIndex(0);
    }
    scrollToEditor()
  }, [questionBlocks, currentBlockIndex, currentQuestionIndex])

  const handlePrev = useCallback(() => {
    if (questionBlocks.length === 0) return;
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    } else if (currentBlockIndex > 0) {
      setCurrentBlockIndex(prev => prev - 1);
      setCurrentQuestionIndex(questionBlocks[currentBlockIndex - 1].questions.length - 1);
    }
    scrollToEditor()
  }, [questionBlocks, currentBlockIndex, currentQuestionIndex])

  const updateQuestion = useCallback((field: keyof Question, value: any) => {
    setQuestionBlocks(prev => {
      const currentBlock = prev[currentBlockIndex];
      if (!currentBlock || !currentBlock.questions[currentQuestionIndex]) {
        return prev;
      }
      
      const newBlocks = [...prev];
      
      if (field === 'book_name') {
        let updateFromNowOn = false;
        for (let bIdx = 0; bIdx < newBlocks.length; bIdx++) {
           const block = { ...newBlocks[bIdx], questions: [...newBlocks[bIdx].questions] };
           newBlocks[bIdx] = block;
           for (let qIdx = 0; qIdx < block.questions.length; qIdx++) {
             if (bIdx === currentBlockIndex && qIdx === currentQuestionIndex) {
               updateFromNowOn = true;
             }
             if (updateFromNowOn) {
               block.questions[qIdx] = { ...block.questions[qIdx], book_name: value };
             }
           }
        }
      } else {
        const newQuestions = [...currentBlock.questions];
        newQuestions[currentQuestionIndex] = {
          ...newQuestions[currentQuestionIndex],
          [field]: value
        };
        newBlocks[currentBlockIndex] = {
          ...currentBlock,
          questions: newQuestions
        };
      }
      
      return newBlocks;
    });
  }, [currentBlockIndex, currentQuestionIndex])

  const updateBlock = useCallback((field: keyof QuestionBlock, value: any) => {
    setQuestionBlocks(prev => {
      const currentBlock = prev[currentBlockIndex];
      if (!currentBlock) {
        return prev;
      }
      
      const newBlocks = [...prev];
      newBlocks[currentBlockIndex] = {
        ...currentBlock,
        [field]: value
      };
      
      return newBlocks;
    });
  }, [currentBlockIndex])

  const handleSave = useCallback(async () => {
    if (questionBlocks.length === 0) {
      toast.error("Không có câu hỏi nào để lưu!");
      return;
    }

    try {
      setIsSaving(true);

      if (editId) {
        // If editing a group question, we assume the backend endpoint handles the whole hierarchy or we just send the single root Question if 'single'
        const block = questionBlocks[0];
        const isGroup = block.is_group === true;
        
        let payload: Partial<Question>;
        if (isGroup) {
          payload = {
            id: editId,
            type_question: 'group',
            content: block.shared_content,
            subQuestions: block.questions
          };
        } else {
          payload = {
            ...block.questions[0],
            id: editId,
            type_question: 'single'
          };
        }
        
        await apiUpdateQuestion(editId, payload);
        toast.success('Cập nhật câu hỏi thành công!');
      } else {
        const payload = questionBlocks.map(block => ({
          shared_content: block.shared_content,
          is_group: block.is_group === true,
          questions: block.questions.map(q => ({
            ...q,
            grade: typeof q.grade === 'string' ? parseInt(q.grade) : (q.grade || 0),
            difficulty_point: q.difficulty_point || 0,
            point: q.point || 0,
          }))
        }));

        await apiFetch('/questions/bulk', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }
      
      router.push('/dashboard/questions');
    } catch (error: any) {
      console.error("Lỗi khi lưu:", error);
      toast.error("Lỗi khi lưu: " + error.message);
    } finally {
      setIsSaving(false);
    }
  }, [questionBlocks, router, editId])

  const currentBlock = questionBlocks[currentBlockIndex] || null;
  const currentQuestion = currentBlock?.questions[currentQuestionIndex] || null;
  const totalQuestions = questionBlocks.reduce((acc, block) => acc + block.questions.length, 0);
  const currentGlobalIndex = questionBlocks.slice(0, currentBlockIndex).reduce((acc, block) => acc + block.questions.length, 0) + currentQuestionIndex + 1;

  return (
    <div className="bg-slate-50 min-h-screen font-display pb-20 lg:pb-0">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 w-full">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/questions" className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-slate-800">{editId ? 'Sửa câu hỏi' : 'Thêm câu hỏi thông minh'}</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button onClick={handleSave} disabled={isSaving || questionBlocks.length === 0} className="px-6 flex items-center gap-2 shadow-sm shadow-primary/20">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isSaving ? "Đang lưu..." : (editId ? "Cập nhật" : "Lưu vào ngân hàng")}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <main className="max-w-7xl mx-auto p-4 lg:p-6 pb-28 lg:pb-28">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column - Input and Editor */}
          <div className="lg:col-span-8 space-y-6">
            <JsonInputSection 
              onProcessJson={handleProcessJson}
              currentGlobalIndex={currentGlobalIndex}
              totalQuestions={totalQuestions}
              currentQuestion={currentQuestion}
              onNext={handleNext}
              onPrev={handlePrev}
            />
            <div ref={editorRef} className="scroll-mt-24">
              <QuestionEditorSection 
                currentBlock={currentBlock}
                currentQuestion={currentQuestion}
                updateBlock={updateBlock}
                updateQuestion={updateQuestion}
              />
            </div>
          </div>

          {/* Right Column - Sidebar Settings */}
          <div className="lg:col-span-4">
            <QuestionSettingsSidebar 
              currentQuestion={currentQuestion}
              updateQuestion={updateQuestion}
            />
          </div>

        </div>
      </main>

      {/* Floating Action Bar (Navigation Controls) */}
      {(totalQuestions > 0) && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white border border-slate-200 shadow-2xl rounded-full px-4 py-2.5 flex items-center gap-3 z-50 animate-in slide-in-from-bottom-10 fade-in">
          <button className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 disabled:opacity-30" disabled>
            <ChevronsLeft className="w-5 h-5" />
          </button>
          <button 
            className="p-2 hover:bg-slate-100 rounded-full transition-colors border border-transparent disabled:opacity-30" 
            onClick={handlePrev}
            disabled={totalQuestions === 0 || currentGlobalIndex <= 1}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="px-6 py-1 flex items-center gap-3 border-x border-slate-200">
            <span className="text-sm font-black text-primary uppercase tracking-widest">
              Câu {totalQuestions > 0 ? currentGlobalIndex : 0}
            </span>
            {(() => {
              const isGroup = currentBlock?.is_group === true;
                              
              return isGroup && (
                <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs font-black rounded uppercase tracking-widest border border-red-200 hidden sm:inline-block">
                  Câu hỏi chùm
                </span>
              );
            })()}
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              / {totalQuestions}
            </span>
          </div>
          
          <button 
            className="p-2 hover:bg-slate-100 rounded-full transition-colors border border-transparent disabled:opacity-30"
            onClick={handleNext}
            disabled={totalQuestions === 0 || currentGlobalIndex >= totalQuestions}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 disabled:opacity-30" disabled>
            <ChevronsRight className="w-5 h-5" />
          </button>
          
          <div className="w-px h-6 bg-slate-200 mx-2"></div>
          <button className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors" title="Xóa câu này">
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  )
}
