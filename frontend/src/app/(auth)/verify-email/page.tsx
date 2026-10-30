'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, AlertCircle, Mail, ArrowRight, Loader2, Send, Gift } from 'lucide-react';
import { verifyEmail, resendVerification } from '@/lib/authApi';
import { Button } from '@/components/ui/Button';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const emailParam = searchParams.get('email') || '';
  const promoMonthsParam = searchParams.get('promoMonths');
  const [promoMonths, setPromoMonths] = useState<string | null>(promoMonthsParam);

  useEffect(() => {
    if (!promoMonths && typeof window !== 'undefined') {
      const stored = localStorage.getItem('promo_reward_months');
      if (stored) setPromoMonths(stored);
    }
  }, [promoMonths]);

  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'missing' | 'waiting'>(
    token ? 'loading' : emailParam ? 'waiting' : 'missing'
  );
  const [errorMessage, setErrorMessage] = useState('');
  const [resendEmail, setResendEmail] = useState(emailParam);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      if (emailParam) {
        setStatus('waiting');
        setResendEmail(emailParam);
      } else {
        setStatus('missing');
      }
      return;
    }

    let isMounted = true;
    verifyEmail(token)
      .then(() => {
        if (isMounted) setStatus('success');
      })
      .catch((err) => {
        if (isMounted) {
          setStatus('error');
          setErrorMessage(err.message || 'Mã kích hoạt không hợp lệ hoặc đã hết hạn.');
        }
      });

    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail.trim()) return;

    setIsResending(true);
    try {
      await resendVerification(resendEmail.trim());
      setResendSuccess(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gửi lại email thất bại. Vui lòng thử lại sau.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/90 shadow-xl p-6 sm:p-8 text-center animate-in zoom-in-95 duration-200">
        {/* Trạng thái 1: Đang xác thực */}
        {status === 'loading' && (
          <div className="py-6 space-y-4">
            <div className="w-16 h-16 bg-blue-50 text-primary rounded-2xl flex items-center justify-center mx-auto shadow-xs">
              <Loader2 className="w-8 h-8 animate-spin" aria-hidden="true" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Đang xác thực tài khoản...</h2>
            <p className="text-sm text-slate-500">Vui lòng chờ trong giây lát.</p>
          </div>
        )}

        {/* Trạng thái 2: Kích hoạt thành công */}
        {status === 'success' && (
          <div className="py-4 space-y-4">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-8 h-8" aria-hidden="true" />
            </div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
              Hoàn tất kích hoạt
            </span>
            <h2 className="text-2xl font-bold text-slate-900">
              Kích hoạt tài khoản thành công! 🎉
            </h2>
            {promoMonths && (
              <div className="p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl flex items-center gap-3 text-left shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <Gift className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-amber-900">Tặng {promoMonths} tháng VIP miễn phí 🎉</p>
                  <p className="text-xs text-amber-700">Mã giới thiệu đã kích hoạt thành công! Hãy đăng nhập để trải nghiệm ngay.</p>
                </div>
              </div>
            )}
            <p className="text-sm text-slate-600 leading-relaxed max-w-sm mx-auto">
              Tài khoản của bạn đã sẵn sàng. Hãy đăng nhập để bắt đầu hành trình học tập và làm bài tập ngay hôm nay.
            </p>
            <div className="pt-4">
              <Link
                href="/login"
                className="w-full min-h-[46px] px-5 py-2.5 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <span>Đăng nhập ngay</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        )}

        {/* Trạng thái 3a: Chờ kiểm tra hòm thư (sau khi đăng ký) */}
        {status === 'waiting' && (
          <div className="py-4 space-y-4">
            <div className="w-16 h-16 bg-blue-50 text-primary rounded-2xl flex items-center justify-center mx-auto shadow-xs">
              <Mail className="w-8 h-8" aria-hidden="true" />
            </div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-primary">
              Bước tiếp theo
            </span>
            <h2 className="text-2xl font-bold text-slate-900">
              Kiểm tra hộp thư của bạn 📩
            </h2>
            {promoMonths && (
              <div className="p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl flex items-center gap-3 text-left shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <Gift className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-amber-900">Ưu đãi {promoMonths} tháng VIP đang chờ bạn</p>
                  <p className="text-xs text-amber-700">Mã giới thiệu đã được ghi nhận. Gói VIP sẽ kích hoạt ngay khi bạn bấm xác nhận email.</p>
                </div>
              </div>
            )}
            <p className="text-sm text-slate-600 leading-relaxed max-w-sm mx-auto">
              Chúng tôi đã gửi liên kết kích hoạt đến địa chỉ{' '}
              <strong className="text-slate-900 font-semibold">{emailParam}</strong>. Vui lòng mở email và nhấn vào nút kích hoạt (kể cả mục Thư rác/Spam).
            </p>

            {resendSuccess ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold">
                Đã gửi lại email kích hoạt mới thành công!
              </div>
            ) : (
              <div className="pt-2">
                <Button
                  type="button"
                  onClick={handleResend}
                  isLoading={isResending}
                  className="w-full min-h-[44px] bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl text-sm"
                >
                  <Send className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
                  <span>Chưa nhận được? Gửi lại email</span>
                </Button>
              </div>
            )}

            <div className="pt-2">
              <Link
                href="/login"
                className="inline-flex items-center text-xs text-slate-500 hover:text-slate-800 font-medium"
              >
                Trở về trang Đăng nhập
              </Link>
            </div>
          </div>
        )}

        {/* Trạng thái 3b: Thiếu token */}
        {status === 'missing' && (
          <div className="py-4 space-y-4">
            <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
              <Mail className="w-8 h-8" aria-hidden="true" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Không tìm thấy mã kích hoạt</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Vui lòng nhấp vào liên kết kích hoạt được gửi trong hòm thư email của bạn (kể cả mục Spam/Thư rác).
            </p>
            <div className="pt-2">
              <Link
                href="/login"
                className="inline-flex items-center text-sm font-bold text-primary hover:underline"
              >
                Trở về trang Đăng nhập
              </Link>
            </div>
          </div>
        )}

        {/* Trạng thái 4: Lỗi hoặc hết hạn */}
        {status === 'error' && (
          <div className="py-4 space-y-4">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
              <AlertCircle className="w-8 h-8" aria-hidden="true" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Kích hoạt không thành công</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              {errorMessage || 'Liên kết kích hoạt đã hết hạn hoặc không tồn tại.'}
            </p>

            {resendSuccess ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold">
                Đã gửi lại liên kết kích hoạt mới! Vui lòng kiểm tra hộp thư email của bạn.
              </div>
            ) : (
              <form onSubmit={handleResend} className="pt-2 space-y-3 text-left">
                <label className="block text-xs font-bold text-slate-700">
                  Gửi lại liên kết kích hoạt mới:
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    placeholder="Nhập email của bạn"
                    required
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <Button
                    type="submit"
                    isLoading={isResending}
                    className="px-4 py-2 shrink-0 rounded-xl"
                  >
                    <Send className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
                    <span>Gửi</span>
                  </Button>
                </div>
              </form>
            )}

            <div className="pt-2">
              <Link
                href="/login"
                className="inline-flex items-center text-xs text-slate-500 hover:text-slate-800 font-medium"
              >
                Trở về trang Đăng nhập
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[80vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
