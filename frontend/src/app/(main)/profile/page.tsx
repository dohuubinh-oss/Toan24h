'use client'

import React, { useEffect, useState, useRef } from 'react'
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
  Camera,
  Loader2,
  GraduationCap,
  Users,
  Unlink,
  Gift,
  Copy,
  Check,
  Share2,
  Percent,
  Coins,
} from 'lucide-react'
import TelegramLoginWidget from '@/components/auth/TelegramLoginWidget'
import { apiFetch, uploadUserAvatar } from '@/lib/api'
import { logout } from '@/lib/authApi'
import { getAvatarInitial } from '@/lib/utils'
import toast, { Toaster } from 'react-hot-toast'

interface UserProfile {
  id: string
  email: string
  fullName: string
  role: 'student' | 'teacher' | 'admin' | 'affiliate' | string
  grade?: string
  points?: number
  status?: string
  telegramId?: number
  telegramUsername?: string
  telegramAvt?: string
  telegramId2?: number
  telegramUsername2?: string
  telegramAvt2?: string
  expiresAt?: string
  referralCode?: string
  commissionBalance?: number
  totalCommissionReceived?: number
  createdAt?: string
}

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [linkStatus, setLinkStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Change password states (inline row)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Referral / Affiliate copy states
  const [copiedCode, setCopiedCode] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  const handleCopyCode = async () => {
    if (!user?.referralCode) return
    try {
      await navigator.clipboard.writeText(user.referralCode)
      setCopiedCode(true)
      toast.success('Đã sao chép mã giới thiệu!')
      setTimeout(() => setCopiedCode(false), 2000)
    } catch {
      toast.error('Không thể sao chép mã')
    }
  }

  const handleCopyLink = async () => {
    if (!user?.referralCode) return
    const origin = typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'https://toan6789.vn'
    const link = `${origin}/register?ref=${user.referralCode}`
    try {
      await navigator.clipboard.writeText(link)
      setCopiedLink(true)
      toast.success('Đã sao chép link đăng ký!')
      setTimeout(() => setCopiedLink(false), 2000)
    } catch {
      toast.error('Không thể sao chép link')
    }
  }

  const handleAvatarFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Max 5MB, images only
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file hình ảnh (JPG, PNG, WEBP, GIF)')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Dung lượng ảnh tối đa là 5MB')
      return
    }

    setIsUploadingAvatar(true)
    try {
      const avatarUrl = await uploadUserAvatar(file)
      if (avatarUrl && user) {
        const updated = { ...user, telegramAvt: avatarUrl }
        setUser(updated)
        localStorage.setItem('user', JSON.stringify(updated))
        toast.success('Cập nhật ảnh đại diện thành công!')
      }
    } catch (err: any) {
      console.error('Avatar upload error:', err)
      toast.error(err.message || 'Không thể tải lên ảnh đại diện')
    } finally {
      setIsUploadingAvatar(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

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

  // Handle Telegram account link for slot 1 (Học sinh) or slot 2 (Phụ huynh)
  const handleTelegramSuccess = async (telegramUser: any, slot: 1 | 2 = 1) => {
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
        slot,
      }

      const res = await apiFetch('/users/me/link-telegram', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      if (res && (res.message || res.status === 'completed' || res.telegramId)) {
        toast.success(`Liên kết Telegram ${slot === 2 ? 'Phụ huynh' : 'Học sinh'} thành công! Đang làm mới...`)
        const newRes = await apiFetch('/users/me')
        if (newRes && newRes.data) {
          setUser(newRes.data)
          localStorage.setItem('user', JSON.stringify(newRes.data))
        }
        setTimeout(() => {
          window.location.reload()
        }, 500)
      } else {
        toast.error(res?.error || 'Liên kết thất bại')
      }
    } catch (e: any) {
      toast.error(e.message || 'Lỗi kết nối máy chủ')
    }
  }

  // Handle Telegram account unlink
  const handleUnlinkTelegram = async (slot: 1 | 2) => {
    const slotName = slot === 2 ? 'Phụ huynh' : 'Học sinh'
    if (!confirm(`Bạn có chắc chắn muốn hủy liên kết Telegram ${slotName}?`)) return
    try {
      const res = await apiFetch('/users/me/unlink-telegram', {
        method: 'POST',
        body: JSON.stringify({ slot }),
      })

      if (res && (res.message || res.slot)) {
        toast.success(`Đã hủy liên kết Telegram ${slotName}`)
        const newRes = await apiFetch('/users/me')
        if (newRes && newRes.data) {
          setUser(newRes.data)
          localStorage.setItem('user', JSON.stringify(newRes.data))
        }
      } else {
        toast.error(res?.error || 'Không thể hủy liên kết')
      }
    } catch (err: any) {
      toast.error(err.message || 'Lỗi kết nối máy chủ')
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
          newPassword,
        }),
      })

      if (res && res.message) {
        toast.success(res.message || 'Đổi mật khẩu thành công!')
        setNewPassword('')
        setConfirmPassword('')
      } else if (res && res.error) {
        toast.error(res.error)
      }
    } catch (err: any) {
      toast.error(err.message || 'Không thể đổi mật khẩu. Vui lòng thử lại sau.')
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
    affiliate: { label: 'Đối tác Affiliate', bg: 'bg-amber-100', text: 'text-amber-700' },
    student: { label: 'Học sinh', bg: 'bg-emerald-100', text: 'text-emerald-700' },
  }
  const roleBadge = roleLabelMap[user.role] || {
    label: user.role,
    bg: 'bg-slate-100',
    text: 'text-slate-700',
  }

  const isPartner = user.role === 'admin' || user.role === 'teacher' || user.role === 'affiliate'

  const getCommissionRate = (role: string) => {
    switch (role) {
      case 'admin':
        return 70
      case 'teacher':
        return 60
      case 'affiliate':
        return 30
      default:
        return 0
    }
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
          <div className="relative group shrink-0">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarFileSelect}
              accept="image/png, image/jpeg, image/webp, image/gif"
              className="hidden"
            />
            {user.telegramAvt ? (
              <img
                src={user.telegramAvt}
                alt={user.fullName}
                className="w-20 h-20 rounded-full object-cover shadow-sm border-2 border-primary/20 shrink-0"
              />
            ) : (
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-3xl font-black uppercase shrink-0 shadow-md shadow-blue-500/20">
                {user.fullName ? getAvatarInitial(user.fullName) : <User size={40} />}
              </div>
            )}

            {/* Upload Button Overlay */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingAvatar}
              className="absolute inset-0 rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer backdrop-blur-[1px] disabled:cursor-not-allowed"
              title="Thay đổi ảnh đại diện"
            >
              {isUploadingAvatar ? (
                <Loader2 className="w-6 h-6 animate-spin text-white" />
              ) : (
                <>
                  <Camera className="w-5 h-5 mb-0.5" />
                  <span className="text-xs font-semibold">Đổi ảnh</span>
                </>
              )}
            </button>

            {/* Mini Camera Badge for Mobile/Touch Visibility */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingAvatar}
              className="absolute -bottom-1 -right-1 p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-md border-2 border-white transition-colors cursor-pointer sm:hidden"
              title="Đổi ảnh"
            >
              {isUploadingAvatar ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Camera className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

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
                  {user.grade === 'chuyen' ? 'Thi chuyên' : `Lớp ${user.grade}`}
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
              className={`mt-1 w-full py-2 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer ${
                user.role !== 'admin' &&
                user.role !== 'teacher' &&
                (!user.expiresAt ||
                  Math.ceil((new Date(user.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) <= 10)
                  ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 shadow-red-500/20'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
              }`}
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

          <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100 flex items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
              <BookOpen className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-slate-500 font-medium">Khối lớp học tập</p>
                <span className="inline-flex items-center gap-1 text-xs text-slate-500 font-medium bg-slate-200/70 px-2 py-0.5 rounded-full" title="Khối lớp cố định theo năm học">
                  <Lock className="w-3 h-3 text-slate-500" />
                  <span>Cố định</span>
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-bold bg-blue-50 text-blue-700 border border-blue-200/80">
                  {user.grade === 'chuyen'
                    ? 'Thi chuyên'
                    : user.grade === 'tot_nghiep'
                    ? 'Đã tốt nghiệp'
                    : user.grade
                    ? `Lớp ${user.grade}`
                    : 'Chưa cập nhật'}
                </span>
                <span className="text-xs text-slate-400">
                  (Lên lớp ngày 25/5)
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Đổi khối lớp?{' '}
                <a
                  href={`https://t.me/toan6789_admin?text=${encodeURIComponent(
                    `Xin chào Admin toan6789.vn, tôi muốn yêu cầu đổi khối lớp cho tài khoản: ${user.email} (Lớp hiện tại: ${user.grade || 'chưa rõ'})`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 font-semibold underline underline-offset-2"
                >
                  Nhắn Telegram Admin
                </a>{' '}
                hoặc{' '}
                <a
                  href={`mailto:admin@toan6789.vn?subject=${encodeURIComponent(
                    `Yêu cầu đổi khối lớp - ${user.email}`
                  )}&body=${encodeURIComponent(
                    `Kính gửi Admin toan6789.vn,\n\nTôi muốn yêu cầu hỗ trợ chuyển đổi khối lớp cho tài khoản:\n- Email: ${user.email}\n- Họ và tên: ${user.fullName}\n- Khối lớp hiện tại: ${user.grade}\n- Khối lớp muốn chuyển sang: [Điền lớp mong muốn]\n- Lý do: [Điền lý do]\n\nXin cảm ơn!`
                  )}`}
                  className="text-blue-600 hover:text-blue-700 font-semibold underline underline-offset-2"
                >
                  Email
                </a>
              </p>
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

        {/* Partner & Referral Program Section */}
        {isPartner && (
          <div className="pt-2 pb-8 border-t border-slate-100">
            <div className="bg-gradient-to-br from-white via-emerald-50/20 to-teal-50/30 rounded-2xl p-5 sm:p-6 border border-emerald-200/80 shadow-sm">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-emerald-100/80">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    <Gift className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-bold text-slate-900">Mã Giới Thiệu & Hoa Hồng Đối Tác</h3>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                        Chương trình Đối tác & Giới thiệu
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Chia sẻ mã giới thiệu để nhận hoa hồng trọn đời khi học sinh đăng ký gói học
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-xl border border-emerald-200/60 text-xs font-bold shrink-0">
                  <Percent className="w-4 h-4 text-emerald-600" />
                  <span>Tỷ lệ hoa hồng: {getCommissionRate(user.role)}%</span>
                </div>
              </div>

              {/* Referral Code & Action Buttons */}
              <div className="my-5 p-4 bg-white rounded-xl border border-slate-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Mã của bạn:
                  </span>
                  <span className="px-3.5 py-1.5 bg-slate-900 text-white font-mono text-base font-bold tracking-wider rounded-lg shadow-sm selection:bg-emerald-500">
                    {user.referralCode || 'Đang cập nhật...'}
                  </span>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap w-full md:w-auto">
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    disabled={!user.referralCode}
                    className="flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-600" />}
                    <span>{copiedCode ? 'Đã sao chép' : 'Sao chép mã'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyLink}
                    disabled={!user.referralCode}
                    className="flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-sm shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Đã sao chép' : 'Sao chép link đăng ký'}</span>
                  </button>
                </div>
              </div>

              {/* Commission Stats 2 Columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl p-4 border border-emerald-100/90 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-500">Hoa hồng tháng này (chờ chốt)</span>
                    <Coins className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="my-1">
                    <span className="text-2xl font-black text-emerald-600 font-mono tracking-tight">
                      {new Intl.NumberFormat('vi-VN').format(user.commissionBalance || 0)} đ
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">Tự động chốt sổ vào ngày 01 hàng tháng</p>
                </div>

                <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-500">Tổng hoa hồng đã nhận</span>
                    <Award className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="my-1">
                    <span className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                      {new Intl.NumberFormat('vi-VN').format(user.totalCommissionReceived || 0)} đ
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">Lũy kế các tháng trước đã thanh toán</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Security & Telegram Linking Section */}
        <div className="space-y-6 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Shield className="text-primary" size={20} />
              Bảo mật & Liên kết
            </h3>
          </div>

          {/* Change Password Inline Row (2 inputs + 1 button on 1 horizontal row) */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80">
            <div className="flex items-center gap-2 mb-3">
              <KeyRound className="w-4 h-4 text-blue-600" />
              <h4 className="font-bold text-slate-800 text-sm">Đổi mật khẩu tài khoản</h4>
            </div>

            <form onSubmit={handleChangePassword} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mật khẩu mới (tối thiểu 6 ký tự)"
                  required
                  minLength={6}
                  className="w-full px-3.5 py-2.5 pr-10 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              <div className="relative flex-1">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Xác nhận mật khẩu mới"
                  required
                  minLength={6}
                  className="w-full px-3.5 py-2.5 pr-10 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              <button
                type="submit"
                disabled={isSubmittingPassword}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-sm shrink-0 disabled:opacity-50 cursor-pointer"
              >
                {isSubmittingPassword ? 'Đang lưu...' : 'Lưu mật khẩu'}
              </button>
            </form>
          </div>

          {/* Dual Telegram Linking Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-base">Liên kết tài khoản Telegram (2 Tài khoản)</h4>
                <p className="text-slate-500 text-xs mt-0.5">
                  Kết nối tài khoản Telegram của Học sinh và Phụ huynh để nhận kết quả bài thi, mã OTP và cảnh báo bảo mật.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* SLOT 1: HỌC SINH */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                        <GraduationCap className="w-4 h-4" />
                      </div>
                      <div>
                        <h5 className="font-bold text-slate-900 text-sm">Telegram 1 (Học sinh)</h5>
                        <span className="text-xs text-blue-600 font-semibold uppercase tracking-wider">Tài khoản chính</span>
                      </div>
                    </div>

                    {user.telegramId ? (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Đã kết nối
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-200 text-slate-600">
                        Chưa liên kết
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 my-3 leading-relaxed">
                    Nhận thông báo bài học mới, kết quả thi và cảnh báo bảo mật.
                  </p>

                  {user.telegramId && (
                    <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2.5">
                        {user.telegramAvt ? (
                          <img src={user.telegramAvt} alt="TG" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold">
                            TG
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-bold text-slate-800">
                            {user.telegramUsername ? `@${user.telegramUsername}` : `ID: ${user.telegramId}`}
                          </p>
                          <p className="text-xs text-slate-400">ID: {user.telegramId}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleUnlinkTelegram(1)}
                        className="min-h-[44px] px-3 py-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors font-semibold flex items-center gap-1 cursor-pointer"
                        title="Hủy liên kết Telegram Học sinh"
                      >
                        <Unlink className="w-3.5 h-3.5" />
                        <span>Hủy</span>
                      </button>
                    </div>
                  )}
                </div>

                {!user.telegramId && (
                  <div className="pt-2">
                    <TelegramLoginWidget
                      botName={process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'toan6789_bot'}
                      onAuthSuccess={(tg) => handleTelegramSuccess(tg, 1)}
                      linkUserId={user.id}
                      slot={1}
                      buttonText="Liên kết Telegram Học sinh"
                    />
                  </div>
                )}
              </div>

              {/* SLOT 2: PHỤ HUYNH */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <h5 className="font-bold text-slate-900 text-sm">Telegram 2 (Phụ huynh)</h5>
                        <span className="text-xs text-purple-600 font-semibold uppercase tracking-wider">Đồng hành & Giám sát</span>
                      </div>
                    </div>

                    {user.telegramId2 ? (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Đã kết nối
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-200 text-slate-600">
                        Chưa liên kết
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 my-3 leading-relaxed">
                    Nhận báo cáo kết quả thi của con, theo dõi tiến độ luyện đề và cảnh báo tài khoản.
                  </p>

                  {user.telegramId2 && (
                    <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2.5">
                        {user.telegramAvt2 ? (
                          <img src={user.telegramAvt2} alt="TG2" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center text-xs font-bold">
                            TG
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-bold text-slate-800">
                            {user.telegramUsername2 ? `@${user.telegramUsername2}` : `ID: ${user.telegramId2}`}
                          </p>
                          <p className="text-xs text-slate-400">ID: {user.telegramId2}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleUnlinkTelegram(2)}
                        className="min-h-[44px] px-3 py-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors font-semibold flex items-center gap-1 cursor-pointer"
                        title="Hủy liên kết Telegram Phụ huynh"
                      >
                        <Unlink className="w-3.5 h-3.5" />
                        <span>Hủy</span>
                      </button>
                    </div>
                  )}
                </div>

                {!user.telegramId2 && (
                  <div className="pt-2">
                    <TelegramLoginWidget
                      botName={process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'toan6789_bot'}
                      onAuthSuccess={(tg) => handleTelegramSuccess(tg, 2)}
                      linkUserId={user.id}
                      slot={2}
                      buttonText="Liên kết Telegram Phụ huynh"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
