'use client'
import React, { createContext, useContext, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from '@/components/ui/ToastProvider'

export interface ExampleStep {
  step: number;
  title: string;
  content: string;
  formula?: string;
}

export interface ExampleExercise {
  content: string;
}

export interface MethodItem {
  id: string;
  methodName: string;
  solution: string;
  exercise: ExampleExercise | null;
  problemImage: string | null;
  solutionImage: string | null;
}

export interface DangToanItem {
  id: string;
  mathType: string;
  methods: MethodItem[];
}



export type LectureContentType = 'lecture' | 'practice'

interface LectureCreatorState {
  contentType: LectureContentType;
  setContentType: (val: LectureContentType) => void;
  title: string;
  grade: string;
  category: string;
  basicConcept: string;
  dangToanList: DangToanItem[];
  ggLink: string;
  setTitle: (val: string) => void;
  setGrade: (val: string) => void;
  setCategory: (val: string) => void;
  setBasicConcept: (val: string) => void;
  setDangToanList: (val: DangToanItem[] | ((prev: DangToanItem[]) => DangToanItem[])) => void;
  setGgLink: (val: string) => void;
  validateAndSubmit: () => void;
  resetForm: () => void;
  removeDangToan: (id: string) => void;
  isSubmitting: boolean;
  isLoading: boolean;
  isEdit: boolean;
  editId?: string | null;
}

const LectureCreatorContext = createContext<LectureCreatorState | undefined>(undefined)

export function LectureCreatorProvider({ children, editId }: { children: React.ReactNode; editId?: string | null }) {
  const router = useRouter()
  const [contentType, setContentType] = useState<LectureContentType>('lecture')
  const [title, setTitle] = useState('')
  const [grade, setGrade] = useState('')
  const [category, setCategory] = useState('')
  const [basicConcept, setBasicConcept] = useState('')
  const [ggLink, setGgLink] = useState('')
  const [dangToanList, setDangToanList] = useState<DangToanItem[]>([
    { 
      id: '1', 
      mathType: '', 
      methods: [
        { id: '1-1', methodName: '', solution: '', exercise: null, problemImage: null, solutionImage: null }
      ] 
    }
  ])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  React.useEffect(() => {
    if (!editId) return
    let isMounted = true

    const fetchLecture = async () => {
      setIsLoading(true)
      try {
        const { apiFetch } = await import('@/lib/api')
        const data = await apiFetch(`/lectures/${editId}`)
        if (!isMounted) return

        if (data) {
          setTitle(data.title || '')
          setGrade(data.grade || '')
          setCategory(data.category || '')
          setBasicConcept(data.basicConcept || '')
          setGgLink(data.gg_link || '')

          let rawExamples: any[] = []
          if (typeof data.examples === 'string') {
            try {
              rawExamples = JSON.parse(data.examples)
            } catch {
              rawExamples = []
            }
          } else if (Array.isArray(data.examples)) {
            rawExamples = data.examples
          }

          if (rawExamples && rawExamples.length > 0) {
            const normalizedExamples: DangToanItem[] = rawExamples.map((dt: any, idx: number) => ({
              id: dt.id || `dt-${idx + 1}`,
              mathType: dt.mathType || dt.dangToanName || '',
              methods: Array.isArray(dt.methods)
                ? dt.methods.map((m: any, mIdx: number) => ({
                    id: m.id || `m-${mIdx + 1}`,
                    methodName: m.methodName || '',
                    solution: m.solution || m.Solution || m.methodContent || '',
                    exercise: m.exercise || null,
                    problemImage: m.problemImage || null,
                    solutionImage: m.solutionImage || null
                  }))
                : []
            }))
            setDangToanList(normalizedExamples)
          }

          // Auto-detect if this is a standalone practice card
          if ((!data.basicConcept || data.basicConcept.trim() === '') && (!rawExamples || rawExamples.length === 0)) {
            setContentType('practice')
          } else {
            setContentType('lecture')
          }
        }
      } catch (error: any) {
        console.error('Failed to load lecture:', error)
        toast.error('Không tìm thấy thông tin bài giảng cần sửa')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    fetchLecture()
    return () => {
      isMounted = false
    }
  }, [editId])

  const validateAndSubmit = async () => {
    if (!title.trim()) {
      toast.error('Vui lòng nhập tiêu đề')
      return
    }
    if (!grade) {
      toast.error('Vui lòng chọn khối lớp')
      return
    }
    if (!category) {
      toast.error('Vui lòng chọn danh mục / chuyên đề')
      return
    }


    setIsSubmitting(true)

    try {
      const { apiFetch, uploadObjectUrlIfNeeded } = await import('@/lib/api')

      let processedDangToanList: any[] = []
      let processedBasicConcept = ''

      if (contentType === 'lecture') {
        processedBasicConcept = basicConcept

        const isMethodNonEmpty = (m: MethodItem) => {
          return Boolean(
            m.methodName?.trim() ||
            m.solution?.trim() ||
            (m.exercise && m.exercise.content?.trim()) ||
            m.problemImage ||
            m.solutionImage
          )
        }

        const nonEmptyDangToan = dangToanList.filter(dt => {
          const hasName = Boolean(dt.mathType?.trim())
          const hasAnyMethod = dt.methods?.some(isMethodNonEmpty)
          return hasName || hasAnyMethod
        })

        processedDangToanList = await Promise.all(
          nonEmptyDangToan.map(async (dt) => ({
            id: dt.id,
            mathType: dt.mathType || '',
            dangToanName: dt.mathType || '',
            methods: await Promise.all(
              (dt.methods || []).map(async (m) => ({
                id: m.id,
                methodName: m.methodName || '',
                solution: m.solution || '',
                methodContent: m.solution || '',
                exercise: m.exercise && m.exercise.content?.trim() ? { content: m.exercise.content } : null,
                problemImage: await uploadObjectUrlIfNeeded(m.problemImage),
                solutionImage: await uploadObjectUrlIfNeeded(m.solutionImage)
              }))
            )
          }))
        )
      }

      const payload = {
        title,
        grade,
        category,
        basicConcept: processedBasicConcept,
        examples: processedDangToanList,
        gg_link: ggLink.trim()
      }

      if (editId) {
        await apiFetch(`/lectures/${editId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        })
        toast.success(contentType === 'practice' ? 'Cập nhật Card Luyện tập thành công!' : 'Cập nhật bài giảng thành công!')
        setTimeout(() => {
          router.push('/dashboard/lectures')
        }, 500)
      } else {
        await apiFetch('/lectures', {
          method: 'POST',
          body: JSON.stringify(payload)
        })
        toast.success(contentType === 'practice' ? 'Tạo Card Luyện tập thành công!' : 'Tạo bài giảng thành công!')
        resetForm()
        setTimeout(() => {
          router.push('/dashboard/lectures')
        }, 500)
      }
    } catch (error: any) {
      console.error('Submit error:', error)
      toast.error(`Có lỗi xảy ra: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setContentType('lecture')
    setTitle('')
    setGrade('')
    setCategory('')
    setBasicConcept('')
    setGgLink('')
    setDangToanList([{ 
      id: Math.random().toString(36).substr(2, 9), 
      mathType: '', 
      methods: [
        { id: Math.random().toString(36).substr(2, 9), methodName: '', solution: '', exercise: null, problemImage: null, solutionImage: null }
      ] 
    }])
  }

  const removeDangToan = (id: string) => {
    setDangToanList(prev => prev.filter(dt => dt.id !== id))
  }

  return (
    <LectureCreatorContext.Provider value={{
      contentType,
      setContentType,
      title,
      grade,
      category,
      basicConcept,
      dangToanList,
      ggLink,
      setTitle,
      setGrade,
      setCategory,
      setBasicConcept,
      setDangToanList,
      setGgLink,
      validateAndSubmit,
      resetForm,
      removeDangToan,
      isSubmitting,
      isLoading,
      isEdit: !!editId,
      editId
    }}>
      {children}
    </LectureCreatorContext.Provider>
  )
}

export function useLectureCreator() {
  const context = useContext(LectureCreatorContext)
  if (context === undefined) {
    throw new Error('useLectureCreator must be used within a LectureCreatorProvider')
  }
  return context
}
