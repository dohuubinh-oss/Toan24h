'use client'

import React, { useEffect, useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { createPortal } from 'react-dom'
import { usePathname } from 'next/navigation'
import {
  Bell,
  User,
  ChevronDown,
  LogOut,
  LogIn,
  Settings,
  Menu,
  X,
  Home,
  BookOpen,
  Newspaper,
  FileText,
  Info,
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
  const pathname = usePathname() || '/'
  const [userName, setUserName] = useState('Học viên')
  const [userGrade, setUserGrade] = useState('Toán THCS')
  const [isLoggedState, setIsLoggedState] = useState(isLoggedIn)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const lastNotificationIdRef = useRef<string | null>(null)

  const closeMobileMenu = useCallback(() => {
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
    setIsMobileMenuOpen(false)
  }, [])

  useEffect(() => {
    setMounted(true)
  }, [])

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
    <>
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
        {/* Left: Mobile Hamburger + Logo */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden p-2 -ml-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
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
                className="sm:hidden min-h-[44px] inline-flex items-center justify-center px-4 py-2 rounded-full text-xs font-bold bg-primary text-white shadow-xs hover:bg-primary/90 transition-all"
              >
                Đăng nhập
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>

    {/* Render Mobile SideMenu via React Portal into document.body so no ancestor (like <nav> backdrop-blur or h-20) can clip or constrain it */}
    {mounted && typeof document !== 'undefined' && createPortal(
      <>
        {/* Mobile SideMenu Backdrop */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 z-[99998] bg-black/60 transition-opacity lg:hidden"
            onClick={closeMobileMenu}
            aria-hidden="true"
          />
        )}

        {/* Mobile SideMenu Drawer (Slide in from Left, Full Screen Width, 100% Opaque, Topmost Z-Index) */}
        <div
          className={`fixed inset-0 z-[99999] w-screen h-screen w-full h-full bg-white flex flex-col justify-between transition-transform duration-300 ease-in-out lg:hidden overflow-hidden ${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'
          }`}
          aria-hidden={!isMobileMenuOpen}
          inert={!isMobileMenuOpen}
        >
          {/* Concentric circular ripple motif centered on Avatar radiating down to menu body */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none select-none text-primary"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            aria-hidden="true"
          >
            {/* Subtle glow / wash around the avatar */}
            <circle cx="56" cy="74" r="46" fill="currentColor" fillOpacity="0.08" />

            {/* 1st ripple ring */}
            <circle cx="56" cy="74" r="82" stroke="currentColor" strokeWidth="26" strokeOpacity="0.08" />

            {/* 2nd ripple ring expanding across name and Home */}
            <circle cx="56" cy="74" r="132" stroke="currentColor" strokeWidth="32" strokeOpacity="0.06" />

            {/* 3rd ripple ring sweeping down across Explore & Events */}
            <circle cx="56" cy="74" r="192" stroke="currentColor" strokeWidth="38" strokeOpacity="0.04" />

            {/* 4th ripple ring extending through the menu body */}
            <circle cx="56" cy="74" r="265" stroke="currentColor" strokeWidth="44" strokeOpacity="0.025" />

            {/* 5th outer soft sweep */}
            <circle cx="56" cy="74" r="350" stroke="currentColor" strokeWidth="52" strokeOpacity="0.015" />
          </svg>

          {/* Top Section: Avatar, User Info & Close Button */}
          <div className="relative z-10 pt-10 px-6 shrink-0">
            {/* Close button in top-right */}
            <button
              type="button"
              onClick={closeMobileMenu}
              className="absolute top-8 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer z-20 min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Đóng menu"
            >
              <X size={24} />
            </button>

            {/* User Profile Info with Avatar at center of concentric ripples */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-primary to-blue-500 text-white flex items-center justify-center font-bold text-2xl uppercase shrink-0 shadow-md ring-4 ring-white">
                {isLoggedState && userName ? (
                  getAvatarInitial(userName)
                ) : (
                  <User size={28} />
                )}
              </div>
              <div className="min-w-0 flex-1 pr-8">
                <h2 className="text-xl font-bold text-primary tracking-tight truncate">
                  {isLoggedState ? userName : 'Chào bạn!'}
                </h2>
                <p className="text-xs font-medium text-slate-500 mt-0.5">
                  {isLoggedState ? (userGrade || 'Toán THCS') : 'Học Toán THCS thông minh'}
                </p>
              </div>
            </div>

            {!isLoggedState && (
              <div className="grid grid-cols-2 gap-2.5 mt-5">
                <Link
                  href="/login"
                  onClick={closeMobileMenu}
                  className="py-2.5 px-3 min-h-[44px] flex items-center justify-center text-center text-xs font-bold rounded-xl border border-slate-200 text-slate-700 bg-white/90 hover:bg-slate-50 shadow-xs transition-all"
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/register"
                  onClick={closeMobileMenu}
                  className="py-2.5 px-3 min-h-[44px] flex items-center justify-center text-center text-xs font-bold rounded-xl bg-primary text-white shadow-xs hover:bg-primary/90 transition-all"
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </div>

          {/* Navigation Items: các link có chiều cao cố định 48px, khoảng cách gọn gàng */}
          <div className="relative z-10 flex-1 flex flex-col justify-start gap-1.5 px-6 pt-6 pb-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden overflow-y-auto">
            {[
              { label: 'Trang chủ', href: '/', icon: Home },
              { label: 'Bài giảng', href: '/lectures', icon: BookOpen },
              { label: 'Đề thi', href: '/exams', icon: FileText },
              { label: 'Góc học tập & Blog', href: '/blog', icon: Newspaper },
              ...(isLoggedState
                ? [
                    { label: 'Cài đặt & Tài khoản', href: '/profile', icon: Settings },
                  ]
                : []),
              { label: 'Về toan6789.vn', href: '/blog', icon: Info },
            ].map((item) => {
              const Icon = item.icon
              const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={closeMobileMenu}
                  className={`flex items-center gap-4 h-12 px-3.5 rounded-2xl text-[16px] transition-all ${
                    isActive
                      ? 'text-primary font-bold bg-primary/10'
                      : 'text-slate-700 font-medium hover:text-primary hover:bg-slate-50'
                  }`}
                >
                  <Icon
                    size={22}
                    className={`shrink-0 ${isActive ? 'text-primary' : 'text-slate-600'}`}
                  />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>

          {/* Footer: Sign Out / Sign In cố định góc dưới màn mobile */}
          <div className="relative z-10 px-6 py-5 pb-8 border-t border-slate-100 bg-white shrink-0">
            {isLoggedState ? (
              <button
                type="button"
                onClick={() => {
                  closeMobileMenu()
                  import('@/lib/authApi').then((m) => m.logout())
                }}
                className="flex items-center gap-4 py-2 px-2 w-full text-[16px] font-medium text-slate-700 hover:text-red-600 transition-colors cursor-pointer text-left"
              >
                <LogOut size={22} className="shrink-0 text-slate-600 hover:text-red-600" />
                <span>Đăng xuất tài khoản</span>
              </button>
            ) : (
              <Link
                href="/login"
                onClick={closeMobileMenu}
                className="flex items-center gap-4 py-2 px-2 w-full text-[16px] font-semibold text-primary hover:text-primary/80 transition-colors cursor-pointer"
              >
                <LogIn size={22} className="shrink-0 text-primary" />
                <span>Đăng nhập tài khoản</span>
              </Link>
            )}
          </div>
        </div>
      </>,
      document.body
    )}
  </>
  )
}
