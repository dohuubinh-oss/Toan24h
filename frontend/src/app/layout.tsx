import './globals.css'
import type { Metadata } from 'next'
import { Lexend } from 'next/font/google'
import Script from 'next/script'
import GradeSelectionModal from '@/components/auth/GradeSelectionModal'
import { ToastProvider } from '@/components/ui/ToastProvider'

const lexend = Lexend({ 
  subsets: ['latin', 'vietnamese'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-lexend',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'toan6789.vn - Nền tảng Học và Luyện thi Toán THCS | MathAI',
  description: 'Nền tảng học và thi thử Toán THCS Lớp 6, 7, 8, 9 với trợ lý thông minh MathAI.',
  icons: {
    icon: '/favicon.ico',
    apple: '/logo-icon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi" suppressHydrationWarning className={`${lexend.variable}`}>
      <head>
        <Script id="performance-measure-patch" strategy="beforeInteractive">
          {`
            if (typeof window !== 'undefined' && window.performance && window.performance.measure) {
              (function() {
                var origMeasure = window.performance.measure.bind(window.performance);
                window.performance.measure = function() {
                  try {
                    return origMeasure.apply(this, arguments);
                  } catch (e) {
                    if (e && e.message && e.message.indexOf('negative time stamp') !== -1) {
                      return undefined;
                    }
                    throw e;
                  }
                };
              })();
            }
          `}
        </Script>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" />
        <link href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css" rel="stylesheet" />
      </head>
      <body className="bg-page-bg text-slate-900 min-h-screen flex flex-col font-sans">
        <ToastProvider>
          <GradeSelectionModal />
          {children}
        </ToastProvider>
      </body>
    </html>
  )
}
