import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'toan6789.vn - Luyện thi Toán THCS & MathAI',
    short_name: 'toan6789.vn',
    description: 'Nền tảng học và thi thử Toán THCS Lớp 6, 7, 8, 9 với trợ lý thông minh MathAI.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f8fafc',
    theme_color: '#2563eb',
    icons: [
      {
        src: '/logo-icon-60.png',
        sizes: '60x60',
        type: 'image/png',
      },
      {
        src: '/logo-icon.png',
        sizes: '392x302',
        type: 'image/png',
      },
      {
        src: '/logo-stacked.png',
        sizes: '392x302',
        type: 'image/png',
      },
    ],
  }
}
