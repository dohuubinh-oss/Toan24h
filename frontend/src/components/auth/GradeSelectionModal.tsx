'use client'

import React, { useState, useEffect } from 'react'
import { GraduationCap } from 'lucide-react'
import { updateGrade } from '@/lib/authApi'
import { Button } from '../ui/Button'
import { toast } from '@/components/ui/ToastProvider'

export interface GradeSelectionModalProps {
  show?: boolean
}

const GRADES = [
  { id: '5', label: 'Khối 5' },
  { id: '6', label: 'Khối 6' },
  { id: '7', label: 'Khối 7' },
  { id: '8', label: 'Khối 8' },
  { id: '9', label: 'Khối 9' },
  { id: 'chuyen', label: 'Thi chuyên' },
]

export default function GradeSelectionModal({ show }: GradeSelectionModalProps = {}) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedGrade, setSelectedGrade] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (show !== undefined) {
      setIsOpen(show)
      return
    }

    if (typeof document !== 'undefined') {
      const getCookie = (name: string) => {
        const value = `; ${document.cookie}`
        const parts = value.split(`; ${name}=`)
        if (parts.length === 2) return parts.pop()?.split(';').shift()
        return ''
      }

      const role = getCookie('userRole')
      const grade = getCookie('userGrade')

      // Admin and teacher never need to select a grade.
      // Only student without a grade needs to select a grade.
      if (role === 'student' && (!grade || grade.trim() === '')) {
        setIsOpen(true)
      } else {
        setIsOpen(false)
      }
    }
  }, [show])

  if (!isOpen) return null

  const handleSubmit = async () => {
    if (!selectedGrade) {
      toast.error('Vui lòng chọn một khối lớp')
      return
    }

    setIsLoading(true)
    try {
      const res = await updateGrade(selectedGrade)
      const updatedGrade = res?.grade || selectedGrade
      document.cookie = `userGrade=${updatedGrade}; path=/; max-age=31536000` // 1 năm

      if (typeof window !== 'undefined') {
        try {
          const userStr = localStorage.getItem('user')
          const user = userStr ? JSON.parse(userStr) : {}
          user.grade = updatedGrade
          localStorage.setItem('user', JSON.stringify(user))
        } catch (e) {}
      }

      setIsOpen(false)
      window.location.href = `/lectures/lop/${updatedGrade}`
    } catch (error) {
      console.error('Failed to update grade', error)
      toast.error('Có lỗi xảy ra khi cập nhật lớp. Vui lòng thử lại.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="grade-selection-title"
        className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 p-6 sm:p-8 text-center"
      >
        <div className="w-16 h-16 bg-blue-50 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xs">
          <GraduationCap className="w-8 h-8" aria-hidden="true" />
        </div>

        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-primary mb-3">
          Cá nhân hóa học tập
        </span>

        <h2 id="grade-selection-title" className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
          Chào mừng bạn! 🎉
        </h2>
        <p className="text-slate-600 text-sm leading-relaxed max-w-md mx-auto mb-6">
          Vui lòng chọn khối lớp của bạn để chúng tôi có thể cá nhân hóa bài học phù hợp nhất.
        </p>

        <div className="grid grid-cols-3 gap-3 mb-8">
          {GRADES.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => setSelectedGrade(g.id)}
              className={`min-h-[48px] py-3 px-4 rounded-xl border-2 font-bold text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                selectedGrade === g.id
                  ? 'border-primary bg-primary/10 text-primary scale-105 shadow-sm'
                  : 'border-slate-200 text-slate-700 hover:border-primary/50 hover:bg-slate-50'
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>

        <Button
          className="w-full text-base font-bold h-12 rounded-xl shadow-sm"
          disabled={!selectedGrade || isLoading}
          isLoading={isLoading}
          onClick={handleSubmit}
        >
          Bắt đầu học ngay
        </Button>
      </div>
    </div>
  )
}
