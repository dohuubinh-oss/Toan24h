'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { 
  Search, Sparkles, Clock, Calendar, ArrowRight, BookOpen, Send, 
  CheckCircle2, Tag, Mail, Layers, Edit3, PlusCircle, Play, ChevronRight, RefreshCw 
} from 'lucide-react'
import { getBlogPosts, BLOG_CATEGORIES, BlogPost } from '@/data/blogData'
import { Pagination } from '@/components/ui/Pagination'
import { getAvatarInitial } from '@/lib/utils'

export default function BlogListPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [emailInput, setEmailInput] = useState<string>('')
  const [subscribed, setSubscribed] = useState<boolean>(false)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [isAdminOrTeacher, setIsAdminOrTeacher] = useState<boolean>(false)
  const ITEMS_PER_PAGE = 6

  useEffect(() => {
    setPosts(getBlogPosts())

    // Detect user role & auto-filter by grade for student role
    try {
      const getCookie = (name: string) => {
        const value = `; ${document.cookie}`
        const parts = value.split(`; ${name}=`)
        if (parts.length === 2) return parts.pop()?.split(';').shift()
        return undefined
      }

      const role = getCookie('userRole')
      const grade = getCookie('userGrade')

      let roleMatch = role === 'admin' || role === 'teacher'
      if (!roleMatch) {
        try {
          const userStored = localStorage.getItem('user')
          if (userStored) {
            const parsed = JSON.parse(userStored)
            if (parsed.role === 'admin' || parsed.role === 'teacher') {
              roleMatch = true
            }
          }
        } catch (_) {}
      }
      setIsAdminOrTeacher(roleMatch)

      if (role === 'student' && grade && ['6', '7', '8', '9'].includes(grade)) {
        setSelectedCategory(`Toan-${grade}`)
      }
    } catch (_) {}
  }, [])

  // Find featured post
  const featuredPost = useMemo(() => {
    return posts.find(post => post.featured) || posts[0]
  }, [posts])

  // Filter posts
  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory
      const matchesSearch = searchQuery.trim() === '' || 
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))

      return matchesCategory && matchesSearch
    })
  }, [posts, selectedCategory, searchQuery])

  // Reset pagination when filter or search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedCategory, searchQuery])

  // Paginated posts
  const totalItems = filteredPosts.length
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1
  const startIndex = totalItems > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0
  const endIndex = Math.min(currentPage * ITEMS_PER_PAGE, totalItems)
  const paginatedPosts = useMemo(() => {
    return filteredPosts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
  }, [filteredPosts, currentPage, ITEMS_PER_PAGE])

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault()
    if (emailInput.trim()) {
      setSubscribed(true)
      setEmailInput('')
      setTimeout(() => setSubscribed(false), 5000)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Standard System Header with Breadcrumbs & Action Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-2 font-medium">
              <Link href="/dashboard" className="hover:text-primary cursor-pointer transition-colors">Trang chủ</Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              <span className="text-primary font-bold">Góc học tập & Blog</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
              <BookOpen className="w-7 h-7 text-primary shrink-0" />
              <span>Góc Học Tập & Bí Quyết Ôn Thi Toán THCS</span>
              <span className="text-slate-400 font-normal text-base sm:text-lg">({totalItems} bài viết)</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Tổng hợp phương pháp giải nhanh Toán THCS, mẹo bấm máy tính CASIO và chiến thuật thi vào 10 đạt điểm 9+.
            </p>
          </div>

          {isAdminOrTeacher && (
            <div className="shrink-0">
              <Link
                href="/dashboard/blog/create"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs hover:bg-primary/90 transition-all min-h-[42px] cursor-pointer"
                aria-label="Tạo bài viết mới"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Viết bài mới</span>
              </Link>
            </div>
          )}
        </div>

        {/* Top Toolbar: Category Tabs & Search Bar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            {BLOG_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer min-h-[40px] flex items-center justify-center ${
                  selectedCategory === cat.id
                    ? 'bg-primary text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full lg:w-80 shrink-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Tìm bài viết, mẹo Casio, dạng toán..."
              aria-label="Tìm kiếm bài viết, chủ đề"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all min-h-[40px]"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold p-1"
                aria-label="Xóa tìm kiếm"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Featured Article Spotlight (Full Width) */}
        {featuredPost && searchQuery === '' && selectedCategory === 'all' && currentPage === 1 && (
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-xl hover:border-primary/30 transition-all duration-300 overflow-hidden group">
            <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
              <div className="lg:col-span-7 relative h-64 sm:h-80 lg:h-full min-h-[320px] overflow-hidden bg-slate-100">
                <Image 
                  src={featuredPost.coverImage} 
                  alt={featuredPost.title}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-4 left-4 z-10 flex items-center gap-2 flex-wrap">
                  <span className="px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-bold shadow-md flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Bài viết Nổi bật
                  </span>
                  {featuredPost.postType === 'shorts_playlist' && (
                    <span className="px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold shadow-md flex items-center gap-1.5">
                      <Play className="w-3.5 h-3.5 fill-white" />
                      Playlist Shorts
                    </span>
                  )}
                </div>
              </div>
              <div className="lg:col-span-5 p-6 sm:p-8 lg:p-10 space-y-5 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-xs font-semibold text-slate-500">
                    <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-bold">
                      {featuredPost.categoryLabel}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {featuredPost.publishedAt}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {featuredPost.readTime}
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 group-hover:text-primary transition-colors leading-snug">
                    <Link href={`/blog/${featuredPost.slug}`}>
                      {featuredPost.title}
                    </Link>
                  </h2>
                  {featuredPost.summary && (
                    <p className="text-xs sm:text-sm text-slate-600 font-medium line-clamp-3 leading-relaxed mt-2">
                      {featuredPost.summary}
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    {featuredPost.author.avatar ? (
                      <img 
                        src={featuredPost.author.avatar} 
                        alt={featuredPost.author.name}
                        className="w-10 h-10 rounded-full object-cover border-2 border-primary/20 bg-slate-100"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      className={`w-10 h-10 rounded-full bg-primary/10 text-primary border border-primary/20 items-center justify-center font-bold text-xs uppercase shrink-0 ${featuredPost.author.avatar ? 'hidden' : 'flex'}`}
                    >
                      {getAvatarInitial(featuredPost.author.name)}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{featuredPost.author.name || 'Nhóm Toan6789'}</h4>
                      <p className="text-xs text-slate-500 font-medium">{featuredPost.author.role || 'Ban biên tập Toan6789'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isAdminOrTeacher && (
                      <Link 
                        href={`/dashboard/blog/create?id=${featuredPost.id}`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[38px] bg-amber-50 border border-amber-200 text-amber-700 rounded-xl text-xs font-bold hover:bg-amber-100 transition-all shadow-2xs cursor-pointer"
                        aria-label="Chỉnh sửa bài viết nổi bật"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                        Sửa bài
                      </Link>
                    )}
                    <Link 
                      href={`/blog/${featuredPost.slug}`}
                      className="inline-flex items-center gap-2 px-4 py-2 min-h-[38px] bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 transition-all shadow-xs group-hover:gap-3"
                    >
                      Đọc ngay
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3-Column Clean Academic Article Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" />
              <span>Danh sách bài viết</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {totalItems} bài
              </span>
            </h3>
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="text-xs font-semibold text-primary hover:underline cursor-pointer"
              >
                Xóa bộ lọc tìm kiếm
              </button>
            )}
          </div>

          {paginatedPosts.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center space-y-4 shadow-xs">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
              <div className="space-y-1">
                <h4 className="text-base font-bold text-slate-700">Không tìm thấy bài viết phù hợp</h4>
                <p className="text-xs text-slate-500">Thử thay đổi từ khóa tìm kiếm hoặc chọn danh mục bài viết khác.</p>
              </div>
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => { setSelectedCategory('all'); setSearchQuery(''); }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-xs font-bold rounded-xl shadow-xs hover:bg-primary/90 transition-all min-h-[40px] cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Xem tất cả bài viết</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
              {paginatedPosts.map((post, index) => (
                <article 
                  key={`${post.id}-${post.slug || index}`}
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-primary/30 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between overflow-hidden group"
                >
                  <div className="space-y-4">
                    {/* Cover Image */}
                    <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                      <Image 
                        src={post.coverImage} 
                        alt={post.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        loading={index < 3 ? 'eager' : 'lazy'}
                        priority={index < 3}
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 flex-wrap">
                        <span className="px-2.5 py-1 rounded-lg bg-white/95 backdrop-blur-xs text-primary font-bold text-xs shadow-xs">
                          {post.categoryLabel}
                        </span>
                        {post.postType === 'shorts_playlist' && (
                          <span className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-bold text-xs shadow-xs flex items-center gap-1">
                            <Play className="w-3 h-3 fill-white" />
                            Playlist Shorts
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="px-5 space-y-2.5">
                      <div className="flex items-center gap-3 text-xs font-medium text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {post.publishedAt}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {post.readTime}
                        </span>
                      </div>

                      <h4 className="text-base font-bold text-slate-900 group-hover:text-primary transition-colors leading-snug line-clamp-2">
                        <Link href={`/blog/${post.slug}`}>
                          {post.title}
                        </Link>
                      </h4>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {post.tags.slice(0, 3).map((tag, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs font-medium flex items-center gap-1">
                            <Tag className="w-3 h-3 text-slate-400" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Footer with Author & Action Buttons */}
                  <div className="p-5 pt-4 border-t border-slate-100 mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      {post.author.avatar ? (
                        <img 
                          src={post.author.avatar} 
                          alt={post.author.name}
                          className="w-7 h-7 rounded-full object-cover border border-slate-200 bg-slate-100"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div 
                        className={`w-7 h-7 rounded-full bg-primary/10 text-primary border border-primary/20 items-center justify-center font-bold text-xs uppercase shrink-0 ${post.author.avatar ? 'hidden' : 'flex'}`}
                      >
                        {getAvatarInitial(post.author.name)}
                      </div>
                      <span className="text-xs font-semibold text-slate-700 truncate max-w-[120px]">
                        {post.author.name || 'Nhóm Toan6789'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isAdminOrTeacher && (
                        <Link 
                          href={`/dashboard/blog/create?id=${post.id}`}
                          className="px-3 py-1.5 min-h-[36px] rounded-lg bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                          aria-label={`Chỉnh sửa bài viết ${post.title}`}
                        >
                          <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                          Sửa
                        </Link>
                      )}
                      <Link 
                        href={`/blog/${post.slug}`}
                        className="text-xs font-bold text-primary hover:text-blue-700 flex items-center gap-1 group-hover:translate-x-1 transition-transform min-h-[36px] py-1"
                      >
                        {post.postType === 'shorts_playlist' ? (
                          <>
                            <Play className="w-3 h-3 fill-primary" />
                            Xem Shorts
                          </>
                        ) : (
                          <>
                            Đọc tiếp
                            <ArrowRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {totalItems > 0 && (
            <div className="pt-6 border-t border-slate-200/80">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                startIndex={startIndex}
                endIndex={endIndex}
                itemName="bài viết"
                onPageChange={(page) => {
                  setCurrentPage(page)
                  window.scrollTo({ top: 300, behavior: 'smooth' })
                }}
              />
            </div>
          )}
        </div>

        {/* Full-width Newsletter Subscription Banner */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 text-white rounded-3xl p-6 sm:p-8 lg:p-10 shadow-lg relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center lg:text-left max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-bold uppercase tracking-wider text-amber-300">
                <Mail className="w-3.5 h-3.5" />
                <span>Bản tin học tập Toan6789</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Đăng ký nhận mẹo giải nhanh & đề thi chọn lọc
              </h3>
              <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
                Nhận ngay các bí quyết bấm máy tính Casio Toán 9, phương pháp giải toán hình học và đề thi thử vào 10 mới nhất gửi trực tiếp vào hòm thư.
              </p>
            </div>

            <div className="w-full lg:w-auto min-w-[320px] max-w-md">
              {subscribed ? (
                <div className="p-4 bg-emerald-500/25 border border-emerald-400/40 rounded-2xl flex items-center gap-3 text-white font-bold text-xs sm:text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
                  <span>Cảm ơn bạn đã đăng ký! Toan6789 sẽ gửi thông báo bài học mới nhất.</span>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2.5">
                  <input 
                    type="email" 
                    required
                    placeholder="Nhập email của bạn..."
                    aria-label="Email nhận bản tin"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="flex-1 px-4 py-3 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 text-white placeholder-blue-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-white/50 min-h-[44px]"
                  />
                  <button
                    type="submit"
                    className="px-6 py-3 bg-white text-primary hover:bg-slate-50 font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95 shrink-0 min-h-[44px]"
                  >
                    <Send className="w-4 h-4 text-primary" />
                    <span>Đăng ký</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
