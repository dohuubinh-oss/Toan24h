import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'UI Lab - Thử nghiệm giao diện',
  robots: {
    index: false,
    follow: false,
  },
}

export default function UiLabLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
