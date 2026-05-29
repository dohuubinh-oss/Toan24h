import React from 'react'
import { CheckCircle } from 'lucide-react'

export default function StudentDailyChallenge() {
  return (
    <div className="bg-gradient-to-br from-indigo-600 to-primary p-6 rounded-2xl text-white shadow-md">
      <div className="flex items-center gap-3 mb-4">
        <CheckCircle size={24} />
        <h4 className="font-bold">Thử thách hàng ngày</h4>
      </div>
      <p className="text-sm text-white/80 mb-4">Hoàn thành 3 bài kiểm tra trắc nghiệm để nhận thêm 500 XP.</p>
      <div className="flex items-center justify-between text-xs mb-2">
        <span>Đã xong 1/3</span>
        <span>33%</span>
      </div>
      <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
        <div className="bg-white h-full" style={{ width: '33%' }}></div>
      </div>
    </div>
  )
}
