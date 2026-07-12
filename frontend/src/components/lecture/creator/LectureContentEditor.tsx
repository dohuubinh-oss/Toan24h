'use client'
import React from 'react'
import { Plus } from 'lucide-react'
import LectureMediaCard from './LectureMediaCard'
import { useLectureCreator } from './LectureCreatorContext'
import DangToanCard from './DangToanCard'

export default function LectureContentEditor() {
  const { 
    dangToanList,
    setDangToanList,
    removeDangToan
  } = useLectureCreator()

  const addDangToan = () => {
    setDangToanList([
      ...dangToanList, 
      { 
        id: Math.random().toString(36).substr(2, 9), 
        dangToanName: '', 
        methods: [
          { id: Math.random().toString(36).substr(2, 9), methodName: '', methodContent: '', exercise: null, problemImage: null, solutionImage: null }
        ] 
      }
    ])
  }

  const updateDangToan = (id: string, updatedDt: any) => {
    setDangToanList(dangToanList.map(dt => dt.id === id ? updatedDt : dt))
  }

  return (
    <div className="space-y-6">
      <LectureMediaCard />

      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-xl font-bold text-slate-800">2. Phân tích bài tập mẫu</h2>
      </div>

      {dangToanList.map((dt, index) => (
        <DangToanCard
          key={dt.id}
          dangToan={dt}
          index={index}
          onChange={(updatedDt) => updateDangToan(dt.id, updatedDt)}
          onRemove={dangToanList.length > 1 ? () => removeDangToan(dt.id) : undefined}
        />
      ))}

      <div className="flex justify-center mt-6">
        <button
          onClick={addDangToan}
          className="px-6 py-3 bg-white rounded-full shadow-[0_4px_20px_rgb(0,0,0,0.08)] flex items-center justify-center hover:shadow-[0_4px_25px_rgb(0,0,0,0.12)] hover:-translate-y-0.5 transition-all duration-200 border border-slate-50 gap-2 font-bold text-primary"
          title="Thêm Dạng Toán mới"
        >
          <Plus className="w-5 h-5 stroke-[3]" /> Thêm Dạng Toán Mới
        </button>
      </div>
    </div>
  )
}
