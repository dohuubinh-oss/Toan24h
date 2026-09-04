'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, QrCode, ArrowRight, Loader2, AlertCircle } from 'lucide-react'
import { apiFetch } from '@/lib/api'

export default function UpgradePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [transaction, setTransaction] = useState<{
    transactionId: string;
    amount: number;
    content: string;
  } | null>(null)
  const [checkInterval, setCheckInterval] = useState<NodeJS.Timeout | null>(null)
  
  const createPayment = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch('/payments/create', {
        method: 'POST',
        body: JSON.stringify({ plan: '3_months' })
      })
      
      if (res.error) {
        setError(res.error)
        return
      }
      
      if (res.data) {
        setTransaction(res.data)
      }
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra')
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    // If we have a transaction, poll the status every 5 seconds
    if (transaction) {
      const interval = setInterval(async () => {
        try {
          const res = await apiFetch('/payments/my-transactions')
          if (res.data && Array.isArray(res.data)) {
            const tx = res.data.find((t: any) => t.id === transaction.transactionId)
            if (tx && tx.status === 'completed') {
              clearInterval(interval)
              router.push('/profile?upgraded=true')
            }
          }
        } catch (e) {
          console.error('Polling error', e)
        }
      }, 5000)
      
      setCheckInterval(interval)
      
      return () => {
        if (interval) clearInterval(interval)
      }
    }
  }, [transaction, router])

  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <h1 className="text-3xl font-bold text-slate-800 mb-2 text-center">Nâng cấp tài khoản</h1>
      <p className="text-slate-500 text-center mb-10">Mở khóa toàn bộ tính năng và bài giảng trên Toan24h</p>
      
      {!transaction ? (
        <div className="max-w-md mx-auto bg-white rounded-2xl border border-primary/20 shadow-xl overflow-hidden">
          <div className="bg-primary p-6 text-center text-white relative">
            <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-bl-lg">
              PHỔ BIẾN NHẤT
            </div>
            <h2 className="text-2xl font-bold mb-1">Gói 3 Tháng</h2>
            <div className="text-4xl font-extrabold mt-4 mb-2">450.000đ</div>
            <p className="text-primary-foreground/80">Chỉ 150.000đ / tháng</p>
          </div>
          
          <div className="p-8">
            <ul className="space-y-4 mb-8">
              <li className="flex gap-3">
                <CheckCircle2 className="text-green-500 shrink-0" />
                <span className="text-slate-700">Truy cập toàn bộ bài giảng chất lượng cao</span>
              </li>
              <li className="flex gap-3">
                <CheckCircle2 className="text-green-500 shrink-0" />
                <span className="text-slate-700">Thi thử không giới hạn đề thi THPT Quốc Gia</span>
              </li>
              <li className="flex gap-3">
                <CheckCircle2 className="text-green-500 shrink-0" />
                <span className="text-slate-700">Xem video giải chi tiết từng câu</span>
              </li>
              <li className="flex gap-3">
                <CheckCircle2 className="text-green-500 shrink-0" />
                <span className="text-slate-700">Thống kê phân tích điểm yếu tự động</span>
              </li>
            </ul>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm flex gap-2">
                <AlertCircle size={18} /> {error}
              </div>
            )}
            
            <button 
              onClick={createPayment}
              disabled={loading}
              className="w-full py-4 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/30 flex justify-center items-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" /> : <><QrCode /> Tạo mã thanh toán VietQR</>}
            </button>
          </div>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row">
          <div className="p-8 md:w-1/2 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-100">
            <h3 className="text-xl font-bold text-slate-800 mb-4">Quét mã để thanh toán</h3>
            <div className="bg-white p-2 rounded-xl border-2 border-primary/20 shadow-sm mb-4 relative">
              {/* Fake bank bin: 970422 (MB) */}
              <img 
                src={`https://img.vietqr.io/image/MB-1234567890-compact2.png?amount=${transaction.amount}&addInfo=${encodeURIComponent(transaction.content)}&accountName=TOAN24H%20EDUCATION`} 
                alt="VietQR"
                className="w-64 h-64 object-contain"
              />
            </div>
            <div className="flex items-center gap-2 text-primary font-medium bg-primary/5 px-4 py-2 rounded-full">
              <Loader2 className="animate-spin w-4 h-4" /> Đang chờ thanh toán...
            </div>
          </div>
          
          <div className="p-8 md:w-1/2 flex flex-col justify-center">
            <h4 className="font-bold text-slate-500 text-sm mb-4 uppercase tracking-wider">Thông tin chuyển khoản</h4>
            
            <div className="space-y-5">
              <div>
                <div className="text-slate-500 text-sm">Ngân hàng</div>
                <div className="font-bold text-slate-800 text-lg">MB Bank</div>
              </div>
              
              <div>
                <div className="text-slate-500 text-sm">Số tài khoản</div>
                <div className="font-bold text-slate-800 text-lg flex items-center justify-between">
                  1234567890
                </div>
              </div>
              
              <div>
                <div className="text-slate-500 text-sm">Chủ tài khoản</div>
                <div className="font-bold text-slate-800 text-lg">TOAN24H EDUCATION</div>
              </div>
              
              <div>
                <div className="text-slate-500 text-sm">Số tiền</div>
                <div className="font-bold text-primary text-xl">{transaction.amount.toLocaleString()} VND</div>
              </div>
              
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                <div className="text-blue-600 text-sm mb-1 font-semibold">Nội dung chuyển khoản (Bắt buộc)</div>
                <div className="font-mono font-bold text-slate-800 text-lg break-all">{transaction.content}</div>
              </div>
              
              <p className="text-sm text-slate-500 mt-4 italic">
                Hệ thống sẽ tự động gia hạn tài khoản trong vòng 1-3 phút sau khi bạn chuyển khoản thành công. Không cần tải lại trang.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
