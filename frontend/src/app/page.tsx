import React from 'react'
import HomeNavigation from '../components/home/HomeNavigation'
import HomeHero from '../components/home/HomeHero'
import HomeFeatures from '../components/home/HomeFeatures'
import HomePricing from '../components/home/HomePricing'
import HomeFooter from '../components/home/HomeFooter'
import { Sparkles } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-primary/30">
      <HomeNavigation />
      
      <main>
        <HomeHero />
        <HomeFeatures />
        <HomePricing />
      </main>

      <HomeFooter />

      {/* Floating Action Button */}
      <div className="fixed bottom-8 right-8 z-50">
        <button className="w-16 h-16 bg-primary text-white rounded-full shadow-2xl shadow-primary/40 flex items-center justify-center hover:scale-110 active:scale-95 transition-all">
          <Sparkles className="w-8 h-8" />
        </button>
        <div className="absolute -top-12 right-0 bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl">
          Hỏi AI ngay! ✨
        </div>
      </div>
    </div>
  )
}
