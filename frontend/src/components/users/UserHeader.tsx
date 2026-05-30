import React from 'react'
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'

export default function UserHeader({ totalUsers = 0 }: { totalUsers?: number }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
          <Link href="/dashboard" className="hover:text-primary cursor-pointer transition-colors">Trang chủ</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-primary font-bold">Quản lý người dùng</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">
          Danh sách người dùng <span className="text-slate-500 font-normal text-lg">( {totalUsers} người dùng )</span>
        </h1>
      </div>
    </div>
  )
}
