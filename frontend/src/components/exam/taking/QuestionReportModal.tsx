'use client'

import React, { useState } from 'react'
import { Flag, X } from 'lucide-react'
import { toast } from '@/components/ui/ToastProvider'
import { submitAppeal, reportQuestion } from '@/lib/api'
import { Modal } from '@/components/ui/Modal'

export interface QuestionReportModalProps {
  isOpen: boolean
  onClose: () => void
  readonly?: boolean
  questionId: string | number
  resultId?: string
  detailId?: string
  isGroup?: boolean
  onSubmit?: (message: string) => Promise<void>
}

export function QuestionReportModal({
  isOpen,
  onClose,
  readonly = false,
  questionId,
  resultId,
  detailId,
  isGroup = false,
  onSubmit,
}: QuestionReportModalProps) {
  const [reportMessage, setReportMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!reportMessage.trim()) return
    setIsSubmitting(true)

    try {
      if (onSubmit) {
        await onSubmit(reportMessage)
      } else if (readonly && resultId && !isGroup && detailId) {
        await submitAppeal(resultId, detailId, reportMessage)
        toast.success('Kháng cáo đã được gửi thành công!')
      } else {
        await reportQuestion(questionId.toString(), reportMessage)
        toast.success('Báo lỗi câu hỏi thành công!')
      }
      setReportMessage('')
      onClose()
    } catch (err: any) {
      toast.error(err?.response?.data?.error || err?.message || 'Lỗi khi gửi yêu cầu')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setReportMessage('')
      onClose()
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      maxWidth="md"
      closeOnBackdropClick={!isSubmitting}
      closeOnEscape={!isSubmitting}
      showCloseButton={false}
      contentClassName="p-6 sm:p-7"
    >
      {/* Custom Close Button */}
      <button
        type="button"
        onClick={handleClose}
        disabled={isSubmitting}
        className="absolute top-4 right-4 min-w-[40px] min-h-[40px] p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
        aria-label="Đóng cửa sổ"
      >
        <X className="w-5 h-5" aria-hidden="true" />
      </button>

      {/* Header */}
      <div className="flex items-start gap-3.5 mb-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/60 flex items-center justify-center shrink-0 shadow-xs">
          <Flag className="w-6 h-6" aria-hidden="true" />
        </div>
        <div className="pr-6">
          <h3 className="text-xl font-bold text-slate-900">
            {readonly ? 'Kháng cáo kết quả' : 'Báo lỗi câu hỏi'}
          </h3>
          <p className="text-slate-500 text-xs mt-1 leading-relaxed">
            {readonly
              ? 'Nêu rõ lý do bạn muốn giáo viên và AI xem xét lại kết quả câu hỏi này.'
              : 'Vui lòng mô tả lỗi (sai đề, thiếu thông tin, lỗi chính tả, ...)'}
          </p>
        </div>
      </div>

      {/* Textarea */}
      <textarea
        value={reportMessage}
        onChange={(e) => setReportMessage(e.target.value)}
        placeholder="Nhập chi tiết nội dung cần phản hồi..."
        disabled={isSubmitting}
        className="w-full min-h-[120px] p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none text-slate-700 text-sm"
      />

      {/* Footer Buttons */}
      <div className="flex gap-3 mt-6">
        <button
          type="button"
          onClick={handleClose}
          disabled={isSubmitting}
          className="flex-1 min-h-[44px] px-4 py-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl font-bold text-sm transition-colors cursor-pointer"
        >
          Hủy
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || !reportMessage.trim()}
          className="flex-1 min-h-[44px] px-4 py-2.5 bg-primary text-white hover:bg-primary/90 disabled:opacity-50 rounded-xl font-bold text-sm transition-all shadow-sm shadow-primary/20 flex items-center justify-center cursor-pointer active:scale-98"
        >
          {isSubmitting ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            'Gửi yêu cầu'
          )}
        </button>
      </div>
    </Modal>
  )
}

export default QuestionReportModal
