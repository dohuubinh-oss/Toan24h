import { describe, it, expect, beforeEach } from 'vitest'
import { addBlogPost, getBlogPosts, BlogPost } from './blogData'

describe('blogData addBlogPost multiple featured posts', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('preserves existing featured posts when adding a new featured post', () => {
    const post1: BlogPost = {
      id: 'custom-feat-1',
      slug: 'custom-feat-1',
      title: 'Bài viết Nổi bật 1',
      content: 'Nội dung 1',
      category: 'Bi-Quyet-Thi',
      categoryLabel: 'Bí quyết thi',
      coverImage: 'https://example.com/1.jpg',
      author: { name: 'Thầy A', avatar: '', role: 'GV' },
      publishedAt: '01/11/2026',
      readTime: '5 phút',
      featured: true,
      tags: ['toan'],
    }

    const post2: BlogPost = {
      id: 'custom-feat-2',
      slug: 'custom-feat-2',
      title: 'Bài viết Nổi bật 2',
      content: 'Nội dung 2',
      category: 'Meo-Casio',
      categoryLabel: 'Mẹo Casio',
      coverImage: 'https://example.com/2.jpg',
      author: { name: 'Thầy B', avatar: '', role: 'GV' },
      publishedAt: '01/11/2026',
      readTime: '5 phút',
      featured: true,
      tags: ['casio'],
    }

    addBlogPost(post1)
    addBlogPost(post2)

    const allPosts = getBlogPosts()
    const p1 = allPosts.find((p) => p.id === 'custom-feat-1')
    const p2 = allPosts.find((p) => p.id === 'custom-feat-2')

    expect(p1?.featured).toBe(true)
    expect(p2?.featured).toBe(true)
  })
})
