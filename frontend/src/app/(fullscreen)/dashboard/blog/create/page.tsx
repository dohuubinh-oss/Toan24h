'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, Sparkles, Eye, Edit3, Send, 
  Tag, Link as LinkIcon, FileText, User, Clock, Calendar 
} from 'lucide-react'
import SharedEditorCard from '@/components/questions/creator/editor/SharedEditorCard'
import MathText from '@/components/ui/MathText'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/ToastProvider'
import { useSearchParams } from 'next/navigation'
import { addBlogPost, getBlogPostByIdOrSlug, BlogPost } from '@/data/blogData'
import { Suspense } from 'react'

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
}

export default function CreateBlogPostPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-500 font-semibold text-sm">Đang tải...</div>}>
      <CreateBlogPostContent />
    </Suspense>
  )
}

function CreateBlogPostContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const toast = useToast()

  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit')
  const [editPostId, setEditPostId] = useState<string | null>(null)

  // Form Fields State
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [isCustomSlug, setIsCustomSlug] = useState(false)
  const [isFeatured, setIsFeatured] = useState(false)
  const [summary, setSummary] = useState('')
  const [category, setCategory] = useState<BlogPost['category']>('Bi-Quyet-Thi')
  const [categoryLabel, setCategoryLabel] = useState('Bí quyết thi THPT')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>(['Toán học'])
  const [authorName, setAuthorName] = useState('Nhóm Toan6789')
  const [authorRole, setAuthorRole] = useState('Ban biên tập Toan6789')
  const [authorAvatar, setAuthorAvatar] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200')
  
  // Editor Content State (empty by default)
  const [content, setContent] = useState('')

  // Check for Edit Mode via Query Params
  useEffect(() => {
    const id = searchParams.get('id') || searchParams.get('slug')
    if (id) {
      const existing = getBlogPostByIdOrSlug(id)
      if (existing) {
        setEditPostId(existing.id)
        setTitle(existing.title)
        setSlug(existing.slug)
        setIsCustomSlug(true)
        setIsFeatured(!!existing.featured)
        setSummary(existing.summary || '')
        setCategory(existing.category)
        setCategoryLabel(existing.categoryLabel)
        setTags(existing.tags || ['Toán học'])
        setContent(existing.content || '')
        if (existing.author) {
          setAuthorName(existing.author.name || '')
          setAuthorRole(existing.author.role || '')
          setAuthorAvatar(existing.author.avatar || '')
        }
        return
      }
    }

    // Otherwise Load logged in author information for new post
    try {
      const cached = localStorage.getItem('user')
      if (cached) {
        const u = JSON.parse(cached)
        if (u.fullName) setAuthorName(u.fullName)
        if (u.telegramAvt) setAuthorAvatar(u.telegramAvt)
        if (u.role === 'teacher') setAuthorRole('Giáo viên Toán 6789')
        else if (u.role === 'admin') setAuthorRole('Ban Quản Trị Toan6789')
      }
    } catch (_) {}
  }, [searchParams])

  // Auto-generate slug from title unless manually edited
  useEffect(() => {
    if (!isCustomSlug && title) {
      setSlug(slugify(title))
    }
  }, [title, isCustomSlug])

  const handleCategoryChange = (catKey: BlogPost['category']) => {
    setCategory(catKey)
    switch (catKey) {
      case 'Bi-Quyet-Thi':
        setCategoryLabel('Bí quyết thi THPT')
        break
      case 'Tin-Tuc':
        setCategoryLabel('Tin tức & Sự kiện')
        break
      case 'Toan-6':
        setCategoryLabel('Toán lớp 6')
        break
      case 'Toan-7':
        setCategoryLabel('Toán lớp 7')
        break
      case 'Toan-8':
        setCategoryLabel('Toán lớp 8')
        break
      case 'Toan-9':
        setCategoryLabel('Toán lớp 9')
        break
      case 'Meo-Casio':
        setCategoryLabel('Mẹo Casio')
        break
    }
  }

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove))
  }

  const extractFirstImageFromContent = (htmlContent: string): string => {
    const match = htmlContent.match(/<img[^>]+src=["']([^"']+)["']/i)
    return match ? match[1] : 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=1200'
  }

  const handlePublish = () => {
    if (!title.trim()) {
      toast.error("Vui lòng nhập Tiêu đề bài viết!")
      return
    }
    if (isFeatured && !summary.trim()) {
      toast.error("Vui lòng nhập Mô tả ngắn cho bài viết Nổi bật!")
      return
    }
    if (!content.trim()) {
      toast.error("Vui lòng nhập Nội dung bài viết!")
      return
    }

    const finalSlug = slug || slugify(title) || `bai-viet-${Date.now()}`
    const coverImage = extractFirstImageFromContent(content)

    const newPost: BlogPost = {
      id: editPostId || String(Date.now()),
      slug: finalSlug,
      title: title.trim(),
      summary: isFeatured ? summary.trim() : undefined,
      content: content,
      category: category,
      categoryLabel: categoryLabel,
      coverImage: coverImage,
      author: {
        name: authorName.trim() || 'Biên tập viên Toan6789',
        avatar: authorAvatar,
        role: authorRole.trim() || 'Ban biên tập Toan6789'
      },
      publishedAt: 'Hôm nay',
      readTime: '5 phút đọc',
      featured: isFeatured,
      tags: tags.length > 0 ? tags : ['Toán6789']
    }

    addBlogPost(newPost)
    toast.success(editPostId ? "Cập nhật bài viết Blog thành công!" : "Xuất bản bài viết Blog thành công!")
    router.push(`/blog/${finalSlug}`)
  }

  return (
    <div className="bg-slate-50 min-h-screen font-sans pb-20 lg:pb-0">
      {/* Header matching http://localhost:3000/dashboard/questions/create */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 w-full">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/blog" className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-slate-800">
                {editPostId ? 'Chỉnh sửa bài viết Blog' : 'Tạo bài viết Blog mới'}
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Mode Switcher */}
            <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('edit')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'edit'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5 text-primary" />
                Soạn thảo
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'preview'
                    ? 'bg-white text-primary shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Eye className="w-3.5 h-3.5 text-primary" />
                Xem trước
              </button>
            </div>

            <Button onClick={handlePublish} className="px-6 flex items-center gap-2 shadow-sm shadow-primary/20">
              <Send className="w-4 h-4" />
              Xuất bản bài viết
            </Button>
          </div>
        </div>
      </header>

      {/* Main Layout matching http://localhost:3000/dashboard/questions/create */}
      <main className="max-w-7xl mx-auto p-4 lg:p-6 pb-28 lg:pb-28">
        {activeTab === 'edit' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column - Title, Slug & Content Editor (8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Title & Slug Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                {/* Title Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-primary" />
                    Tiêu đề bài viết <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text"
                    required
                    placeholder="Nhập tiêu đề bài viết..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>

                {/* Short Summary (Only shown when Featured Toggle is ON) */}
                {isFeatured && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-100 animate-in fade-in duration-200">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      Mô tả ngắn bài viết nổi bật <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Nhập đoạn mô tả ngắn hiển thị ngay bên dưới tiêu đề bài viết..."
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      className="w-full px-4 py-2.5 bg-amber-50/50 border border-amber-200 rounded-xl text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                    />
                  </div>
                )}

                {/* Slug Input */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                    <span className="flex items-center gap-1">
                      <LinkIcon className="w-3.5 h-3.5 text-slate-400" />
                      Đường dẫn tĩnh (Slug):
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsCustomSlug(!isCustomSlug)}
                      className="text-primary font-bold hover:underline"
                    >
                      {isCustomSlug ? 'Tự động tạo' : 'Tùy chỉnh Slug'}
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-2 bg-slate-100 text-slate-500 text-xs font-medium rounded-xl border border-slate-200 select-none">
                      /blog/
                    </span>
                    <input 
                      type="text"
                      readOnly={!isCustomSlug}
                      value={slug}
                      onChange={(e) => setSlug(slugify(e.target.value))}
                      className={`flex-1 px-3.5 py-2 border text-xs font-mono rounded-xl transition-all ${
                        isCustomSlug 
                          ? 'bg-white border-primary text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20' 
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Content Editor Card matching Question Editor Layout */}
              <SharedEditorCard
                title="Nội dung bài blog"
                icon={<FileText className="text-primary w-5 h-5" />}
                content={content}
                onContentChange={setContent}
                placeholder="Nhập nội dung bài blog..."
              />

            </div>

            {/* Right Column - Settings & Metadata Sidebar (4 cols) */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Phân loại & Thẻ từ khóa Box (Tích hợp Bài viết Nổi bật) */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center justify-between">
                  <span>Phân loại & Thẻ từ khóa</span>
                  <Tag className="w-4 h-4 text-slate-400" />
                </h3>

                {/* Featured Post Toggle Item */}
                <div className="p-3.5 bg-amber-50/60 border border-amber-200/80 rounded-xl space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 cursor-pointer select-none">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        Bài viết Nổi bật
                      </label>
                      <p className="text-[11px] text-slate-500">Đánh dấu bài nổi bật trên đầu trang Blog</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={isFeatured}
                        onChange={(e) => setIsFeatured(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                  </div>
                  {isFeatured && (
                    <p className="text-[11px] text-amber-700 font-medium border-t border-amber-200/60 pt-2 leading-relaxed">
                      ⚠️ Khi bật toggle này, bài viết nổi bật cũ sẽ tự động bỏ chọn.
                    </p>
                  )}
                </div>

                {/* Category Select */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Danh mục bài blog</label>
                  <select 
                    value={category}
                    onChange={(e) => handleCategoryChange(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
                  >
                    <option value="Bi-Quyet-Thi">Bí quyết thi THPT</option>
                    <option value="Tin-Tuc">Tin tức & Sự kiện</option>
                    <option value="Toan-6">Toán lớp 6</option>
                    <option value="Toan-7">Toán lớp 7</option>
                    <option value="Toan-8">Toán lớp 8</option>
                    <option value="Toan-9">Toán lớp 9</option>
                    <option value="Meo-Casio">Mẹo Casio</option>
                  </select>
                </div>

                {/* Tags Section */}
                <div className="space-y-2.5 pt-1">
                  <label className="text-xs font-bold text-slate-700">Thẻ từ khóa (Tags)</label>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      placeholder="Nhập thẻ..."
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }}
                      className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                    >
                      Thêm
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((t, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-bold flex items-center gap-1 border border-primary/20">
                        #{t}
                        <button 
                          type="button" 
                          onClick={() => handleRemoveTag(t)}
                          className="hover:text-red-600 transition-colors"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

            </div>

          </div>
        ) : (
          /* Live Preview Mode (Matches DESIGN.md and /blog/[slug]) */
          <div className="space-y-6">
            <div className="p-4 bg-primary/10 border border-primary/20 rounded-2xl flex items-center gap-3 text-primary text-xs font-bold">
              <Eye className="w-4 h-4 shrink-0" />
              <span>Chế độ Xem trước Thời gian thực (Live Preview Mode) — Hiển thị giao diện bài viết như khi xuất bản.</span>
            </div>

            <article className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden max-w-4xl mx-auto p-6 sm:p-10 space-y-4">
              {/* Header Info */}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 leading-snug tracking-tight">
                {title || "Tiêu đề bài viết chưa nhập"}
              </h1>

              {isFeatured && summary && (
                <p className="text-sm sm:text-base text-slate-600 font-medium italic border-l-4 border-amber-400 pl-4 py-1.5 bg-amber-50/50 rounded-r-xl my-2">
                  {summary}
                </p>
              )}

              {/* Author & Date/ReadTime Bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-1">
                <div className="flex items-center gap-3">
                  <img 
                    src={authorAvatar} 
                    alt={authorName}
                    className="w-11 h-11 rounded-full object-cover border-2 border-primary/20"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{authorName}</h4>
                    <p className="text-[11px] text-slate-500">{authorRole}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Hôm nay
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    5 phút đọc
                  </span>
                </div>
              </div>

              {/* Article Content with LaTeX MathText */}
              <div className="text-slate-800 leading-relaxed text-sm sm:text-base font-sans pt-0 mt-0 [&_p:first-child]:mt-0 [&_img:first-child]:mt-1 [&_img]:w-full [&_img]:h-auto [&_img]:rounded-2xl [&_img]:mb-6 [&_img]:object-cover [&_img]:shadow-xs">
                <MathText content={content} />
              </div>
            </article>
          </div>
        )}
      </main>
    </div>
  )
}
