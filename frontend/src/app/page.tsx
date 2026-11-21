import React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import HomeNavigation from '../components/home/HomeNavigation'
import HomeHero from '../components/home/HomeHero'
import HomeFeatures from '../components/home/HomeFeatures'
import HomePricing from '../components/home/HomePricing'
import HomeTestimonials from '../components/home/HomeTestimonials'
import HomeFAQ from '../components/home/HomeFAQ'
import HomeFooter from '../components/home/HomeFooter'
import HomeAiAssistantButton from '../components/home/HomeAiAssistantButton'

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
        <HomeTestimonials />
        <HomeFAQ />
      </main>

      <HomeFooter />

      {/* Floating Action Button with Interactive AI Math Assistant */}
      <HomeAiAssistantButton />
    </div>
  )
}
