'use client'
import React, { useState } from 'react'
import { BookOpen } from 'lucide-react'
import SharedEditorCard from '../../questions/creator/editor/SharedEditorCard'
import ExampleExerciseCard, { ExampleExercise } from './ExampleExerciseCard'

interface ExampleItem {
  id: string;
  exercise: ExampleExercise | null;
  image: string | null;
}

export default function LectureContentEditor() {
  const [basicConcept, setBasicConcept] = useState('<p>Nhập khái niệm cơ bản tại đây...</p>')
  const [basicConceptImage, setBasicConceptImage] = useState<string | null>(null)

  const [examples, setExamples] = useState<ExampleItem[]>([
    { id: '1', exercise: null, image: null }
  ])

  const handleAddExercise = () => {
    setExamples([
      ...examples,
      { id: Math.random().toString(36).substr(2, 9), exercise: null, image: null }
    ])
  }

  const updateExample = (id: string, updates: Partial<ExampleItem>) => {
    setExamples(examples.map(ex => ex.id === id ? { ...ex, ...updates } : ex))
  }

  return (
    <div className="space-y-6">
      <SharedEditorCard
        title="1. Khái niệm cơ bản"
        icon={<BookOpen className="text-primary w-5 h-5" />}
        content={basicConcept}
        imageUrl={basicConceptImage}
        onContentChange={setBasicConcept}
        onImageChange={setBasicConceptImage}
        placeholder="Nhập khái niệm cơ bản tại đây..."
        imageLabel="Thêm hình vẽ minh hoạ"
      />

      {examples.map((ex, index) => (
        <ExampleExerciseCard
          key={ex.id}
          title={`2.${index + 1}. Phân tích bài tập mẫu ${index > 0 ? index + 1 : ''}`.trim()}
          exercise={ex.exercise}
          imageUrl={ex.image}
          onExerciseChange={(data) => updateExample(ex.id, { exercise: data })}
          onImageChange={(url) => updateExample(ex.id, { image: url })}
          onAddExercise={index === examples.length - 1 ? handleAddExercise : undefined}
          imageLabel="Thêm hình vẽ minh hoạ"
        />
      ))}
    </div>
  )
}
