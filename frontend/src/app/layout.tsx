import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ExamModel | Professional Assessment Engine',
  description: 'Editorial Scholarship focused examination management system.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <main className="max-w-7xl mx-auto py-12 px-container">
          {children}
        </main>
      </body>
    </html>
  )
}
