'use client'

import React, { useState, useEffect } from 'react'
import { X, Search, BookOpen, Loader2 } from 'lucide-react'
import { apiFetch } from '@/lib/api'

interface Lecture {
  id: string
  title: string
  grade: string
  category: string
}

interface LectureSelectorModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (lecture: Lecture) => void
  grade?: string
}

export default function LectureSelectorModal({ isOpen, onClose, onSelect, grade }: LectureSelectorModalProps) {
  const [lectures, setLectures] = useState<Lecture[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>('all')

  useEffect(() => {
    if (isOpen) {
      if (grade) {
        setSelectedGradeFilter(grade)
      } else {
        setSelectedGradeFilter('all')
      }
      setIsLoading(true)
      apiFetch('/lectures')
        .then((res) => {
          if (res.data) {
            setLectures(res.data)
          }
        })
        .catch(console.error)
        .finally(() => setIsLoading(false))
    }
  }, [isOpen, grade])

  if (!isOpen) return null

  const filteredLectures = lectures.filter((l) => {
    const matchSearch =
      l.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.category.toLowerCase().includes(searchTerm.toLowerCase())
    const matchGrade = selectedGradeFilter === 'all' || String(l.grade) === String(selectedGradeFilter)
    return matchSearch && matchGrade
  })

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="lecture-selector-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 font-sans"
    >
      <div 
        className="fixed inset-0" 
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-primary border border-blue-100 flex items-center justify-center shrink-0 shadow-xs">
              <BookOpen className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h3 id="lecture-selector-title" className="font-bold text-base sm:text-lg text-slate-900 leading-tight">
                Chọn bài giảng liên kết
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Gắn nội dung lý thuyết và dạng bài bổ trợ vào đề thi
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            aria-label="Đóng hộp thoại"
            className="min-w-[40px] min-h-[40px] text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Toolbar & Filter */}
        <div className="p-4 sm:p-5 border-b border-slate-100 space-y-3 bg-white">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
            <input
              type="text"
              placeholder="Tìm kiếm bài giảng theo tên, chuyên đề..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 h-11 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm text-slate-800 placeholder-slate-400 bg-slate-50/60 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-slate-500 font-semibold shrink-0 mr-1">Khối lớp:</span>
            {[
              { id: 'all', label: 'Tất cả' },
              { id: '5', label: 'Lớp 5' },
              { id: '6', label: 'Lớp 6' },
              { id: '7', label: 'Lớp 7' },
              { id: '8', label: 'Lớp 8' },
              { id: '9', label: 'Lớp 9' },
              { id: '12', label: 'Lớp 12' },
              { id: 'chuyen_cap', label: 'Chuyển cấp' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedGradeFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer text-xs ${
                  selectedGradeFilter === tab.id
                    ? 'bg-primary text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* List Content */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-500">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="text-xs font-medium">Đang tải danh sách bài giảng...</span>
            </div>
          ) : filteredLectures.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              Không tìm thấy bài giảng nào phù hợp bộ lọc.
            </div>
          ) : (
            <div className="space-y-2">
              {filteredLectures.map((lecture) => (
                <div
                  key={lecture.id}
                  onClick={() => {
                    onSelect(lecture)
                    onClose()
                  }}
                  className="flex items-center gap-3 p-3.5 rounded-2xl hover:bg-blue-50/50 border border-slate-200/80 hover:border-primary/40 cursor-pointer transition-all group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors truncate">
                      {lecture.title}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Lớp {lecture.grade} • {lecture.category}
                    </p>
                  </div>
                  <div className="px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl group-hover:bg-primary group-hover:text-white transition-all shrink-0">
                    Chọn
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
