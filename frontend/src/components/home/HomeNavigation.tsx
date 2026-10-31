'use client'

import React, { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import {
  Bell,
  User,
  ChevronDown,
  LogOut,
  Settings,
  Menu,
  X,
  Home,
  BookOpen,
  Newspaper,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { apiFetch } from '@/lib/api'
import { getAvatarInitial } from '@/lib/utils'
import Logo from '@/components/common/Logo'

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const lastNotificationIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isMobileMenuOpen])

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
      } else {
        setIsLoggedState(false)
      }
    }
  }, [])

  useEffect(() => {
    if (!isLoggedState) return
    let interval: NodeJS.Timeout

    const fetchNotifications = async () => {
      try {
        const data = await apiFetch('/notifications')
        if (data && data.status === 'success' && data.data) {
          setNotifications(data.data)

          // Check for new notifications
          if (data.data.length > 0) {
            const latest = data.data[0]
            if (!latest.isRead && lastNotificationIdRef.current !== latest.id.toString()) {
              lastNotificationIdRef.current = latest.id.toString()
              toast.success(
                (t) => (
                  <span className="flex flex-col gap-1">
                    <span><b>Thông báo mới:</b> {latest.title} - {latest.message}</span>
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
      } catch (e: any) {
        if (e?.message?.includes('401') || e?.message?.includes('Unauthorized')) {
          setIsLoggedState(false)
        }
        console.error('Failed to fetch notifications', e)
      }
    }

    fetchNotifications()
    interval = setInterval(fetchNotifications, 30 * 60 * 1000) // 30 minutes

    return () => clearInterval(interval)
  }, [isLoggedState])

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
        {/* Left: Mobile Hamburger + Logo */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden p-2 -ml-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Mở menu điều hướng"
          >
            <Menu size={24} />
          </button>
          <Link href="/" className="flex items-center">
            <Logo size="md" />
          </Link>
        </div>

        {/* Center: Desktop Nav Links */}
        <div className="hidden lg:flex items-center gap-8 font-medium">
          <Link className="hover:text-primary transition-colors text-slate-700" href="/">Trang chủ</Link>
          <Link className="hover:text-primary transition-colors text-slate-700" href="/lectures">Bài giảng</Link>
          <Link className="hover:text-primary transition-colors text-slate-700" href="/blog">Blog</Link>
        </div>

        {/* Right: Notification & Profile / Auth */}
        <div className="flex items-center gap-3 sm:gap-4">
          {isLoggedState ? (
            <>
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors text-slate-600 relative cursor-pointer"
                  aria-label="Thông báo"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                </button>

                {showNotifications && (
                  <div className="fixed inset-x-4 top-20 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full mt-2 sm:w-80 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden max-w-sm mx-auto sm:max-w-none">
                    <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/60">
                      <h3 className="font-bold text-sm text-slate-800">Thông báo</h3>
                      {notifications.length > 0 && (
                        <button
                          onClick={async () => {
                            try {
                              await apiFetch('/notifications', { method: 'DELETE' })
                              setNotifications([])
                            } catch (err) {
                              console.error('Failed to delete all notifications', err)
                            }
                          }}
                          className="text-xs text-red-500 hover:text-red-700 font-medium cursor-pointer"
                        >
                          Xóa tất cả
                        </button>
                      )}
                    </div>

                    <div className="max-h-[320px] overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">
                          <Bell className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                          <p className="text-sm">Chưa có thông báo nào</p>
                        </div>
                      ) : (
                        notifications.map(n => {
                          const isResultLink = n.link?.includes('/result')

                          const handleNotificationClick = () => {
                            if (!isResultLink) {
                              setShowNotifications(false)
                            }
                            if (!n.isRead) {
                              apiFetch(`/notifications/${n.id}/read`, { method: 'POST' })
                                .then(() => {
                                  setNotifications(notifications.map(notif => notif.id === n.id ? { ...notif, isRead: true } : notif))
                                })
                                .catch(err => console.error('Failed to mark read', err))
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

              <div className="relative group pl-3 sm:pl-4 border-l border-slate-200">
                <div className="flex items-center gap-3 cursor-pointer">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold uppercase shrink-0 border border-primary/20">
                    {userName ? getAvatarInitial(userName) : <User size={20} />}
                  </div>
                  <div className="hidden md:block">
                    <p className="text-sm font-bold text-slate-800 group-hover:text-primary transition-colors">{userName}</p>
                    <p className="text-xs text-slate-500">{userGrade}</p>
                  </div>
                  <ChevronDown size={16} className="text-slate-400 group-hover:text-primary transition-colors hidden sm:block" />
                </div>

                {/* Dropdown Menu Desktop */}
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
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <LogOut size={16} />
                    Thoát
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="hidden sm:flex items-center gap-3">
                <Link
                  href="/login"
                  className="px-5 py-2 rounded-full font-semibold border-2 border-slate-200 text-slate-700 hover:border-primary/30 hover:bg-primary/5 transition-all text-sm"
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/dashboard"
                  className="px-5 py-2 rounded-full font-semibold bg-primary text-white shadow-md shadow-primary/20 hover:scale-102 transition-all text-sm"
                >
                  Học ngay
                </Link>
              </div>
              <Link
                href="/login"
                className="sm:hidden px-3.5 py-1.5 rounded-full text-xs font-bold bg-primary text-white shadow-xs hover:bg-primary/90 transition-all"
              >
                Đăng nhập
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Mobile SideMenu Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs transition-opacity lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile SideMenu Drawer (Slide in from Left) */}
      <div
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 max-w-[85vw] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out lg:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-100">
          <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center">
            <Logo size="sm" />
          </Link>
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Đóng menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* User Card in Drawer */}
        <div className="p-4 bg-slate-50 border-b border-slate-100">
          {isLoggedState ? (
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-base uppercase shrink-0 border border-primary/20">
                {userName ? getAvatarInitial(userName) : <User size={20} />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-900 truncate">{userName}</p>
                <p className="text-xs text-primary font-medium">{userGrade}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-slate-500 font-medium">Học Toán THCS thông minh</p>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="py-2 px-3 text-center text-xs font-bold rounded-xl border border-slate-200 text-slate-700 hover:bg-white transition-all"
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="py-2 px-3 text-center text-xs font-bold rounded-xl bg-primary text-white shadow-xs hover:bg-primary/90 transition-all"
                >
                  Đăng ký
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Nav Links with Icons */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1.5">
          <Link
            href="/"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold text-slate-700 hover:bg-primary/10 hover:text-primary transition-colors"
          >
            <Home size={18} className="text-slate-400" />
            <span>Trang chủ</span>
          </Link>
          <Link
            href="/lectures"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold text-slate-700 hover:bg-primary/10 hover:text-primary transition-colors"
          >
            <BookOpen size={18} className="text-slate-400" />
            <span>Bài giảng lý thuyết</span>
          </Link>
          <Link
            href="/blog"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold text-slate-700 hover:bg-primary/10 hover:text-primary transition-colors"
          >
            <Newspaper size={18} className="text-slate-400" />
            <span>Góc học tập & Blog</span>
          </Link>
          {isLoggedState && (
            <Link
              href="/profile"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold text-slate-700 hover:bg-primary/10 hover:text-primary transition-colors"
            >
              <User size={18} className="text-slate-400" />
              <span>Trang cá nhân & Cài đặt</span>
            </Link>
          )}
        </div>

        {/* Footer with Logout */}
        {isLoggedState && (
          <div className="p-4 border-t border-slate-100 bg-slate-50/50">
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false)
                import('@/lib/authApi').then(m => m.logout())
              }}
              className="flex items-center gap-2.5 w-full px-3.5 py-2.5 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
            >
              <LogOut size={18} />
              <span>Đăng xuất tài khoản</span>
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}
