'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { FunctionSquare, Bell, User, ChevronDown, LogOut, Settings } from 'lucide-react'
import toast from 'react-hot-toast'

interface HomeNavigationProps {
  isLoggedIn?: boolean;
}

interface Notification {
  id: string
  title: string
  message: string
  link: string
  isRead: boolean
}

export default function HomeNavigation({ isLoggedIn = false }: HomeNavigationProps) {
  const [userName, setUserName] = useState('Học viên')
  const [userGrade, setUserGrade] = useState('Toán THCS')
  const [isLoggedState, setIsLoggedState] = useState(isLoggedIn)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [lastNotificationId, setLastNotificationId] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user')
      const isLoggedIn = document.cookie.includes('userRole=')
      if (userStr && isLoggedIn) {
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

  useEffect(() => {
    if (!isLoggedState) return
    let interval: NodeJS.Timeout

    const fetchNotifications = async () => {
      try {
        const res = await fetch('http://localhost:8080/api/v1/notifications', {
          headers: {
            'Content-Type': 'application/json'
          }
        })
        const data = await res.json()
        if (data && data.status === 'success' && data.data) {
          setNotifications(data.data)
          
          // Check for new notifications
          if (data.data.length > 0) {
            const latest = data.data[0]
            if (!latest.isRead && lastNotificationId !== latest.id.toString()) {
              setLastNotificationId(latest.id.toString())
              toast.success(
                (t) => (
                  <span className="flex flex-col gap-1">
                    <span><b>Zalo giả lập:</b> {latest.title} - Bài thi của bạn đã được AI chấm xong.</span>
                    <Link href={latest.link} className="text-primary underline text-sm font-semibold" onClick={() => toast.dismiss(t.id)}>
                      Nhấn link để xem chi tiết kết quả.
                    </Link>
                  </span>
                ),
                { duration: 10000 }
              )
            }
          }
        }
      } catch (e) {
        console.error('Failed to fetch notifications', e)
      }
    }

    fetchNotifications()
    interval = setInterval(fetchNotifications, 30 * 60 * 1000) // 30 minutes

    return () => clearInterval(interval)
  }, [isLoggedState, lastNotificationId])

  const unreadCount = notifications.filter(n => !n.isRead).length
  const notificationRef = React.useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
    }
    if (showNotifications) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showNotifications])

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
              <div className="relative" ref={notificationRef}>
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors text-slate-600 relative"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-100 z-50">
                    <div className="flex items-center justify-between p-4 border-b border-slate-100">
                      <h3 className="font-semibold text-slate-800">Thông báo</h3>
                      {notifications.length > 0 && (
                        <button 
                          onClick={async () => {
                            try {
                              await fetch(`http://localhost:8080/api/v1/notifications`, { method: 'DELETE' })
                              setNotifications([])
                            } catch (err) {
                              console.error('Failed to delete all notifications', err)
                            }
                          }}
                          className="text-xs text-red-500 hover:text-red-700 font-medium"
                        >
                          Xóa tất cả
                        </button>
                      )}
                    </div>
                    
                    <div className="max-h-[320px] overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">
                          <Bell className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                          <p>Chưa có thông báo nào</p>
                        </div>
                      ) : (
                        notifications.map(n => {
                          const isResultLink = n.link?.includes('/result')
                          
                          const handleNotificationClick = () => {
                            if (!isResultLink) {
                              setShowNotifications(false)
                            }
                            if (!n.isRead) {
                              fetch(`http://localhost:8080/api/v1/notifications/${n.id}/read`, { method: 'POST' })
                                .then(() => {
                                  setNotifications(notifications.map(notif => notif.id === n.id ? { ...notif, isRead: true } : notif))
                                })
                            }
                          }

                          const className = `block px-4 py-3 hover:bg-slate-50 border-b border-slate-50 last:border-0 relative ${!n.isRead ? 'bg-blue-50/50' : ''}`

                          if (isResultLink) {
                            return (
                              <Link href={n.link} key={n.id} className={className} onClick={handleNotificationClick}>
                                <div className="pr-6">
                                  <p className={`text-sm ${!n.isRead ? 'font-semibold text-slate-800' : 'text-slate-600'}`}>{n.title}</p>
                                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{n.message}</p>
                                </div>
                              </Link>
                            )
                          } else {
                            return (
                              <button key={n.id} className={`w-full text-left ${className}`} onClick={handleNotificationClick}>
                                <div className="pr-6">
                                  <p className={`text-sm ${!n.isRead ? 'font-semibold text-slate-800' : 'text-slate-600'}`}>{n.title}</p>
                                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{n.message}</p>
                                </div>
                              </button>
                            )
                          }
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
              
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
