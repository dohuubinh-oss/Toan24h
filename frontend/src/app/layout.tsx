import './globals.css'
import type { Metadata } from 'next'

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
    <html lang="vi" suppressHydrationWarning>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
        <link href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css" rel="stylesheet" />
      </head>
      <body className="bg-page-bg text-slate-900 min-h-screen flex flex-col font-body">
        {children}
      </body>
    </html>
  )
}
