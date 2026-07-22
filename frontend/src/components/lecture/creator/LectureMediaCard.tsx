'use client'
import React from 'react'
import { MonitorPlay } from 'lucide-react'
import { useLectureCreator } from './LectureCreatorContext'
import SharedEditorCard from '../../questions/creator/editor/SharedEditorCard'

export default function LectureMediaCard() {
  const { basicConcept, setBasicConcept } = useLectureCreator()

  return (
    <div className="mb-6">
      <SharedEditorCard
        title="1. Giải thích khái niệm"
        icon={<MonitorPlay className="text-primary w-5 h-5" />}
        content={basicConcept}
        onContentChange={setBasicConcept}
        placeholder="Nhập khái niệm cơ bản tại đây..."
      />
    </div>
  )
}
