import { MetadataRoute } from 'next'
import { getBlogPosts } from '@/data/blogData'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://toan6789.vn'
  const currentDate = new Date()

  // 1. Static high-priority pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/upgrade`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/exams`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/lectures`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/practices`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]

  // 2. Grade-specific routes (Classes 6, 7, 8, 9)
  const grades = [6, 7, 8, 9]
  const gradeRoutes: MetadataRoute.Sitemap = []

  grades.forEach((grade) => {
    gradeRoutes.push(
      {
        url: `${baseUrl}/exams/lop/${grade}`,
        lastModified: currentDate,
        changeFrequency: 'daily',
        priority: 0.9,
      },
      {
        url: `${baseUrl}/lectures/lop/${grade}`,
        lastModified: currentDate,
        changeFrequency: 'weekly',
        priority: 0.8,
      },
      {
        url: `${baseUrl}/practices/lop/${grade}`,
        lastModified: currentDate,
        changeFrequency: 'daily',
        priority: 0.8,
      }
    )
  })

  // 3. Blog posts dynamic routes
  let blogRoutes: MetadataRoute.Sitemap = []
  try {
    const posts = getBlogPosts()
    blogRoutes = posts.map((post) => {
      let lastModified = currentDate
      if (post.publishedAt) {
        const parsed = new Date(post.publishedAt)
        if (!isNaN(parsed.getTime())) {
          lastModified = parsed
        }
      }
      return {
        url: `${baseUrl}/blog/${post.slug}`,
        lastModified,
        changeFrequency: 'weekly',
        priority: 0.7,
      }
    })
  } catch (e) {
    console.error('Failed to load blog posts for sitemap:', e)
  }

  return [...staticRoutes, ...gradeRoutes, ...blogRoutes]
}
