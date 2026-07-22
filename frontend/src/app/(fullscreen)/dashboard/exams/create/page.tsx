'use client'

import React, { useState, Suspense, useCallback, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import ExamHeader from '@/components/exams/ExamHeader'
import ExamQuestionList from '@/components/exams/ExamQuestionList'
import ExamConfigSidebar from '@/components/exams/ExamConfigSidebar'
import { Grid, UploadCloud } from 'lucide-react'
import { Button } from '@/components/ui/Button'
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
  const router = useRouter()
  const urlType = searchParams.get('type') === 'practice' ? 'practice' : 'exam'

  const [exam, setExam] = useState<Exam>({
    title: '',
    examCode: '',
    grade: '',
    duration: 0,
    type: urlType as 'exam' | 'practice',
    questions: []
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const qidsParam = searchParams.get('qids');
    if (qidsParam) {
      const ids = qidsParam.split(',').filter(Boolean);
      if (ids.length > 0) {
        // Fetch questions from backend
        import('@/lib/api').then(({ getQuestions }) => {
          getQuestions(1, 1000, ids).then(res => {
            if (res.data) {
              setExam(prev => ({ ...prev, questions: res.data }));
            }
          }).catch(err => console.error("Failed to fetch questions for exam:", err));
        });
      }
    }
  }, [searchParams]);

  const handleConfigChange = useCallback((field: keyof Exam, value: any) => {
    setExam(prev => {
      const newExam = { ...prev, [field]: value }
      if (field === 'type' && value === 'practice') {
        newExam.duration = 0
      }
      return newExam
    })
    
    // Clear error when user types
    setErrors(prev => {
      if (!prev[field]) return prev;
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    })
  }, [])

  const handleRemoveQuestion = useCallback((idToRemove: string) => {
    setExam(prev => {
      const newQuestions = prev.questions.filter(q => q.id !== idToRemove);
      
      // Cập nhật lại URL qids
      const newIds = newQuestions.map(q => q.id).filter(Boolean);
      const params = new URLSearchParams(searchParams.toString());
      if (newIds.length > 0) {
        params.set('qids', newIds.join(','));
      } else {
        params.delete('qids');
      }
      router.replace(`?${params.toString()}`, { scroll: false });
      
      return { ...prev, questions: newQuestions };
    });
  }, [router, searchParams]);

  const handleSave = async () => {
    const newErrors = validateExamConfig(exam);
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (exam.questions.length === 0) {
      alert('Vui lòng chọn ít nhất 1 câu hỏi để tạo đề thi!');
      return;
    }

    const { diffScore } = calculateExamDifficulty(exam.questions);
    const questionIds = exam.questions.map(q => q.id).filter(Boolean);

    const payload = {
      title: exam.title,
      examCode: exam.examCode,
      type: exam.type,
      grade: exam.grade,
      duration: exam.duration,
      diffScore: diffScore,
      questionIds: questionIds,
      lectureId: exam.lectureId,
    };

    setIsSaving(true);
    try {
      const { createExam } = await import('@/lib/api');
      await createExam(payload);
      alert('Lưu đề thi thành công!');
      router.push('/dashboard/exams');
    } catch (err) {
      console.error('Lưu đề thi thất bại:', err);
      alert('Lưu đề thi thất bại. Vui lòng thử lại.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="bg-slate-50 text-slate-900 min-h-screen pb-20 lg:pb-0 font-body">
      <ExamHeader 
        title={exam.title}
        examCode={exam.examCode}
        onSave={handleSave}
        isSaving={isSaving}
      />
      
      <main className="max-w-7xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <ExamQuestionList questions={exam.questions} onRemoveQuestion={handleRemoveQuestion} />
        <ExamConfigSidebar 
          config={{
            title: exam.title,
            examCode: exam.examCode,
            grade: exam.grade,
            duration: exam.duration,
            type: exam.type,
            lectureId: exam.lectureId
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
