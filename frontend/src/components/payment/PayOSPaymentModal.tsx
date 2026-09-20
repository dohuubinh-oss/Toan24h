'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckCircle2,
  QrCode,
  Loader2,
  AlertCircle,
  Copy,
  Check,
  X,
  ExternalLink,
} from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { toast } from 'react-hot-toast'

export interface PayOSPaymentData {
  transactionId: string
  orderCode: number
  amount: number
  plan: string
  planName?: string
  qrCode?: string
  checkoutUrl?: string
  accountNumber?: string
  accountName?: string
  bin?: string
  content?: string
}

interface PayOSPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  paymentData: PayOSPaymentData | null
}

export default function PayOSPaymentModal({
  isOpen,
  onClose,
  paymentData,
}: PayOSPaymentModalProps) {
  const router = useRouter()
  const [isPaymentSuccess, setIsPaymentSuccess] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [qrError, setQrError] = useState(false)

  // Reset states when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsPaymentSuccess(false)
      setQrError(false)
    }
  }, [isOpen, paymentData?.orderCode])

  // Polling transaction status every 3s
  useEffect(() => {
    if (!isOpen || !paymentData || isPaymentSuccess) return

    const interval = setInterval(async () => {
      try {
        const res = await apiFetch('/payments/my-transactions')
        const transactions = Array.isArray(res) ? res : res?.data
        if (Array.isArray(transactions)) {
          const tx = transactions.find(
            (t: any) =>
              t.id === paymentData.transactionId ||
              t.orderCode === paymentData.orderCode
          )
          if (tx && tx.status === 'completed') {
            setIsPaymentSuccess(true)
            toast.success('🎉 Thanh toán thành công! Tài khoản của bạn đã được gia hạn.')
            setTimeout(() => {
              onClose()
              router.push('/profile?upgraded=true')
            }, 2000)
          }
        }
      } catch (e) {
        console.error('Polling error', e)
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [isOpen, paymentData, isPaymentSuccess, router, onClose])

  if (!isOpen || !paymentData) return null

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(fieldName)
    toast.success(`Đã sao chép ${fieldName}`)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const accountNumber = paymentData.accountNumber || '1234567890'
  const accountName = paymentData.accountName || 'TOAN24H EDUCATION'
  const bankName = 'MB Bank (Ngân hàng Quân Đội)'
  const content = paymentData.content || `T24H ${paymentData.orderCode}`

  // Standard VietQR fallback
  const fallbackVietQrUrl = `https://img.vietqr.io/image/MB-${accountNumber}-compact2.png?amount=${
    paymentData.amount
  }&addInfo=${encodeURIComponent(content)}&accountName=${encodeURIComponent(
    accountName
  )}`

  const qrSrc = !qrError && paymentData.qrCode ? paymentData.qrCode : fallbackVietQrUrl

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden relative max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Thanh Toán PayOS (VietQR)
              </h3>
              <p className="text-xs text-slate-500">
                {paymentData.planName ? `${paymentData.planName} • ` : ''}Tự động kích hoạt sau chuyển khoản
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200/60 hover:bg-slate-200 text-slate-500 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto">
          {isPaymentSuccess ? (
            <div className="py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-2xl font-black text-slate-900 mb-2">
                Thanh Toán Thành Công!
              </h4>
              <p className="text-sm text-slate-600 max-w-sm mx-auto mb-6">
                Tài khoản của bạn đã được nâng cấp thành công. Đang chuyển hướng bạn về trang cá nhân...
              </p>
              <button
                onClick={() => {
                  onClose()
                  router.push('/profile?upgraded=true')
                }}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-all cursor-pointer"
              >
                Đến Hồ sơ ngay
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* QR Code Column */}
              <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                <p className="text-xs font-bold text-slate-700 mb-3 uppercase tracking-wider">
                  Quét mã bằng ứng dụng Ngân hàng
                </p>
                <div className="bg-white p-3 rounded-2xl border-2 border-blue-500/20 shadow-sm relative mb-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrSrc}
                    alt="VietQR PayOS"
                    onError={() => setQrError(true)}
                    className="w-56 h-56 object-contain rounded-lg"
                  />
                </div>

                <div className="flex items-center gap-2 text-xs font-bold text-blue-600 bg-blue-50 px-3.5 py-1.5 rounded-full border border-blue-100">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                  <span>Đang chờ chuyển khoản PayOS...</span>
                </div>

                {paymentData.checkoutUrl && (
                  <a
                    href={paymentData.checkoutUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 text-xs text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1 hover:underline"
                  >
                    <span>Mở trang thanh toán PayOS</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {/* Transfer Details Column */}
              <div className="space-y-3.5">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70">
                  <p className="text-[11px] font-semibold text-slate-500">Ngân hàng thụ hưởng</p>
                  <p className="font-bold text-slate-800 text-sm">{bankName}</p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-semibold text-slate-500">Số tài khoản</p>
                    <p className="font-mono font-bold text-slate-900 text-base tracking-wide">
                      {accountNumber}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(accountNumber, 'Số tài khoản')}
                    className="p-2 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors cursor-pointer"
                    title="Sao chép số tài khoản"
                  >
                    {copiedField === 'Số tài khoản' ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70">
                  <p className="text-[11px] font-semibold text-slate-500">Chủ tài khoản</p>
                  <p className="font-bold text-slate-800 text-sm uppercase">
                    {accountName}
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-semibold text-slate-500">Số tiền cần thanh toán</p>
                    <p className="font-extrabold text-blue-600 text-lg">
                      {paymentData.amount.toLocaleString('vi-VN')} đ
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(paymentData.amount.toString(), 'Số tiền')}
                    className="p-2 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors cursor-pointer"
                    title="Sao chép số tiền"
                  >
                    {copiedField === 'Số tiền' ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Content Required Box */}
                <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between">
                  <div className="flex-1 mr-2">
                    <div className="flex items-center gap-1.5 text-amber-800 font-bold text-xs mb-0.5">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                      <span>Nội dung chuyển khoản (Bắt buộc)</span>
                    </div>
                    <p className="font-mono font-black text-slate-900 text-sm break-all">
                      {content}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(content, 'Nội dung chuyển khoản')}
                    className="px-3 py-1.5 bg-amber-200 hover:bg-amber-300 text-amber-900 font-bold text-xs rounded-lg transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    {copiedField === 'Nội dung chuyển khoản' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Đã chép</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Sao chép</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Hệ thống PayOS tự động kích hoạt sau vài giây. Không cần tải lại trang.</span>
          <button
            type="button"
            onClick={onClose}
            className="font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}
