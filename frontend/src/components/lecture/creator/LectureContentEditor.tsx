'use client'
import React from 'react'
import { BookOpen, Plus } from 'lucide-react'
import SharedEditorCard from '../../questions/creator/editor/SharedEditorCard'
import ExampleExerciseCard from './ExampleExerciseCard'
import LectureMediaCard from './LectureMediaCard'
import { useLectureCreator } from './LectureCreatorContext'

export default function LectureContentEditor() {
  const { 
    basicConcept, 
    setBasicConcept, 
    examples,
    setExamples,
    removeExample
  } = useLectureCreator()

  const addExample = () => {
    setExamples([...examples, { id: Math.random().toString(), exercise: null, problemImage: null, solutionImage: null }])
  }

  const updateExample = (id: string, updates: Partial<typeof examples[0]>) => {
    setExamples(examples.map(ex => ex.id === id ? { ...ex, ...updates } : ex))
  }

  return (
    <div className="space-y-6">
      <LectureMediaCard />
      
      <SharedEditorCard
        title="1. Khái niệm cơ bản"
        icon={<BookOpen className="text-primary w-5 h-5" />}
        content={basicConcept}
        onContentChange={setBasicConcept}
        placeholder="Nhập khái niệm cơ bản tại đây..."
      />

      {examples.map((ex, index) => (
        <ExampleExerciseCard
          key={ex.id}
          title={`2.${index + 1}. Phân tích bài tập mẫu`}
          exercise={ex.exercise}
          problemImage={ex.problemImage}
          solutionImage={ex.solutionImage}
          onExerciseChange={(data) => updateExample(ex.id, { exercise: data })}
          onProblemImageChange={(url) => updateExample(ex.id, { problemImage: url })}
          onSolutionImageChange={(url) => updateExample(ex.id, { solutionImage: url })}
          onRemoveExercise={examples.length > 1 ? () => removeExample(ex.id) : undefined}
        />
      ))}

      <div className="flex justify-center mt-6">
        <button
          onClick={addExample}
          className="w-14 h-14 bg-white rounded-full shadow-[0_4px_20px_rgb(0,0,0,0.08)] flex items-center justify-center hover:shadow-[0_4px_25px_rgb(0,0,0,0.12)] hover:-translate-y-0.5 transition-all duration-200 border border-slate-50"
          title="Thêm bài tập mẫu mới"
        >
          <Plus className="w-8 h-8 text-primary stroke-[2.5]" />
        </button>
      </div>
    </div>
  )
}
