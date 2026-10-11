'use client'
import React, { useState } from 'react'
import { Plus, AlertCircle, Code } from 'lucide-react'
import LectureMediaCard from './LectureMediaCard'
import { useLectureCreator } from './LectureCreatorContext'
import DangToanCard from './DangToanCard'
import { Button } from '../../ui/Button'
import { toast } from '@/components/ui/ToastProvider'
import { parseLectureJson } from './utils/lectureJsonParser'

export default function LectureContentEditor() {
  const { 
    contentType,
    dangToanList,
    setDangToanList,
    removeDangToan
  } = useLectureCreator()

  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false)
  const [jsonInput, setJsonInput] = useState('')
  const [jsonError, setJsonError] = useState('')

  const handleImportJson = () => {
    try {
      setJsonError('')
      const parsedList = parseLectureJson(jsonInput)
      setDangToanList(parsedList)
      setIsJsonModalOpen(false)
      setJsonInput('')
      toast.success(`Đã nhập thành công ${parsedList.length} dạng toán!`)
    } catch (err: any) {
      setJsonError(err.message || 'JSON không hợp lệ')
    }
  }

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
      <div className={`space-y-6 transition-opacity duration-300 ${
        contentType === 'practice' ? 'opacity-35 pointer-events-none select-none filter grayscale-[30%]' : ''
      }`}>
        <LectureMediaCard />

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-800">2. Phân tích bài tập mẫu</h2>
          <Button
            variant="outline"
            onClick={() => setIsJsonModalOpen(true)}
            disabled={contentType === 'practice'}
            className="border-slate-300 hover:border-primary hover:text-primary transition-colors text-xs font-semibold h-8 px-3 bg-white shadow-sm flex items-center gap-1.5"
            title="Nhập toàn bộ các Dạng toán từ file JSON"
          >
            <Code className="w-3.5 h-3.5" />
            Nhập JSON
          </Button>
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
            disabled={contentType === 'practice'}
            className="px-6 py-3 bg-white rounded-full shadow-[0_4px_20px_rgb(0,0,0,0.08)] flex items-center justify-center hover:shadow-[0_4px_25px_rgb(0,0,0,0.12)] hover:-translate-y-0.5 transition-all duration-200 border border-slate-50 gap-2 font-bold text-primary disabled:opacity-50"
            title="Thêm Dạng Toán mới"
          >
            <Plus className="w-5 h-5 stroke-[3]" /> Thêm Dạng Toán Mới
          </button>
        </div>
      </div>

      {/* Global Batch JSON Modal */}
      {isJsonModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col border-0">
            <div className="p-5 flex items-center justify-between bg-white border-b border-slate-100">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Code className="w-5 h-5 text-primary" />
                Nhập danh sách Dạng toán từ JSON
              </h3>
              <button 
                onClick={() => setIsJsonModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 bg-white">
              <p className="text-xs text-slate-500 mb-3">
                Dán mảng JSON chứa các Dạng toán và ví dụ mẫu. Hệ thống sẽ tự động bóc tách thành các Dạng toán, Phương pháp giải và Bài tập mẫu tương ứng.
              </p>
              <textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                className="w-full h-72 p-4 rounded-xl border border-slate-200 font-mono text-xs bg-slate-50 focus:bg-slate-50 focus:border-primary/40 focus:ring-4 focus:ring-primary/5 focus:outline-none transition-all resize-none whitespace-pre"
                placeholder={`[
  {
    "mathType": "Dạng 1. Nhận biết đơn thức",
    "Solution": "Đơn thức là biểu thức đại số...",
    "exams": [
      {
        "problem": "Ví dụ 1...",
        "steps": [
          { "step": 1, "title": "Bước 1", "content": "...", "formula": "x = 1" }
        ],
        "conclusion": "..."
      }
    ]
  }
]`}
              />
              {jsonError && (
                <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="text-red-500 text-sm font-medium">{jsonError}</div>
                </div>
              )}
            </div>

            <div className="p-5 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <Button
                variant="ghost"
                onClick={() => setIsJsonModalOpen(false)}
                className="text-slate-600 hover:bg-slate-200/60"
              >
                Hủy bỏ
              </Button>
              <Button
                variant="primary"
                onClick={handleImportJson}
                className="bg-primary hover:bg-primary-dark text-white px-6 shadow-sm"
              >
                Xác nhận nhập
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
