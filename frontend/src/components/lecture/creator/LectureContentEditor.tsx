'use client'
import React, { useState } from 'react'
import { Plus } from 'lucide-react'
import LectureMediaCard from './LectureMediaCard'
import { useLectureCreator } from './LectureCreatorContext'
import DangToanCard from './DangToanCard'
import { toast } from '@/components/ui/ToastProvider'
import { parseLectureJson } from './utils/lectureJsonParser'
import JsonInputCard from '@/components/common/JsonInputCard'
import AiLectureExtractModal from './AiLectureExtractModal'

const LECTURE_JSON_HINT = `[
  {
    "mathType": "Dạng 1. Nhận biết đơn thức",
    "methods": [
      {
        "solution": "Đơn thức là biểu thức đại số...",
        "problems": [
          {
            "problem": "Ví dụ 1...",
            "steps": [
              { "step": 1, "title": "Bước 1", "content": "...", "formula": "x = 1" }
            ],
            "conclusion": "..."
          }
        ]
      }
    ]
  }
]`

export default function LectureContentEditor() {
  const { 
    contentType, 
    dangToanList, 
    setDangToanList,
    removeDangToan 
  } = useLectureCreator()
  const [isAiModalOpen, setIsAiModalOpen] = useState(false)
  const [extractedJson, setExtractedJson] = useState('')

  const handleProcessJson = (jsonString: string) => {
    const parsedList = parseLectureJson(jsonString)
    setDangToanList(parsedList)
    toast.success(`Đã nhập thành công ${parsedList.length} dạng toán!`)
  }

  const handleAiExtracted = (jsonString: string) => {
    setExtractedJson(jsonString)
    const parsedList = parseLectureJson(jsonString)
    setDangToanList(parsedList)
    toast.success(`Đã bóc tách thành công ${parsedList.length} dạng toán từ ảnh bài giảng!`)
  }

  const addDangToan = () => {
    setDangToanList([
      ...dangToanList, 
      { 
        id: Math.random().toString(36).substr(2, 9), 
        mathType: '', 
        methods: [
          { id: Math.random().toString(36).substr(2, 9), methodName: '', solution: '', exercise: null, problemImage: null, solutionImage: null }
        ] 
      }
    ])
  }

  const updateDangToan = (id: string, updatedDt: any) => {
    setDangToanList(dangToanList.map(dt => dt.id === id ? updatedDt : dt))
  }

  return (
    <div className="space-y-6">
      <div className={`space-y-6 transition-opacity duration-300 ${
        contentType === 'practice' ? 'opacity-35 pointer-events-none select-none filter grayscale-[30%]' : ''
      }`}>
        <LectureMediaCard />

        <div className="mb-2">
          <h2 className="text-xl font-bold text-slate-800">2. Phân tích bài tập mẫu</h2>
        </div>

        <JsonInputCard
          title="Nhập nhanh bằng JSON"
          badge="Thông minh"
          placeholder={LECTURE_JSON_HINT}
          buttonText="Xử lý JSON"
          onProcess={handleProcessJson}
          onAiExtract={() => setIsAiModalOpen(true)}
          aiButtonText="Tải ảnh Dạng toán/ Ví dụ mẫu"
          initialValue={extractedJson}
          disabled={contentType === 'practice'}
        />

        {dangToanList.length === 0 && (
          <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
            <p className="text-sm font-medium text-slate-500">
              Chưa có bài tập mẫu nào (không bắt buộc). Bạn có thể bấm nút bên dưới để thêm Dạng toán.
            </p>
          </div>
        )}

        {dangToanList.map((dt, index) => (
          <DangToanCard
            key={dt.id}
            dangToan={dt}
            index={index}
            onChange={(updatedDt) => updateDangToan(dt.id, updatedDt)}
            onRemove={() => removeDangToan(dt.id)}
          />
        ))}

        <div className="flex justify-center mt-6">
          <button
            onClick={addDangToan}
            disabled={contentType === 'practice'}
            className="px-6 py-3 bg-white rounded-full shadow-[0_4px_20px_rgb(0,0,0,0.08)] flex items-center justify-center hover:shadow-[0_4px_25px_rgb(0,0,0,0.12)] hover:-translate-y-0.5 transition-all duration-200 border border-slate-50 gap-2 font-bold text-primary disabled:opacity-50"
            title="Thêm Dạng Toán mới"
          >
            <Plus className="w-5 h-5 stroke-[3]" /> Thêm Dạng Toán Mới
          </button>
        </div>
      </div>

      {/* AI Lecture Extract Modal */}
      <AiLectureExtractModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onExtracted={handleAiExtracted}
      />
    </div>
  )
}
