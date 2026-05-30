import './globals.css'
import type { Metadata } from 'next'
import { Lexend } from 'next/font/google'

const lexend = Lexend({ 
  subsets: ['latin', 'vietnamese'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-lexend',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Ngân hàng câu hỏi | Math EdTech',
  description: 'Hệ thống quản lý ngân hàng câu hỏi môn Toán.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
      <html lang="vi" suppressHydrationWarning className={`${lexend.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" />
        <link href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css" rel="stylesheet" />
      </head>
      <body className="bg-page-bg text-slate-900 min-h-screen flex flex-col font-sans">
        {children}
      </body>
    </html>
  )
}
