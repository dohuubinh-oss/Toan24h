'use client'
import React from 'react'
import { MonitorPlay } from 'lucide-react'
import { useLectureCreator } from './LectureCreatorContext'
import SharedEditorCard from '../../questions/creator/editor/SharedEditorCard'

export default function LectureMediaCard() {
  const { basicConcept, setBasicConcept, contentType } = useLectureCreator()

  const isPractice = contentType === 'practice'
  const title = isPractice ? '1. Hướng dẫn & Lưu ý luyện tập' : '1. Giải thích khái niệm'
  const placeholder = isPractice ? 'Nhập hướng dẫn và lưu ý trọng tâm tại đây...' : 'Nhập khái niệm cơ bản tại đây...'

  return (
    <div className="mb-6">
      <SharedEditorCard
        title={title}
        icon={<MonitorPlay className="text-primary w-5 h-5" />}
        content={basicConcept}
        onContentChange={setBasicConcept}
        placeholder={placeholder}
      />
    </div>
  )
}
