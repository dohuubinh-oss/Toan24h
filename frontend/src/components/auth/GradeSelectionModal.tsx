'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { updateGrade } from '@/lib/authApi'
import { Button } from '../ui/Button'
import { toast } from '@/components/ui/ToastProvider'

const GRADES = ['5', '6', '7', '8', '9']

export default function GradeSelectionModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedGrade, setSelectedGrade] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check cookies
    if (typeof document !== 'undefined') {
      const getCookie = (name: string) => {
        const value = `; ${document.cookie}`
        const parts = value.split(`; ${name}=`)
        if (parts.length === 2) return parts.pop()?.split(';').shift()
        return ''
      }
      
      const role = getCookie('userRole')
      const grade = getCookie('userGrade')
      
      // Admin and teacher NEVER need to select a grade.
      // Only student without a grade needs to select a grade.
      if (role === 'student' && (!grade || grade.trim() === '')) {
        setIsOpen(true)
      } else {
        setIsOpen(false)
      }
    }
  }, [])

  if (!isOpen) return null

  const handleSubmit = async () => {
    if (!selectedGrade) return

    setIsLoading(true)
    try {
      const res = await updateGrade(selectedGrade)
      
      const updatedGrade = res.grade || selectedGrade
      document.cookie = `userGrade=${updatedGrade}; path=/; max-age=86400`
      
      const userStr = localStorage.getItem('user')
      if (userStr) {
        try {
          const user = JSON.parse(userStr)
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Chào mừng bạn! 🎉</h2>
            <p className="text-slate-500">Vui lòng chọn khối lớp của bạn để chúng tôi có thể cá nhân hóa bài học phù hợp nhất.</p>
          </div>
          
          <div className="grid grid-cols-3 gap-3 mb-8">
            {GRADES.map((g) => (
              <button
                key={g}
                onClick={() => setSelectedGrade(g)}
                className={`py-3 px-4 rounded-xl border-2 font-bold transition-all ${
                  selectedGrade === g 
                    ? 'border-primary bg-primary/10 text-primary scale-105 shadow-sm' 
                    : 'border-slate-200 text-slate-600 hover:border-primary/50 hover:bg-slate-50'
                }`}
              >
                Khối {g}
              </button>
            ))}
          </div>
          
          <Button 
            className="w-full text-lg h-12" 
            disabled={!selectedGrade || isLoading}
            isLoading={isLoading}
            onClick={handleSubmit}
          >
            Bắt đầu học ngay
          </Button>
        </div>
      </div>
    </div>
  )
}
