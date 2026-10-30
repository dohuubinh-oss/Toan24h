'use client'

import React, { useState } from 'react'
import {
  X,
  Send,
  Mail,
  Copy,
  Check,
  ExternalLink,
  MessageCircle,
  Sparkles,
  GraduationCap,
  Clock,
} from 'lucide-react'
import toast from 'react-hot-toast'

interface GradeChangeContactModalProps {
  isOpen: boolean
  onClose: () => void
  userEmail?: string
  userName?: string
  currentGrade?: string
}

export function GradeChangeContactModal({
  isOpen,
  onClose,
  userEmail = '',
  userName = '',
  currentGrade = '',
}: GradeChangeContactModalProps) {
  const [copiedTelegram, setCopiedTelegram] = useState(false)
  const [copiedEmail, setCopiedEmail] = useState(false)

  if (!isOpen) return null

  const adminTelegramUsername = 'toan6789_admin'
  const adminEmail = 'admin@toan6789.vn'

  const gradeDisplay =
    currentGrade === 'chuyen'
      ? 'Thi chuyên'
      : currentGrade === 'tot_nghiep'
      ? 'Đã tốt nghiệp'
      : currentGrade
      ? `Lớp ${currentGrade}`
      : 'Chưa cập nhật'

  const telegramMessage = `Xin chào Admin toan6789.vn, tôi muốn yêu cầu đổi khối lớp cho tài khoản:\n- Email: ${userEmail}\n- Họ tên: ${userName || 'Học sinh'}\n- Khối lớp hiện tại: ${gradeDisplay}\n- Khối lớp muốn chuyển sang: [Điền lớp mong muốn]\n- Lý do: [Điền lý do]`

  const telegramUrl = `https://t.me/${adminTelegramUsername}?text=${encodeURIComponent(
    telegramMessage
  )}`

  const emailSubject = `Yêu cầu đổi khối lớp - ${userEmail}`
  const emailBody = `Kính gửi Ban Quản Trị toan6789.vn,\n\nTôi muốn xin thay đổi khối lớp cho tài khoản học sinh:\n- Email tài khoản: ${userEmail}\n- Họ và tên: ${userName}\n- Khối lớp hiện tại: ${gradeDisplay}\n- Khối lớp muốn chuyển sang: [Vui lòng điền Lớp 5, 6, 7, 8, 9 hoặc Lớp Chuyên]\n- Lý do chuyển: [Ví dụ: chuyển trường, học vượt, chọn nhầm lúc đăng ký]\n\nXin chân thành cảm ơn!`

  const emailMailto = `mailto:${adminEmail}?subject=${encodeURIComponent(
    emailSubject
  )}&body=${encodeURIComponent(emailBody)}`

  const handleCopy = async (text: string, type: 'telegram' | 'email') => {
    try {
      await navigator.clipboard.writeText(text)
      if (type === 'telegram') {
        setCopiedTelegram(true)
        toast.success('Đã sao chép Username Telegram của Admin!')
        setTimeout(() => setCopiedTelegram(false), 2000)
      } else {
        setCopiedEmail(true)
        toast.success('Đã sao chép địa chỉ Email của Admin!')
        setTimeout(() => setCopiedEmail(false), 2000)
      }
    } catch {
      toast.error('Không thể sao chép')
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="grade-change-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      {/* Backdrop click to close */}
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      {/* Modal Card */}
      <div className="relative z-10 w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4 border-b border-slate-100 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-white">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/25 shrink-0">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3
                  id="grade-change-title"
                  className="text-lg font-bold text-slate-900 tracking-tight"
                >
                  Yêu cầu Đổi Khối lớp
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-700">
                  <Sparkles className="w-3 h-3" />
                  Hỗ trợ nhanh
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Liên hệ Ban Quản Trị toan6789.vn để chuyển đổi khối lớp
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer shrink-0"
            title="Đóng"
            aria-label="Đóng popup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Account info card */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70 text-xs flex items-center justify-between flex-wrap gap-2">
            <div>
              <span className="text-slate-500">Tài khoản: </span>
              <span className="font-bold text-slate-800">{userEmail || 'Chưa rõ'}</span>
            </div>
            <div>
              <span className="text-slate-500">Khối lớp hiện tại: </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full font-bold bg-blue-100 text-blue-700">
                {gradeDisplay}
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Nhằm đảm bảo tính chính xác của lộ trình học tập và bảng xếp hạng, khối lớp được
            bảo lưu cố định theo tài khoản. Vui lòng liên hệ Admin qua một trong hai kênh dưới
            đây để được hỗ trợ chuyển lớp nhanh chóng:
          </p>

          {/* Contact Option 1: Telegram */}
          <div className="p-4 rounded-2xl border border-blue-100 bg-blue-50/40 hover:bg-blue-50/70 transition-colors">
            <div className="flex items-center justify-between gap-3 mb-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/20">
                  <Send className="w-4 h-4 -rotate-12 translate-x-0.5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <span>Telegram Admin</span>
                    <span className="text-[10px] font-extrabold px-1.5 py-0.2 bg-emerald-100 text-emerald-700 rounded-md">
                      Phản hồi ngay
                    </span>
                  </h4>
                  <p className="text-xs font-mono text-blue-600 font-semibold">
                    @{adminTelegramUsername}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleCopy(`@${adminTelegramUsername}`, 'telegram')}
                className="p-2 text-slate-500 hover:text-blue-600 hover:bg-white rounded-xl transition-all border border-slate-200/80 bg-white/60 cursor-pointer"
                title="Sao chép Username Telegram"
                aria-label="Sao chép Username Telegram"
              >
                {copiedTelegram ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>

            <a
              href={telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm shadow-blue-600/20 cursor-pointer min-h-[44px]"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Nhắn tin qua Telegram cho Admin</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </a>
          </div>

          {/* Contact Option 2: Email */}
          <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/60 hover:bg-slate-50 transition-colors">
            <div className="flex items-center justify-between gap-3 mb-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Email Hỗ Trợ Ban Quản Trị</h4>
                  <p className="text-xs font-mono text-slate-600 font-semibold">{adminEmail}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleCopy(adminEmail, 'email')}
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-white rounded-xl transition-all border border-slate-200/80 bg-white/60 cursor-pointer"
                title="Sao chép Email"
                aria-label="Sao chép Email"
              >
                {copiedEmail ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>

            <a
              href={emailMailto}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer min-h-[44px]"
            >
              <Mail className="w-4 h-4 text-slate-600" />
              <span>Gửi Email yêu cầu đổi khối lớp</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </a>
          </div>

          {/* Support hours note */}
          <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500 justify-center">
            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Thời gian hỗ trợ: 08:00 – 22:00 tất cả các ngày trong tuần</span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer min-h-[40px]"
          >
            Đã hiểu & Đóng
          </button>
        </div>
      </div>
    </div>
  )
}

export default GradeChangeContactModal
