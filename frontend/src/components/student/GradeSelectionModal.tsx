'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { updateGrade } from '@/lib/authApi'

interface GradeSelectionModalProps {
  show: boolean
}

export default function GradeSelectionModal({ show }: GradeSelectionModalProps) {
  const router = useRouter()
  const [selectedGrade, setSelectedGrade] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')

  if (!show) return null

  const grades = [
    { id: '5', label: 'Lớp 5' },
    { id: '6', label: 'Lớp 6' },
    { id: '7', label: 'Lớp 7' },
    { id: '8', label: 'Lớp 8' },
    { id: '9', label: 'Lớp 9' },
    { id: 'chuyen', label: 'Thi chuyên' },
  ]

  const handleConfirm = async () => {
    if (!selectedGrade) {
      setError('Vui lòng chọn một khối lớp')
      return
    }

    setIsLoading(true)
    setError('')
    try {
      await updateGrade(selectedGrade)
      
      // Update local storage if needed
      const userStr = localStorage.getItem('user')
      if (userStr) {
        try {
          const user = JSON.parse(userStr)
          user.grade = selectedGrade
          localStorage.setItem('user', JSON.stringify(user))
        } catch (e) {}
      }

      // Force a full page reload to ensure cookies are read properly by the server
      window.location.href = `/lectures/lop/${selectedGrade}`
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra, vui lòng thử lại sau.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 text-center border-b border-slate-100">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Chọn khối lớp của bạn</h2>
          <p className="text-slate-500 mt-2">
            Vui lòng chọn khối lớp hiện tại để chúng tôi chuẩn bị bài học phù hợp nhất.
            <br/>
            <span className="text-orange-500 text-sm font-medium mt-1 block">Lưu ý: Không thể tự ý thay đổi sau khi đã xác nhận.</span>
          </p>
        </div>

        <div className="p-6 overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
              {error}
            </div>
          )}
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {grades.map((grade) => (
              <button
                key={grade.id}
                onClick={() => setSelectedGrade(grade.id)}
                className={`py-3 px-2 rounded-xl border-2 transition-all duration-200 font-semibold ${
                  selectedGrade === grade.id
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {grade.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
          <Button
            onClick={handleConfirm}
            isLoading={isLoading}
            disabled={!selectedGrade || isLoading}
            className="w-full sm:w-auto"
          >
            Xác nhận
          </Button>
        </div>
      </div>
    </div>
  )
}
