'use client'
import React, { createContext, useContext, useState } from 'react'

export interface ExampleStep {
  step: number;
  title: string;
  content: string;
  formula?: string;
}

export interface ExampleExercise {
  problem: string;
  steps: ExampleStep[];
  conclusion?: string;
  tips?: string;
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

export interface MediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
}

interface LectureCreatorState {
  title: string;
  grade: string;
  category: string;
  mediaItems: MediaItem[];
  practiceIds: string[];
  dangToanList: DangToanItem[];
  setTitle: (val: string) => void;
  setGrade: (val: string) => void;
  setCategory: (val: string) => void;
  setMediaItems: (val: MediaItem[]) => void;
  setPracticeIds: (val: string[]) => void;
  setDangToanList: (val: DangToanItem[]) => void;
  validateAndSubmit: () => void;
  resetForm: () => void;
  removeDangToan: (id: string) => void;
  isSubmitting: boolean;
}

const LectureCreatorContext = createContext<LectureCreatorState | undefined>(undefined)

export function LectureCreatorProvider({ children }: { children: React.ReactNode }) {
  const [title, setTitle] = useState('')
  const [grade, setGrade] = useState('')
  const [category, setCategory] = useState('')
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [practiceIds, setPracticeIds] = useState<string[]>([])
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

  const validateAndSubmit = async () => {
    if (!title.trim()) {
      alert('Vui lòng nhập tiêu đề bài giảng')
      return
    }
    if (!grade) {
      alert('Vui lòng chọn khối lớp')
      return
    }
    if (!category) {
      alert('Vui lòng chọn danh mục')
      return
    }

    // check dangToanList
    for (let i = 0; i < dangToanList.length; i++) {
      const dt = dangToanList[i]
      if (!dt.dangToanName.trim()) {
        alert(`Dạng toán ${i + 1} chưa có tên`)
        return
      }
      for (let j = 0; j < dt.methods.length; j++) {
        const m = dt.methods[j]

        if (!m.exercise) {
          alert(`Dạng toán ${i + 1} - Phương pháp ${j + 1} chưa có nội dung bài tập (JSON)`)
          return
        }
        if (!m.exercise.problem.trim()) {
          alert(`Dạng toán ${i + 1} - Phương pháp ${j + 1} thiếu đề bài`)
          return
        }
        if (!m.exercise.steps || m.exercise.steps.length === 0) {
          alert(`Dạng toán ${i + 1} - Phương pháp ${j + 1} cần ít nhất 1 bước giải`)
          return
        }
      }
    }

    setIsSubmitting(true)

    try {
      const { apiFetch, uploadObjectUrlIfNeeded } = await import('@/lib/api')

      const processedMediaItems = await Promise.all(
        mediaItems.map(async (item) => {
          if (item.type === 'image') {
            const uploadedUrl = await uploadObjectUrlIfNeeded(item.url)
            return { ...item, url: uploadedUrl || item.url }
          }
          return item
        })
      )

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
        basicConcept: "", // Send empty string for backend compat
        mediaItems: processedMediaItems,
        practiceIds: practiceIds,
        examples: processedDangToanList // Backend now receives the new structure in 'examples' field
      }

      await apiFetch('/lectures', {
        method: 'POST',
        body: JSON.stringify(payload)
      })

      alert('Đã lưu bài giảng thành công!')
      resetForm()
    } catch (error: any) {
      console.error('Submit error:', error)
      alert(`Có lỗi xảy ra: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setTitle('')
    setGrade('')
    setCategory('')
    setMediaItems([])
    setPracticeIds([])
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
      mediaItems,
      practiceIds,
      dangToanList,
      setTitle,
      setGrade,
      setCategory,
      setMediaItems,
      setPracticeIds,
      setDangToanList,
      validateAndSubmit,
      resetForm,
      removeDangToan,
      isSubmitting
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
