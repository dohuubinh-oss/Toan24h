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

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://toan6789.vn'

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'toan6789.vn - Nền tảng Học và Luyện thi Toán THCS | MathAI',
    template: '%s | toan6789.vn',
  },
  description: 'Nền tảng học, luyện tập và thi thử Toán THCS Lớp 6, 7, 8, 9 theo chương trình GDPT mới. Chấm thi tự luận bằng AI thông minh, giải chi tiết từng bước.',
  keywords: [
    'toán thcs',
    'luyện thi toán',
    'toán lớp 6',
    'toán lớp 7',
    'toán lớp 8',
    'toán lớp 9',
    'thi vào 10',
    'đề thi toán có đáp án',
    'chấm thi toán ai',
    'toan6789',
    'mathai',
  ],
  authors: [{ name: 'Ban Chuyên môn toan6789.vn' }],
  creator: 'toan6789.vn',
  publisher: 'toan6789.vn',
  alternates: {
    canonical: './',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/logo-icon.png',
  },
  openGraph: {
    title: 'toan6789.vn - Nền tảng Học và Luyện thi Toán THCS | MathAI',
    description: 'Luyện thi Toán THCS Lớp 6-9 bám sát chương trình mới. Tự động chấm thi tự luận và trắc nghiệm với AI, hỗ trợ giải đáp 24/7.',
    url: baseUrl,
    siteName: 'toan6789.vn',
    locale: 'vi_VN',
    type: 'website',
    images: [
      {
        url: '/logo-stacked.png',
        width: 1200,
        height: 630,
        alt: 'toan6789.vn - Học và Luyện thi Toán THCS',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'toan6789.vn - Luyện thi Toán THCS Lớp 6-9 với MathAI',
    description: 'Chấm thi tự luận và trắc nghiệm thông minh bằng AI. Lộ trình cá nhân hóa bứt phá điểm 9+ môn Toán.',
    images: ['/logo-stacked.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@graph': [
                {
                  '@type': 'EducationalOrganization',
                  '@id': `${baseUrl}/#organization`,
                  name: 'toan6789.vn',
                  url: baseUrl,
                  logo: `${baseUrl}/logo.png`,
                  description: 'Nền tảng học, luyện tập và thi thử Toán THCS Lớp 6, 7, 8, 9 với trợ lý chấm thi thông minh MathAI.',
                },
                {
                  '@type': 'WebSite',
                  '@id': `${baseUrl}/#website`,
                  url: baseUrl,
                  name: 'toan6789.vn',
                  publisher: {
                    '@id': `${baseUrl}/#organization`,
                  },
                  potentialAction: {
                    '@type': 'SearchAction',
                    target: `${baseUrl}/exams?q={search_term_string}`,
                    'query-input': 'required name=search_term_string',
                  },
                },
              ],
            }),
          }}
        />
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
