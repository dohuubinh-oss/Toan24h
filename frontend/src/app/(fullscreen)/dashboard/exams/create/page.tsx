'use client'

import React, { useState, Suspense, useCallback, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import ExamHeader from '@/components/exams/ExamHeader'
import ExamQuestionList from '@/components/exams/ExamQuestionList'
import ExamConfigSidebar from '@/components/exams/ExamConfigSidebar'
import { Grid, UploadCloud } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { MOCK_EXAM } from '@/lib/mock-data'
import { Exam } from '@/types/exam'
import { validateExamConfig, calculateExamDifficulty } from '@/lib/exam-utils'

export default function CreateExamPage() {
  return (
    <Suspense fallback={<div className="p-8">Đang tải dữ liệu...</div>}>
      <CreateExamPageContent />
    </Suspense>
  )
}

function CreateExamPageContent() {
  const searchParams = useSearchParams()
  const urlType = searchParams.get('type') === 'practice' ? 'practice' : 'exam'

  const [exam, setExam] = useState<Exam>({
    ...MOCK_EXAM,
    title: '',
    examCode: '',
    grade: '',
    duration: 0,
    type: urlType as 'exam' | 'practice'
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleConfigChange = useCallback((field: keyof Exam, value: any) => {
    setExam(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear error when user types
    setErrors(prev => {
      if (!prev[field]) return prev;
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    })
  }, [])

  const handleSave = () => {
    const newErrors = validateExamConfig(exam);
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // Optional: scroll to top to show errors
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const { diffScore } = calculateExamDifficulty(exam.questions);
    const questionIds = exam.questions.map(q => q.id).filter(Boolean);

    const payload = {
      title: exam.title,
      examCode: exam.examCode,
      grade: exam.grade,
      duration: exam.duration,
      diffScore: diffScore,
      questionIds: questionIds,
    };

    console.log('Sending exam to backend (Mock):', payload);
    
    // Simulate API call promise
    return new Promise((resolve) => {
      setTimeout(() => {
        alert('Lưu đề thi thành công!');
        resolve(payload);
      }, 500);
    });
  }

  return (
    <div className="bg-slate-50 text-slate-900 min-h-screen pb-20 lg:pb-0 font-body">
      <ExamHeader 
        title={exam.title}
        examCode={exam.examCode}
        onSave={handleSave}
      />
      
      <main className="max-w-7xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <ExamQuestionList questions={exam.questions} />
        <ExamConfigSidebar 
          config={{
            title: exam.title,
            examCode: exam.examCode,
            grade: exam.grade,
            duration: exam.duration,
            type: exam.type
          }}
          onChange={handleConfigChange}
          questions={exam.questions}
          errors={errors}
        />
      </main>

      {/* Mobile Footer */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 flex gap-3 z-40 shadow-2xl">
        <Button variant="secondary" className="flex-1 h-12 rounded-xl text-sm font-bold gap-2">
          <Grid className="w-5 h-5" />
          Ma trận
        </Button>
        <Button 
          onClick={handleSave}
          className="flex-1 h-12 rounded-xl text-sm font-bold gap-2 shadow-lg shadow-primary/30"
        >
          <UploadCloud className="w-5 h-5" />
          Lưu đề thi
        </Button>
      </div>
    </div>
  )
}
