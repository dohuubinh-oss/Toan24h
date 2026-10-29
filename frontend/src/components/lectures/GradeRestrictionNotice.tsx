import React from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowRight, Settings, Home } from 'lucide-react';

export interface GradeRestrictionNoticeProps {
  userGrade: string;
  attemptedGrade: string;
}

export function GradeRestrictionNotice({
  userGrade,
  attemptedGrade,
}: GradeRestrictionNoticeProps) {
  return (
    <div className="max-w-2xl mx-auto my-12 p-6 sm:p-8 bg-white rounded-3xl border border-slate-200/90 shadow-sm text-center">
      <div className="w-16 h-16 bg-blue-50 text-primary rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-xs">
        <ShieldCheck className="w-8 h-8" aria-hidden="true" />
      </div>

      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-primary mb-3">
        Gói học Toán Khối {userGrade}
      </span>

      <h2 className="text-2xl font-bold text-slate-900 mb-3">
        Gói học của bạn dành riêng cho Khối {userGrade}
      </h2>

      <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-lg mx-auto mb-6">
        Chào bạn! Tài khoản hiện tại được thiết kế chuyên sâu cho chương trình{' '}
        <strong className="text-slate-800">Toán Lớp {userGrade}</strong>. Để lộ trình học tập và đánh giá năng lực của bạn đạt hiệu quả cao nhất, hệ thống sẽ mở các bài học thuộc đúng khối lớp bạn đã đăng ký.
      </p>

      <p className="text-xs text-slate-500 mb-8 max-w-md mx-auto">
        (Bạn đang mở danh sách bài học của Khối {attemptedGrade}. Nếu muốn học khối lớp khác, bạn có thể cập nhật lại trong mục Cài đặt cá nhân).
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          href={`/lectures/lop/${userGrade}`}
          className="w-full sm:w-auto min-h-[48px] px-6 py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <span>Trở về bài học Lớp {userGrade} của tôi</span>
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </Link>

        <Link
          href="/student/settings"
          className="w-full sm:w-auto min-h-[48px] px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
        >
          <Settings className="w-4 h-4 text-slate-500" aria-hidden="true" />
          <span>Đổi khối lớp trong Cài đặt</span>
        </Link>

        <Link
          href="/student"
          className="w-full sm:w-auto min-h-[48px] px-4 py-3 text-slate-500 hover:text-slate-800 font-medium text-sm transition-colors flex items-center justify-center gap-1.5"
        >
          <Home className="w-4 h-4" aria-hidden="true" />
          <span>Dashboard</span>
        </Link>
      </div>
    </div>
  );
}
