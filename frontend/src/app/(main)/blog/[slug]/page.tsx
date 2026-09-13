'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Calendar, Clock, Share2, Sparkles, BookOpen, ChevronRight } from 'lucide-react'
import { getBlogPosts, BlogPost } from '@/data/blogData'
import MathText from '@/components/ui/MathText'
import { useToast } from '@/components/ui/ToastProvider'

export default function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = React.use(params)
  const toast = useToast()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setPosts(getBlogPosts())
    setLoaded(true)
  }, [])

  const post = posts.find(p => p.slug === slug)

  if (!loaded) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="flex items-center gap-3 text-slate-600 font-semibold text-sm">
          <BookOpen className="w-5 h-5 text-primary animate-pulse" />
          <span>Đang tải bài viết...</span>
        </div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
        <div className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-200/80 shadow-xs max-w-md space-y-4">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
          <h2 className="text-xl font-bold text-slate-800">Không tìm thấy bài viết</h2>
          <p className="text-xs text-slate-500">Bài viết bạn tìm kiếm không tồn tại hoặc đã được di chuyển.</p>
          <Link 
            href="/blog"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-xl shadow-xs hover:bg-blue-700 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại trang Blog
          </Link>
        </div>
      </div>
    )
  }

  // Get related posts (excluding current post)
  const relatedPosts = posts
    .filter(p => p.id !== post.id)
    .slice(0, 3)

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href)
      toast.success("Đã sao chép liên kết bài viết!")
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Breadcrumb Navigation - Left Aligned */}
        <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
          <Link href="/blog" className="hover:text-primary transition-colors">Blog</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-primary font-bold">{post.categoryLabel}</span>
        </div>

        {/* Article Main Card */}
        <article className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden p-6 sm:p-10 space-y-4">
          
          {/* Title */}
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 leading-snug tracking-tight">
            {post.title}
          </h1>

          {/* Author, Date/ReadTime & Share Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-1">
            {/* Left: Author */}
            <div className="flex items-center gap-3">
              <img 
                src={post.author.avatar} 
                alt={post.author.name}
                className="w-11 h-11 rounded-full object-cover border-2 border-primary/20"
              />
              <div>
                <h4 className="text-xs font-bold text-slate-900">{post.author.name}</h4>
                <p className="text-[11px] text-slate-500">{post.author.role}</p>
              </div>
            </div>

            {/* Right: Date & Reading Time directly to the left of Share Button */}
            <div className="flex items-center gap-4 sm:gap-5">
              <div className="flex items-center gap-3 sm:gap-4 text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {post.publishedAt}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {post.readTime}
                </span>
              </div>

              {/* Share Button */}
              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-primary text-xs font-bold transition-all cursor-pointer border border-slate-200/60"
              >
                <Share2 className="w-4 h-4" />
                Chia sẻ
              </button>
            </div>
          </div>

          {/* Article Body directly under author without gap */}
          <div className="text-slate-800 leading-relaxed text-sm sm:text-base font-sans pt-0 mt-0 [&_p:first-child]:mt-0 [&_img:first-child]:mt-1 [&_img]:w-full [&_img]:h-auto [&_img]:rounded-2xl [&_img]:mb-6 [&_img]:object-cover [&_img]:shadow-xs">
            <MathText content={post.content} />
          </div>

        </article>

        {/* Related Articles Section */}
        {relatedPosts.length > 0 && (
          <div className="space-y-5 pt-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Bài viết liên quan
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map(rel => (
                <Link 
                  key={rel.id} 
                  href={`/blog/${rel.slug}`}
                  className="bg-white rounded-2xl border border-slate-200/70 p-4 shadow-xs hover:border-primary/30 hover:shadow-md transition-all group flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="h-32 rounded-xl overflow-hidden bg-slate-100">
                      <img 
                        src={rel.coverImage} 
                        alt={rel.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-primary font-bold text-[10px]">
                      {rel.categoryLabel}
                    </span>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                      {rel.title}
                    </h4>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-100 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {rel.readTime}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
