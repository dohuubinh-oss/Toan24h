import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://toan6789.vn'

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/lectures',
          '/lectures/*',
          '/practices',
          '/practices/*',
          '/blog',
          '/blog/*',
          '/upgrade',
          '/login',
          '/register',
        ],
        disallow: [
          '/dashboard',
          '/dashboard/*',
          '/exam/*',
          '/mobile-upload',
          '/student',
          '/profile',
          '/ui-lab',
          '/api/*',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
