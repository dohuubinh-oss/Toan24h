import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { GraduationCap, ArrowLeft, Flame, ShieldCheck } from 'lucide-react'

interface LoginBrandingProps {
  title?: string
  subtitle?: string
}

export default function LoginBranding({
  title = 'Chào mừng bạn trở lại!',
  subtitle = 'Cùng chinh phục môn Toán mỗi ngày với các phương pháp tư duy hiện đại và thú vị.'
}: LoginBrandingProps = {}) {
  return (
    <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 text-white flex-col justify-between p-12 relative overflow-hidden select-none">
      {/* Top Header trên Banner: Logo Toan6789 & Nút Về trang chủ */}
      <div className="flex items-center justify-between w-full relative z-10">
        <Link href="/" className="flex items-center gap-2.5 text-white hover:opacity-90 transition">
          <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-xs">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight block leading-tight">Toan6789</span>
            <span className="text-[10px] tracking-wider text-blue-200 uppercase font-semibold block">
              Nền tảng Toán THCS
            </span>
          </div>
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-blue-100 hover:text-white px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/15 transition shadow-2xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Về trang chủ</span>
        </Link>
      </div>

      {/* Họa tiết ký hiệu Toán học mờ chìm trong nền */}
      <span className="absolute top-28 left-12 text-white/20 text-6xl sm:text-7xl font-extrabold tracking-tighter pointer-events-none select-none">
        ∑
      </span>
      <span className="absolute top-32 right-16 text-white/15 text-5xl font-mono pointer-events-none select-none">
        π
      </span>
      <span className="absolute top-1/2 right-12 text-white/15 text-7xl font-serif pointer-events-none select-none">
        √x
      </span>
      <span className="absolute bottom-24 right-20 text-white/20 text-5xl font-mono pointer-events-none select-none">
        f(x)
      </span>
      <span className="absolute bottom-28 left-16 text-white/10 text-2xl font-serif italic pointer-events-none select-none">
        x² + y² = r²
      </span>

      {/* Khối card ảnh cây mầm + 2 Floating Glassmorphism Badges */}
      <div className="relative z-10 flex flex-col items-center max-w-md mx-auto text-center my-auto py-6">
        {/* Vầng sáng Ambient Glow */}
        <div className="absolute w-72 h-72 rounded-full bg-blue-400/20 blur-3xl -z-10 pointer-events-none" />
        <div className="relative">
          {/* Khung ảnh bo góc 3xl */}
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-3xl overflow-hidden shadow-2xl bg-amber-100 dark:bg-slate-800 border-4 border-white/25">
            <Image
              src="/auth-hero.png"
              alt="Toan6789 Hero"
              fill
              sizes="(max-width: 640px) 256px, 288px"
              priority
              className="object-cover"
            />
          </div>
          {/* Floating Badge 1 (Góc trên phải) */}
          <div className="absolute -top-3.5 -right-4 px-3.5 py-1.5 rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-xl border border-white/50 dark:border-slate-700 text-slate-800 dark:text-slate-100 flex items-center gap-1.5 text-xs font-bold">
            <Flame className="w-4 h-4 fill-amber-500 text-amber-500 shrink-0" />
            <span>Chuỗi 7 Ngày Streak 🔥</span>
          </div>
          {/* Floating Badge 2 (Góc dưới trái) */}
          <div className="absolute -bottom-3.5 -left-4 px-3.5 py-1.5 rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-xl border border-white/50 dark:border-slate-700 text-slate-800 dark:text-slate-100 flex items-center gap-1.5 text-xs font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>1.000+ Dạng Toán & Lời Giải AI</span>
          </div>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-8 tracking-tight">
          {title}
        </h2>
        <p className="mt-3 text-sm text-blue-100/90 leading-relaxed max-w-sm">
          {subtitle}
        </p>
      </div>

      {/* Footer Cột Trái */}
      <div className="relative z-10 text-xs text-blue-200/80 flex items-center justify-between w-full">
        <span>Hệ sinh thái EdTech 6789</span>
        <span>© 2026 Toan6789</span>
      </div>
    </div>
  )
}
