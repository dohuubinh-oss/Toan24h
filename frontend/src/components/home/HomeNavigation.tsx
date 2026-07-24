'use client'

import React from 'react'
import Link from 'next/link'
import { FunctionSquare, Bell, User, ChevronDown, LogOut, Settings } from 'lucide-react'

interface HomeNavigationProps {
  isLoggedIn?: boolean;
}

export default function HomeNavigation({ isLoggedIn = false }: HomeNavigationProps) {
  const [userName, setUserName] = React.useState('Học viên')
  const [userGrade, setUserGrade] = React.useState('Toán THCS')
  const [isLoggedState, setIsLoggedState] = React.useState(isLoggedIn)

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user')
      const token = localStorage.getItem('accessToken') || document.cookie.includes('accessToken')
      if (userStr && token) {
        setIsLoggedState(true)
        try {
          const user = JSON.parse(userStr)
          if (user.fullName) setUserName(user.fullName)
          if (user.role === 'admin') {
            setUserGrade('Admin')
          } else if (user.role === 'teacher') {
            setUserGrade('Teacher')
          } else if (user.grade) {
            setUserGrade(`Toán ${user.grade}`)
          }
        } catch (e) {
          console.error('Failed to parse user from localStorage', e)
        }
      }
    }
  }, [])

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/50">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <FunctionSquare className="text-white w-6 h-6" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-slate-900">
            Math<span className="text-primary">AI</span>
          </span>
        </Link>
        <div className="hidden lg:flex items-center gap-8 font-medium">
          <Link className="hover:text-primary transition-colors text-slate-700" href="/">Trang chủ</Link>
          <Link className="hover:text-primary transition-colors text-slate-700" href="/lectures">Khoá học</Link>
          <Link className="hover:text-primary transition-colors text-slate-700" href="/practices">Luyện thi</Link>
          <Link className="hover:text-primary transition-colors text-slate-700" href="/blog">Blog</Link>
          <Link className="hover:text-primary transition-colors text-slate-700" href="/pricing">Bảng giá</Link>
          <Link className="hover:text-primary transition-colors text-slate-700" href="/community">Cộng đồng</Link>
        </div>
        <div className="flex items-center gap-4">
          {isLoggedState ? (
            <>
              <button className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors text-slate-600 relative">
                <Bell size={20} />
                <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              
              <div className="relative group pl-4 border-l border-slate-200">
                <div className="flex items-center gap-3 cursor-pointer">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold uppercase">
                    {userName ? userName.charAt(0) : <User size={20} />}
                  </div>
                  <div className="hidden md:block">
                    <p className="text-sm font-bold text-slate-800 group-hover:text-primary transition-colors">{userName}</p>
                    <p className="text-xs text-slate-500">{userGrade}</p>
                  </div>
                  <ChevronDown size={16} className="text-slate-400 group-hover:text-primary transition-colors" />
                </div>

                {/* Dropdown Menu */}
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 translate-y-2 group-hover:translate-y-0">
                  <Link 
                    href="/profile" 
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-primary transition-colors"
                  >
                    <Settings size={16} />
                    Sửa thông tin
                  </Link>
                  <button 
                    onClick={() => {
                      import('@/lib/authApi').then(m => m.logout())
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={16} />
                    Thoát
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <Link 
                href="/login"
                className="px-6 py-2.5 rounded-full font-semibold border-2 border-slate-200 text-slate-700 hover:border-primary/30 hover:bg-primary/5 transition-all"
              >
                Đăng nhập
              </Link>
              <Link 
                href="/dashboard"
                className="px-6 py-2.5 rounded-full font-semibold bg-primary text-white shadow-lg shadow-primary/20 hover:scale-105 transition-all"
              >
                Học ngay
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
