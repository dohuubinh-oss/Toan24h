'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Search, Sparkles, Clock, Calendar, ArrowRight, BookOpen, Send, CheckCircle2, ChevronLeft, ChevronRight, Tag } from 'lucide-react'
import { getBlogPosts, BLOG_CATEGORIES, BlogPost } from '@/data/blogData'

export default function BlogListPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [emailInput, setEmailInput] = useState<string>('')
  const [subscribed, setSubscribed] = useState<boolean>(false)

  useEffect(() => {
    setPosts(getBlogPosts())
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

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault()
    if (emailInput.trim()) {
      setSubscribed(true)
      setEmailInput('')
      setTimeout(() => setSubscribed(false), 5000)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Page Header */}
        <div className="text-center space-y-3 max-w-3xl mx-auto pt-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-extrabold uppercase tracking-wider border border-primary/20">
            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            Góc Học Tập & Tin Tức Toán 24h
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Kinh Nghiệm Học Tập & <span className="text-primary bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Bí Quyết Chinh Phục Điểm 9+</span>
          </h1>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            Tổng hợp phương pháp giải nhanh Toán THPT Quốc gia, mẹo bấm máy tính CASIO, và hướng dẫn khai thác tối đa Trợ lý AI Toan24h.
          </p>
        </div>

        {/* Hero Section: Featured Article */}
        {featuredPost && searchQuery === '' && selectedCategory === 'all' && (
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-xl hover:border-primary/30 transition-all duration-300 overflow-hidden group">
            <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
              <div className="lg:col-span-7 relative h-64 sm:h-80 lg:h-full min-h-[320px] overflow-hidden">
                <img 
                  src={featuredPost.coverImage} 
                  alt={featuredPost.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-bold shadow-md flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Bài viết Nổi bật
                  </span>
                </div>
              </div>
              <div className="lg:col-span-5 p-6 sm:p-8 lg:p-10 space-y-5 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-xs font-semibold text-slate-500">
                    <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-bold">
                      {featuredPost.categoryLabel}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {featuredPost.publishedAt}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {featuredPost.readTime}
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 group-hover:text-primary transition-colors leading-snug">
                    <Link href={`/blog/${featuredPost.slug}`}>
                      {featuredPost.title}
                    </Link>
                  </h2>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img 
                      src={featuredPost.author.avatar} 
                      alt={featuredPost.author.name}
                      className="w-10 h-10 rounded-full object-cover border-2 border-primary/20"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{featuredPost.author.name}</h4>
                      <p className="text-[11px] text-slate-500">{featuredPost.author.role}</p>
                    </div>
                  </div>
                  <Link 
                    href={`/blog/${featuredPost.slug}`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all shadow-xs group-hover:gap-3"
                  >
                    Đọc ngay
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filter Tabs & Search Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/70 shadow-xs">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 custom-scrollbar">
            {BLOG_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
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
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Tìm kiếm bài viết, chủ đề..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
        </div>

        {/* Articles Grid Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Danh sách bài viết ({filteredPosts.length})
            </h3>
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Xóa tìm kiếm
              </button>
            )}
          </div>

          {filteredPosts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center space-y-3">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="text-base font-bold text-slate-700">Không tìm thấy bài viết phù hợp</h4>
              <p className="text-xs text-slate-500">Thử thay đổi từ khóa tìm kiếm hoặc chọn danh mục bài viết khác.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {filteredPosts.map(post => (
                <article 
                  key={post.id}
                  className="bg-white rounded-2xl border border-slate-200/70 shadow-xs hover:border-primary/30 hover:shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden group"
                >
                  <div className="space-y-4">
                    {/* Image */}
                    <div className="relative h-48 overflow-hidden bg-slate-100">
                      <img 
                        src={post.coverImage} 
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3">
                        <span className="px-2.5 py-1 rounded-lg bg-white/90 backdrop-blur-xs text-primary font-bold text-[11px] shadow-xs">
                          {post.categoryLabel}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="px-5 space-y-2.5">
                      <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {post.publishedAt}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
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
                        {post.tags.map((tag, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium flex items-center gap-1">
                            <Tag className="w-2.5 h-2.5 text-slate-400" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="p-5 pt-4 border-t border-slate-100 mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <img 
                        src={post.author.avatar} 
                        alt={post.author.name}
                        className="w-7 h-7 rounded-full object-cover border border-slate-200"
                      />
                      <span className="text-xs font-semibold text-slate-700 truncate max-w-[120px]">
                        {post.author.name}
                      </span>
                    </div>

                    <Link 
                      href={`/blog/${post.slug}`}
                      className="text-xs font-bold text-primary hover:text-blue-700 flex items-center gap-1 group-hover:translate-x-1 transition-transform"
                    >
                      Đọc tiếp
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        {/* Newsletter Subscription Card (DESIGN.md Standard) */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-3xl p-8 sm:p-10 shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="relative z-10 max-w-2xl mx-auto text-center space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md text-amber-300 mx-auto flex items-center justify-center border border-white/20 shadow-inner">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Đăng ký Nhận Bí Quyết Ôn Thi & Tin Tức Mới Nhất
            </h3>
            
            <p className="text-blue-100 text-xs sm:text-sm leading-relaxed">
              Cập nhật định kỳ các mẹo bấm máy CASIO, tuyển tập đề thi thử có đáp án chi tiết và các tính năng AI luyện thi mới nhất từ Toan24h.
            </p>

            {subscribed ? (
              <div className="p-4 bg-emerald-500/20 border border-emerald-400/40 rounded-2xl flex items-center justify-center gap-2 text-white font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                <span>Cảm ơn bạn đã đăng ký nhận tin từ Toan24h!</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input 
                  type="email" 
                  required
                  placeholder="Nhập email của bạn..."
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-blue-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-white text-blue-700 hover:bg-blue-50 font-extrabold text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95 whitespace-nowrap"
                >
                  <Send className="w-4 h-4 text-blue-700" />
                  Đăng ký ngay
                </button>
              </form>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
