'use client'

import React, { useState, useEffect } from 'react'
import { X, Search, BookOpen } from 'lucide-react'
import { apiFetch } from '@/lib/api'

interface Lecture {
  id: string;
  title: string;
  grade: string;
  category: string;
}

interface LectureSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (lecture: Lecture) => void;
}

export default function LectureSelectorModal({ isOpen, onClose, onSelect }: LectureSelectorModalProps) {
  const [lectures, setLectures] = useState<Lecture[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true)
      apiFetch('/lectures')
        .then(res => {
          if (res.data) {
            setLectures(res.data)
          }
        })
        .catch(console.error)
        .finally(() => setIsLoading(false))
    }
  }, [isOpen])

  if (!isOpen) return null

  const filteredLectures = lectures.filter(l => 
    l.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    l.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
            <BookOpen className="text-primary w-5 h-5" />
            Chọn bài giảng liên kết
          </h3>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Tìm kiếm bài giảng..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 h-11 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            />
          </div>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="py-8 text-center text-slate-500">Đang tải danh sách bài giảng...</div>
          ) : filteredLectures.length === 0 ? (
            <div className="py-8 text-center text-slate-500">Không tìm thấy bài giảng nào.</div>
          ) : (
            <div className="space-y-2">
              {filteredLectures.map(lecture => (
                <div
                  key={lecture.id}
                  onClick={() => {
                    onSelect(lecture)
                    onClose()
                  }}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 border border-slate-100 hover:border-primary/30 cursor-pointer transition-all group"
                >
                  <div className="flex-1">
                    <p className="text-[15px] font-medium text-slate-800 leading-tight group-hover:text-primary transition-colors">
                      {lecture.title}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">Lớp {lecture.grade} • {lecture.category}</p>
                  </div>
                  <div className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full group-hover:bg-primary/10 group-hover:text-primary transition-colors">
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
