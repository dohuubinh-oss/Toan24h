import React from 'react'
import type { Metadata } from 'next'
import { ExamProvider } from '@/contexts/ExamContext'
import SubscriptionBanner from '@/components/layout/SubscriptionBanner'

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
}

export default function FullscreenLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ExamProvider>
      <div className="flex flex-col min-h-screen bg-slate-50">
        <SubscriptionBanner hideVisuals={true} />
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </ExamProvider>
  )
}
