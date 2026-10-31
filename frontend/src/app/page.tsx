import React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import HomeNavigation from '../components/home/HomeNavigation'
import HomeHero from '../components/home/HomeHero'
import HomeFeatures from '../components/home/HomeFeatures'
import HomePricing from '../components/home/HomePricing'
import HomeFooter from '../components/home/HomeFooter'
import { Sparkles } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Học và Luyện thi Toán THCS Lớp 6, 7, 8, 9 Thông Minh | toan6789.vn',
  description: 'Nền tảng tự luyện Toán THCS chuẩn Bộ GD&ĐT. Tự động chấm thi tự luận và trắc nghiệm với MathAI, ngân hàng 10.000+ đề thi có đáp án và lời giải chi tiết.',
  alternates: {
    canonical: '/',
  },
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white font-sans selection:bg-primary/30">
      <HomeNavigation />

      <main>
        <HomeHero />
        <HomeFeatures />
        <HomePricing />
      </main>

      <HomeFooter />

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50 group">
        <Link
          href="/lectures"
          aria-label="Hỏi đáp AI Toán học và làm bài ngay"
          className="w-14 h-14 sm:w-16 sm:h-16 bg-primary text-white rounded-full shadow-2xl shadow-primary/40 flex items-center justify-center hover:scale-110 active:scale-95 transition-all cursor-pointer"
        >
          <Sparkles className="w-7 h-7 sm:w-8 sm:h-8" />
        </Link>
        <div className="absolute -top-10 right-0 bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Hỏi AI ngay! ✨
        </div>
      </div>
    </div>
  )
}
