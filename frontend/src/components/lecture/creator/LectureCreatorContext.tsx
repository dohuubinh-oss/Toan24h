'use client'
import React, { createContext, useContext, useState } from 'react'
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
  methodContent: string;
  exercise: ExampleExercise | null;
  problemImage: string | null;
  solutionImage: string | null;
}

export interface DangToanItem {
  id: string;
  dangToanName: string;
  methods: MethodItem[];
}



interface LectureCreatorState {
  title: string;
  grade: string;
  category: string;
  basicConcept: string;
  dangToanList: DangToanItem[];
  setTitle: (val: string) => void;
  setGrade: (val: string) => void;
  setCategory: (val: string) => void;
  setBasicConcept: (val: string) => void;
  setDangToanList: (val: DangToanItem[] | ((prev: DangToanItem[]) => DangToanItem[])) => void;
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
  const [title, setTitle] = useState('')
  const [grade, setGrade] = useState('')
  const [category, setCategory] = useState('')
  const [basicConcept, setBasicConcept] = useState('')
  const [dangToanList, setDangToanList] = useState<DangToanItem[]>([
    { 
      id: '1', 
      dangToanName: '', 
      methods: [
        { id: '1-1', methodName: '', methodContent: '', exercise: null, problemImage: null, solutionImage: null }
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

          let parsedExamples: DangToanItem[] = []
          if (typeof data.examples === 'string') {
            try {
              parsedExamples = JSON.parse(data.examples)
            } catch (e) {
              parsedExamples = []
            }
          } else if (Array.isArray(data.examples)) {
            parsedExamples = data.examples
          }

          if (parsedExamples && parsedExamples.length > 0) {
            setDangToanList(parsedExamples)
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
      toast.error('Vui lòng nhập tiêu đề bài giảng')
      return
    }
    if (!grade) {
      toast.error('Vui lòng chọn khối lớp')
      return
    }
    if (!category) {
      toast.error('Vui lòng chọn danh mục')
      return
    }

    // check dangToanList
    for (let i = 0; i < dangToanList.length; i++) {
      const dt = dangToanList[i]
      if (!dt.dangToanName.trim()) {
        toast.error(`Dạng toán ${i + 1} chưa có tên`)
        return
      }
      for (let j = 0; j < dt.methods.length; j++) {
        const m = dt.methods[j]

        if (!m.exercise) {
          toast.error(`Dạng toán ${i + 1} - Phương pháp ${j + 1} chưa có nội dung bài tập (JSON)`)
          return
        }
        if (!m.exercise.content.trim()) {
          toast.error(`Dạng toán ${i + 1} - Phương pháp ${j + 1} chưa có đề bài / nội dung`)
          return
        }
      }
    }

    setIsSubmitting(true)

    try {
      const { apiFetch, uploadObjectUrlIfNeeded } = await import('@/lib/api')

      const processedDangToanList = await Promise.all(
        dangToanList.map(async (dt) => ({
          id: dt.id,
          dangToanName: dt.dangToanName,
          methods: await Promise.all(
            dt.methods.map(async (m) => ({
              id: m.id,
              methodName: m.methodName,
              methodContent: m.methodContent,
              exercise: m.exercise!,
              problemImage: await uploadObjectUrlIfNeeded(m.problemImage),
              solutionImage: await uploadObjectUrlIfNeeded(m.solutionImage)
            }))
          )
        }))
      )

      const payload = {
        title,
        grade,
        category,
        basicConcept,
        examples: processedDangToanList
      }

      if (editId) {
        await apiFetch(`/lectures/${editId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        })
        toast.success('Cập nhật bài giảng thành công!')
      } else {
        await apiFetch('/lectures', {
          method: 'POST',
          body: JSON.stringify(payload)
        })
        toast.success('Tạo bài giảng thành công!')
        resetForm()
      }
    } catch (error: any) {
      console.error('Submit error:', error)
      toast.error(`Có lỗi xảy ra: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setTitle('')
    setGrade('')
    setCategory('')
    setBasicConcept('')
    setDangToanList([{ 
      id: Math.random().toString(36).substr(2, 9), 
      dangToanName: '', 
      methods: [
        { id: Math.random().toString(36).substr(2, 9), methodName: '', methodContent: '', exercise: null, problemImage: null, solutionImage: null }
      ] 
    }])
  }

  const removeDangToan = (id: string) => {
    setDangToanList(prev => {
      if (prev.length <= 1) return prev
      return prev.filter(dt => dt.id !== id)
    })
  }

  return (
    <LectureCreatorContext.Provider value={{
      title,
      grade,
      category,
      basicConcept,
      dangToanList,
      setTitle,
      setGrade,
      setCategory,
      setBasicConcept,
      setDangToanList,
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
