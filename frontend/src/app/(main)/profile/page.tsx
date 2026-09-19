'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  User,
  Shield,
  AlertCircle,
  CheckCircle2,
  BookOpen,
  Award,
  Calendar,
  LogOut,
  Sparkles,
  KeyRound,
  Eye,
  EyeOff,
  Lock,
} from 'lucide-react'
import TelegramLoginWidget from '@/components/auth/TelegramLoginWidget'
import { apiFetch } from '@/lib/api'
import { logout } from '@/lib/authApi'
import toast, { Toaster } from 'react-hot-toast'

interface UserProfile {
  id: string
  email: string
  fullName: string
  role: 'student' | 'teacher' | 'admin' | string
  grade?: string
  points?: number
  status?: string
  telegramId?: number
  telegramUsername?: string
  telegramAvt?: string
  expiresAt?: string
  createdAt?: string
}

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdatingGrade, setIsUpdatingGrade] = useState(false)
  const [linkStatus, setLinkStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Change password states
  const [showPasswordSection, setShowPasswordSection] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false)

  // 1. Instant hydration from cached localStorage user
  useEffect(() => {
    try {
      const cached = localStorage.getItem('user')
      if (cached) {
        setUser(JSON.parse(cached))
        setIsLoading(false)
      }
    } catch (_) {}
  }, [])

  // 2. Fetch fresh user data from database /users/me
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await apiFetch('/users/me')
        if (res && res.data) {
          setUser(res.data)
          localStorage.setItem('user', JSON.stringify(res.data))
        } else if (!localStorage.getItem('user')) {
          router.push('/login')
        }
      } catch (e) {
        console.error('Fetch profile error:', e)
        if (!localStorage.getItem('user')) {
          router.push('/login')
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [router])

  // Change grade
  const handleGradeChange = async (newGrade: string) => {
    if (!newGrade || newGrade === user?.grade) return
    setIsUpdatingGrade(true)
    try {
      const res = await apiFetch('/users/me/grade', {
        method: 'PUT',
        body: JSON.stringify({ grade: newGrade }),
      })
      if (res) {
        const updated = { ...user, grade: res.grade || newGrade } as UserProfile
        setUser(updated)
        localStorage.setItem('user', JSON.stringify(updated))
        document.cookie = `userGrade=${newGrade}; path=/; max-age=86400; SameSite=Lax`
        toast.success(`Đã chuyển sang Lớp ${newGrade}`)
      }
    } catch (err: any) {
      toast.error(err.message || 'Không thể cập nhật khối lớp')
    } finally {
      setIsUpdatingGrade(false)
    }
  }

  // Handle Telegram account link
  const handleTelegramSuccess = async (telegramUser: any) => {
    try {
      const tgId =
        telegramUser.telegramId ||
        telegramUser.id ||
        telegramUser.user?.telegramId ||
        telegramUser.user?.id

      const tgUser =
        telegramUser.telegramUsername ||
        telegramUser.username ||
        telegramUser.user?.telegramUsername ||
        ''

      const tgAvt =
        telegramUser.telegramAvt ||
        telegramUser.photo_url ||
        telegramUser.user?.telegramAvt ||
        ''

      const payload = {
        id: tgId,
        telegramId: tgId,
        username: tgUser,
        telegramUsername: tgUser,
        photo_url: tgAvt,
        telegramAvt: tgAvt,
      }

      const res = await apiFetch('/users/me/link-telegram', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      if (res && (res.message || res.status === 'completed' || res.telegramId)) {
        setLinkStatus({ type: 'success', message: 'Liên kết Telegram thành công!' })
        toast.success('Liên kết Telegram thành công!')
        const newRes = await apiFetch('/users/me')
        if (newRes && newRes.data) {
          setUser(newRes.data)
          localStorage.setItem('user', JSON.stringify(newRes.data))
        }
      } else {
        setLinkStatus({ type: 'error', message: res?.error || 'Liên kết thất bại' })
        toast.error(res?.error || 'Liên kết thất bại')
      }
    } catch (e: any) {
      setLinkStatus({ type: 'error', message: e.message || 'Lỗi kết nối máy chủ' })
      toast.error(e.message || 'Lỗi kết nối máy chủ')
    }
  }

  // Handle Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPassword || newPassword.length < 6) {
      toast.error('Mật khẩu mới phải có ít nhất 6 ký tự')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Xác nhận mật khẩu mới không trùng khớp')
      return
    }

    setIsSubmittingPassword(true)
    try {
      const res = await apiFetch('/users/me/password', {
        method: 'PUT',
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      })

      if (res && res.message) {
        toast.success(res.message || 'Đổi mật khẩu thành công!')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        setShowPasswordSection(false)
      } else if (res && res.error) {
        toast.error(res.error)
      }
    } catch (err: any) {
      toast.error(err.message || 'Không thể đổi mật khẩu. Vui lòng kiểm tra lại mật khẩu hiện tại.')
    } finally {
      setIsSubmittingPassword(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    toast.success('Đã đăng xuất')
    router.push('/login')
  }

  if (isLoading && !user) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) return null

  const roleLabelMap: Record<string, { label: string; bg: string; text: string }> = {
    admin: { label: 'Quản trị viên', bg: 'bg-rose-100', text: 'text-rose-700' },
    teacher: { label: 'Giáo viên', bg: 'bg-indigo-100', text: 'text-indigo-700' },
    student: { label: 'Học sinh', bg: 'bg-emerald-100', text: 'text-emerald-700' },
  }
  const roleBadge = roleLabelMap[user.role] || {
    label: user.role,
    bg: 'bg-slate-100',
    text: 'text-slate-700',
  }

  const isVipActive = user.expiresAt && new Date(user.expiresAt) > new Date()
  const isAdminOrTeacher = user.role === 'admin' || user.role === 'teacher'

  // Expiration display text
  const getExpirationText = () => {
    if (isAdminOrTeacher) return 'xxxxx'
    if (user.expiresAt) {
      return new Date(user.expiresAt).toLocaleDateString('vi-VN')
    }
    return 'Chưa kích hoạt'
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6">
      <Toaster position="top-right" />
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Hồ sơ cá nhân</h1>
          <p className="text-sm text-slate-500 mt-1">
            Quản lý thông tin tài khoản, lớp học và liên kết bảo mật
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Đăng xuất</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm mb-8">
        {/* User Header */}
        <div className="flex items-center gap-6 pb-8 border-b border-slate-100 flex-wrap">
          {user.telegramAvt ? (
            <img
              src={user.telegramAvt}
              alt={user.fullName}
              className="w-20 h-20 rounded-full object-cover shadow-sm border-2 border-primary/20 shrink-0"
            />
          ) : (
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-3xl font-black uppercase shrink-0 shadow-md shadow-blue-500/20">
              {user.fullName ? user.fullName.charAt(0) : <User size={40} />}
            </div>
          )}

          <div className="flex-1 min-w-[220px]">
            <div className="flex items-center gap-2.5 flex-wrap mb-1">
              <h2 className="text-2xl font-bold text-slate-900">{user.fullName || 'Người dùng'}</h2>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${roleBadge.bg} ${roleBadge.text}`}
              >
                {roleBadge.label}
              </span>
              {user.grade && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                  Lớp {user.grade}
                </span>
              )}
            </div>
            <p className="text-slate-500 text-sm">{user.email || 'Chưa cập nhật email'}</p>
          </div>

          {/* Account Status Card */}
          <div className="bg-slate-50 border border-slate-200/70 rounded-2xl p-4 flex flex-col gap-2 min-w-[240px]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Gói học:
              </span>
              {isVipActive ? (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                  Đang hoạt động
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
                  Tiêu chuẩn
                </span>
              )}
            </div>
            {user.expiresAt && (
              <div className="text-xs text-slate-600">
                Hạn dùng đến:{' '}
                <span className="font-bold text-slate-900">
                  {new Date(user.expiresAt).toLocaleDateString('vi-VN')}
                </span>
              </div>
            )}

            <button
              onClick={() => router.push('/upgrade')}
              className="mt-1 w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Gia hạn</span>
            </button>
          </div>
        </div>

        {/* User Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-8">
          <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Điểm tích luỹ</p>
              <p className="text-xl font-black text-slate-900">{user.points ?? 0} điểm</p>
            </div>
          </div>

          <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <BookOpen className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 font-medium">Khối lớp</p>
              <div className="flex items-center gap-2 mt-0.5">
                <select
                  value={user.grade || '8'}
                  onChange={(e) => handleGradeChange(e.target.value)}
                  disabled={isUpdatingGrade}
                  className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-sm font-bold text-slate-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="6">Lớp 6</option>
                  <option value="7">Lớp 7</option>
                  <option value="8">Lớp 8</option>
                  <option value="9">Lớp 9</option>
                </select>
                {isUpdatingGrade && <span className="text-[11px] text-blue-500">Đang lưu...</span>}
              </div>
            </div>
          </div>

          <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Hết hạn</p>
              <p className="text-sm font-bold text-slate-800 font-mono tracking-wide">
                {getExpirationText()}
              </p>
            </div>
          </div>
        </div>

        {/* Security & Telegram Linking Section */}
        <div className="space-y-6 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Shield className="text-primary" size={20} />
              Bảo mật & Liên kết
            </h3>
            <button
              type="button"
              onClick={() => setShowPasswordSection(!showPasswordSection)}
              className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors cursor-pointer"
            >
              <KeyRound className="w-4 h-4" />
              <span>{showPasswordSection ? 'Ẩn đổi mật khẩu' : 'Đổi mật khẩu'}</span>
            </button>
          </div>

          {/* Change Password Form (Collapsible) */}
          {showPasswordSection && (
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/80 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-2.5 mb-4">
                <Lock className="w-5 h-5 text-blue-600" />
                <h4 className="font-bold text-slate-900 text-base">Cập nhật Mật khẩu mới</h4>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Mật khẩu hiện tại
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Nhập mật khẩu hiện tại (nếu có)"
                      className="w-full px-3.5 py-2 pr-10 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Mật khẩu mới (tối thiểu 6 ký tự)
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Nhập mật khẩu mới"
                      required
                      minLength={6}
                      className="w-full px-3.5 py-2 pr-10 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Xác nhận mật khẩu mới
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu mới"
                    required
                    minLength={6}
                    className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={isSubmittingPassword}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmittingPassword ? 'Đang cập nhật...' : 'Lưu mật khẩu mới'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPasswordSection(false)}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Telegram Linking Card */}
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/70">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h4 className="font-bold text-slate-900 text-base">Tài khoản Telegram</h4>
                <p className="text-slate-500 text-xs mt-1 max-w-md">
                  Liên kết tài khoản Telegram để đăng nhập nhanh bằng điện thoại, nhận bài tập và thông báo điểm số tự động.
                </p>
              </div>

              <div className="flex-shrink-0 w-full sm:w-auto">
                {user.telegramUsername || user.telegramId ? (
                  <div className="bg-emerald-100 text-emerald-800 px-4 py-2.5 rounded-xl flex items-center gap-2 font-semibold text-sm">
                    <CheckCircle2 size={18} className="text-emerald-600" />
                    <span>
                      Đã liên kết {user.telegramUsername ? `@${user.telegramUsername}` : `(ID: ${user.telegramId})`}
                    </span>
                  </div>
                ) : (
                  <div className="min-w-[240px]">
                    <TelegramLoginWidget
                      botName={process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'toan6789_bot'}
                      onAuthSuccess={handleTelegramSuccess}
                      linkUserId={user.id}
                      buttonText="Liên kết Telegram"
                    />
                  </div>
                )}
              </div>
            </div>

            {linkStatus && (
              <div
                className={`mt-4 p-3 rounded-xl flex items-center gap-2 text-xs font-semibold ${
                  linkStatus.type === 'success'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                {linkStatus.type === 'success' ? (
                  <CheckCircle2 size={16} />
                ) : (
                  <AlertCircle size={16} />
                )}
                {linkStatus.message}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
