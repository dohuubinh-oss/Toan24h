'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, Sparkles, Eye, Edit3, Send, 
  Tag, Link as LinkIcon, FileText, User, Clock, Calendar,
  Plus, Trash2, ArrowUp, ArrowDown, Video, Layers
} from 'lucide-react'
import SharedEditorCard from '@/components/questions/creator/editor/SharedEditorCard'
import MathText from '@/components/ui/MathText'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/ToastProvider'
import { useSearchParams } from 'next/navigation'
import { addBlogPost, getBlogPostByIdOrSlug, BlogPost, BlogPostType, ShortItem } from '@/data/blogData'
import { extractYouTubeVideoId, parseShortsPlaylist } from '@/lib/youtubeUtils'
import { ShortsPlaylistStage } from '@/components/blog/ShortsPlaylistStage'
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
  const [postType, setPostType] = useState<BlogPostType>('standard')
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
  
  // Editor Content State (for standard articles)
  const [content, setContent] = useState('')

  // Shorts Playlist State (for shorts_playlist articles)
  const [shortsList, setShortsList] = useState<ShortItem[]>([
    { id: '1', youtubeUrl: '', videoId: '', title: '', duration: '0:50', notes: '' }
  ])

  const handleAddShort = () => {
    setShortsList(prev => [
      ...prev,
      { id: String(Date.now()), youtubeUrl: '', videoId: '', title: '', duration: '0:50', notes: '' }
    ])
  }

  const handleRemoveShort = (index: number) => {
    if (shortsList.length <= 1) {
      toast.error("Phải giữ lại ít nhất 1 video Short trong playlist!")
      return
    }
    setShortsList(prev => prev.filter((_, idx) => idx !== index))
  }

  const handleMoveShort = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= shortsList.length) return
    setShortsList(prev => {
      const copy = [...prev]
      const temp = copy[index]
      copy[index] = copy[newIndex]
      copy[newIndex] = temp
      return copy
    })
  }

  const handleShortChange = (index: number, field: keyof ShortItem, value: string) => {
    setShortsList(prev => {
      const copy = [...prev]
      const item = { ...copy[index], [field]: value }
      if (field === 'youtubeUrl') {
        const extracted = extractYouTubeVideoId(value)
        if (extracted) {
          item.videoId = extracted
        }
      }
      copy[index] = item
      return copy
    })
  }

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
        if (existing.postType) setPostType(existing.postType)
        if (existing.playlistData) {
          const parsed = parseShortsPlaylist(existing.playlistData)
          if (parsed.length > 0) setShortsList(parsed)
        }
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

    let finalPlaylistData: string | undefined = undefined
    let coverImage = 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=1200'

    if (postType === 'shorts_playlist') {
      const validShorts = shortsList.filter(s => s.videoId && s.title.trim())
      if (validShorts.length === 0) {
        toast.error("Vui lòng nhập ít nhất 1 video Short với đường link và tiêu đề hợp lệ!")
        return
      }
      finalPlaylistData = JSON.stringify(validShorts)
      coverImage = `https://img.youtube.com/vi/${validShorts[0].videoId}/hqdefault.jpg`
    } else {
      if (!content.trim()) {
        toast.error("Vui lòng nhập Nội dung bài viết!")
        return
      }
      coverImage = extractFirstImageFromContent(content)
    }

    const finalSlug = slug || slugify(title) || `bai-viet-${Date.now()}`

    const newPost: BlogPost = {
      id: editPostId || String(Date.now()),
      slug: finalSlug,
      title: title.trim(),
      summary: isFeatured ? summary.trim() : undefined,
      content: content,
      postType: postType,
      playlistData: finalPlaylistData,
      category: category,
      categoryLabel: categoryLabel,
      coverImage: coverImage,
      author: {
        name: authorName.trim() || 'Biên tập viên Toan6789',
        avatar: authorAvatar,
        role: authorRole.trim() || 'Ban biên tập Toan6789'
      },
      publishedAt: 'Hôm nay',
      readTime: postType === 'shorts_playlist' ? `${shortsList.length} Shorts` : '5 phút đọc',
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
            
            {/* Left Column - Post Type, Title, Slug & Content/Shorts Editor (8 cols) */}
            <div className="lg:col-span-8 space-y-6">

              {/* Post Type Selector Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-primary" />
                  Định dạng bài viết
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label 
                    className={`flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                      postType === 'standard' 
                        ? 'border-primary bg-primary/5 text-primary' 
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                    }`}
                  >
                    <input 
                      type="radio" 
                      name="postType" 
                      value="standard" 
                      checked={postType === 'standard'} 
                      onChange={() => setPostType('standard')}
                      className="mt-0.5 text-primary focus:ring-primary"
                    />
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-slate-900 block">Bài viết chuẩn</span>
                      <span className="text-[11px] text-slate-500 block leading-tight">Bài giảng lý thuyết, tin tức giáo dục với văn bản & hình ảnh phong phú.</span>
                    </div>
                  </label>

                  <label 
                    className={`flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                      postType === 'shorts_playlist' 
                        ? 'border-primary bg-primary/5 text-primary' 
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                    }`}
                  >
                    <input 
                      type="radio" 
                      name="postType" 
                      value="shorts_playlist" 
                      checked={postType === 'shorts_playlist'} 
                      onChange={() => setPostType('shorts_playlist')}
                      className="mt-0.5 text-primary focus:ring-primary"
                    />
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-slate-900 block">Playlist Video Shorts</span>
                      <span className="text-[11px] text-slate-500 block leading-tight">Chuỗi video ngắn 9:16 (tips, mẹo Casio, giải nhanh) kèm ghi chú công thức đồng bộ.</span>
                    </div>
                  </label>
                </div>
              </div>
              
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

              {/* Conditional Content Editor */}
              {postType === 'standard' ? (
                <SharedEditorCard
                  title="Nội dung bài blog"
                  icon={<FileText className="text-primary w-5 h-5" />}
                  content={content}
                  onContentChange={setContent}
                  placeholder="Nhập nội dung bài blog..."
                />
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Video className="w-4 h-4 text-primary" />
                        Danh sách Video Shorts trong Playlist ({shortsList.length})
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Dán link YouTube Shorts và nhập ghi chú công thức toán học kèm theo từng video.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddShort}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      Thêm video Short
                    </button>
                  </div>

                  {shortsList.map((item, idx) => (
                    <div 
                      key={item.id || idx} 
                      className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 transition-all hover:border-slate-300"
                    >
                      {/* Short Header: #idx, title, move buttons, delete button */}
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-800">Video Short #{idx + 1}</span>
                          {item.videoId && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-mono font-semibold">
                              ID: {item.videoId}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveShort(idx, 'up')}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                            title="Di chuyển lên"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === shortsList.length - 1}
                            onClick={() => handleMoveShort(idx, 'down')}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                            title="Di chuyển xuống"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveShort(idx)}
                            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors ml-1 cursor-pointer"
                            title="Xóa video này"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        {/* YouTube URL & Duration */}
                        <div className="md:col-span-8 space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                            Đường link YouTube Short <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="url"
                            placeholder="Dán link YouTube Short (ví dụ: https://www.youtube.com/shorts/...)..."
                            value={item.youtubeUrl}
                            onChange={(e) => handleShortChange(idx, 'youtubeUrl', e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                          />
                        </div>

                        <div className="md:col-span-4 space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                            Thời lượng ước tính
                          </label>
                          <input
                            type="text"
                            placeholder="0:50"
                            value={item.duration || '0:50'}
                            onChange={(e) => handleShortChange(idx, 'duration', e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                          />
                        </div>

                        {/* Title */}
                        <div className="md:col-span-12 space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                            Tiêu đề của Video Short này <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="Ví dụ: Mẹo Casio 1: Bấm máy tìm cực trị hàm bậc 3..."
                            value={item.title}
                            onChange={(e) => handleShortChange(idx, 'title', e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                          />
                        </div>

                        {/* Notes (LaTeX formula markdown) */}
                        <div className="md:col-span-12 space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center justify-between">
                            <span>Ghi chú công thức toán học & các bước giải (Hỗ trợ LaTeX $...$)</span>
                            <span className="text-slate-400 normal-case font-normal text-[11px]">Đồng bộ bên phải video</span>
                          </label>
                          <textarea
                            rows={3}
                            placeholder="Nhập lý thuyết cốt lõi, công thức giải nhanh (ví dụ: $y = ax^3 + bx^2 + cx + d$), các phím bấm Casio..."
                            value={item.notes || ''}
                            onChange={(e) => handleShortChange(idx, 'notes', e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                          />
                          {item.notes && (
                            <div className="mt-2 p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-800">
                              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Xem trước công thức:</span>
                              <MathText content={item.notes} />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="pt-2 flex justify-center">
                    <button
                      type="button"
                      onClick={handleAddShort}
                      className="inline-flex items-center gap-2 px-5 py-2.5 border-2 border-dashed border-slate-300 hover:border-primary hover:bg-primary/5 text-slate-600 hover:text-primary rounded-2xl text-xs font-bold transition-all cursor-pointer w-full justify-center"
                    >
                      <Plus className="w-4 h-4" />
                      Thêm video Short tiếp theo
                    </button>
                  </div>
                </div>
              )}

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

            {postType === 'shorts_playlist' ? (
              <ShortsPlaylistStage
                shorts={shortsList.filter(s => s.videoId && s.title.trim())}
                postTitle={title || 'Tiêu đề Playlist Shorts'}
                authorName={authorName}
              />
            ) : (
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
            )}
          </div>
        )}
      </main>
    </div>
  )
}
