'use client'
import React, { createContext, useContext, useState } from 'react'
import { ExampleExercise } from './ExampleExerciseCard'

interface ExampleItem {
  id: string;
  exercise: ExampleExercise | null;
  problemImage: string | null;
  solutionImage: string | null;
}

interface LectureCreatorState {
  title: string;
  grade: string;
  category: string;
  basicConcept: string;
  coverImage: string | null;
  videoUrl: string;
  practiceIds: string[];
  examples: ExampleItem[];
  setTitle: (val: string) => void;
  setGrade: (val: string) => void;
  setCategory: (val: string) => void;
  setBasicConcept: (val: string) => void;
  setCoverImage: (val: string | null) => void;
  setVideoUrl: (val: string) => void;
  setPracticeIds: (val: string[]) => void;
  setExamples: (val: ExampleItem[]) => void;
  validateAndSubmit: () => void;
  resetForm: () => void;
  removeExample: (id: string) => void;
  isSubmitting: boolean;
}

const LectureCreatorContext = createContext<LectureCreatorState | undefined>(undefined)

export function LectureCreatorProvider({ children }: { children: React.ReactNode }) {
  const [title, setTitle] = useState('')
  const [grade, setGrade] = useState('')
  const [category, setCategory] = useState('')
  const [basicConcept, setBasicConcept] = useState('')
  const [coverImage, setCoverImage] = useState<string | null>(null)
  const [videoUrl, setVideoUrl] = useState('')
  const [practiceIds, setPracticeIds] = useState<string[]>([])
  const [examples, setExamples] = useState<ExampleItem[]>([
    { id: '1', exercise: null, problemImage: null, solutionImage: null }
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
    const textOnly = basicConcept.replace(/<[^>]*>?/gm, '').trim()
    if (!textOnly && !coverImage && !videoUrl) {
      alert('Vui lòng nhập ít nhất một trong hai: Khái niệm cơ bản hoặc Đa phương tiện (Ảnh bìa / Video)')
      return
    }

    // check examples
    for (let i = 0; i < examples.length; i++) {
      const ex = examples[i]
      if (!ex.exercise) {
        alert(`Bài tập mẫu ${i + 1} chưa có nội dung`)
        return
      }
      if (!ex.exercise.problem.trim()) {
        alert(`Bài tập mẫu ${i + 1} thiếu đề bài`)
        return
      }
      if (!ex.exercise.steps || ex.exercise.steps.length === 0) {
        alert(`Bài tập mẫu ${i + 1} cần ít nhất 1 bước giải`)
        return
      }
    }

    setIsSubmitting(true)

    try {
      // Dynamic import to avoid SSR issues if api.ts has client-only features
      const { apiFetch, uploadObjectUrlIfNeeded } = await import('@/lib/api')

      // Process images
      const coverImgUrl = await uploadObjectUrlIfNeeded(coverImage)

      const processedExamples = await Promise.all(
        examples.map(async (ex) => ({
          id: ex.id,
          exercise: ex.exercise!,
          problemImage: await uploadObjectUrlIfNeeded(ex.problemImage),
          solutionImage: await uploadObjectUrlIfNeeded(ex.solutionImage)
        }))
      )

      const payload = {
        title,
        grade,
        category,
        basicConcept,
        coverImage: coverImgUrl || '',
        videoUrl: videoUrl,
        practiceIds: practiceIds,
        examples: processedExamples
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
    setBasicConcept('')
    setCoverImage(null)
    setVideoUrl('')
    setPracticeIds([])
    setExamples([{ id: Math.random().toString(36).substr(2, 9), exercise: null, problemImage: null, solutionImage: null }])
  }

  const removeExample = (id: string) => {
    setExamples(prev => {
      if (prev.length <= 1) return prev
      return prev.filter(ex => ex.id !== id)
    })
  }

  return (
    <LectureCreatorContext.Provider value={{
      title,
      grade,
      category,
      basicConcept,
      coverImage,
      videoUrl,
      practiceIds,
      examples,
      setTitle,
      setGrade,
      setCategory,
      setBasicConcept,
      setCoverImage,
      setVideoUrl,
      setPracticeIds,
      setExamples,
      validateAndSubmit,
      resetForm,
      removeExample,
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
