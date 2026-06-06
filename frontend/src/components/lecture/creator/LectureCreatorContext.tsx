'use client'
import React, { createContext, useContext, useState } from 'react'
import { ExampleExercise } from './ExampleExerciseCard'

interface ExampleItem {
  id: string;
  exercise: ExampleExercise | null;
  image: string | null;
}

interface LectureCreatorState {
  title: string;
  grade: string;
  category: string;
  basicConcept: string;
  basicConceptImage: string | null;
  examples: ExampleItem[];
  setTitle: (val: string) => void;
  setGrade: (val: string) => void;
  setCategory: (val: string) => void;
  setBasicConcept: (val: string) => void;
  setBasicConceptImage: (val: string | null) => void;
  setExamples: (val: ExampleItem[]) => void;
  validateAndSubmit: () => void;
}

const LectureCreatorContext = createContext<LectureCreatorState | undefined>(undefined)

export function LectureCreatorProvider({ children }: { children: React.ReactNode }) {
  const [title, setTitle] = useState('')
  const [grade, setGrade] = useState('')
  const [category, setCategory] = useState('')
  const [basicConcept, setBasicConcept] = useState('<p>Nhập khái niệm cơ bản tại đây...</p>')
  const [basicConceptImage, setBasicConceptImage] = useState<string | null>(null)
  const [examples, setExamples] = useState<ExampleItem[]>([
    { id: '1', exercise: null, image: null }
  ])

  const validateAndSubmit = () => {
    if (!title.trim()) {
      alert('Vui lòng nhập tên bài giảng')
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
    if (!basicConcept || basicConcept === '<p>Nhập khái niệm cơ bản tại đây...</p>' || basicConcept === '<p></p>') {
      alert('Vui lòng nhập khái niệm cơ bản')
      return
    }
    
    for (let i = 0; i < examples.length; i++) {
      const ex = examples[i]
      if (!ex.exercise || !ex.exercise.problem || !ex.exercise.steps || ex.exercise.steps.length === 0) {
        alert(`Vui lòng nhập đầy đủ câu hỏi và lời giải cho bài tập mẫu ${i + 1}`)
        return
      }
    }

    alert('Dữ liệu hợp lệ! Đang gửi lên backend...')
    console.log('Submit payload:', {
      title, grade, category, basicConcept, basicConceptImage, examples
    })
  }

  return (
    <LectureCreatorContext.Provider value={{
      title, grade, category, basicConcept, basicConceptImage, examples,
      setTitle, setGrade, setCategory, setBasicConcept, setBasicConceptImage, setExamples,
      validateAndSubmit
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
