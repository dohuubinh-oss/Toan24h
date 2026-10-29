'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, Sparkles, Eye, Edit3, Send, 
  Tag, Link as LinkIcon, FileText, User, Clock, Calendar,
  Plus, Trash2, ArrowUp, ArrowDown, Video, Layers, List,
  Image as ImageIcon, UploadCloud, Loader2, Wand2, X, RefreshCw
} from 'lucide-react'
import SharedEditorCard from '@/components/questions/creator/editor/SharedEditorCard'
import MathText from '@/components/ui/MathText'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/ToastProvider'
import { useSearchParams } from 'next/navigation'
import { addBlogPost, getBlogPostByIdOrSlug, BlogPost, BlogPostType, ShortItem, extractH1Headings, slugify } from '@/data/blogData'
import { extractYouTubeVideoId, parseShortsPlaylist, isImageUrl, getMediaThumbnail } from '@/lib/youtubeUtils'
import { ShortsPlaylistStage } from '@/components/blog/ShortsPlaylistStage'
import { uploadTempImage, recognizeHandwriting } from '@/lib/api'
import { getAvatarInitial } from '@/lib/utils'
import { Suspense } from 'react'

export function generateShortsGuidanceTemplate(options?: {
  problemText?: string
  formula?: string
  quickSolveStep?: string
  warningNote?: string
}): string {
  const problem = options?.problemText || 'Cho bài toán nhận diện dạng từ hình ảnh minh họa:'
  const formula = options?.formula || 'ax^2 + bx + c = 0 \\quad (a \\neq 0)'
  const step2 = options?.quickSolveStep || 'Bấm MENU 9 2 2 trên Casio fx-580VNX để tìm nghiệm x1, x2 và tọa độ đỉnh parabol.'
  const note = options?.warningNote || 'Luôn kiểm tra điều kiện xác định và đối chiếu nghiệm trước khi kết luận!'

  return `<div class="step-box">
  <strong class="text-primary text-[13px] uppercase font-bold tracking-wider">BƯỚC 1: DẠNG TOÁN & ĐỀ BÀI</strong>
  <p class="text-sm text-slate-700 mt-1">${problem}</p>
  <div class="formula-highlight math-font">
    ${formula}
  </div>
</div>
<div class="step-box" style="border-left-color: #10B981;">
  <strong style="color: #059669;" class="text-[13px] uppercase font-bold tracking-wider">BƯỚC 2: MẸO BẤM MÁY TRONG 15 GIÂY</strong>
  <p class="text-sm text-slate-700 mt-1">${step2}</p>
</div>
<div class="callout-warning">
  <strong>Lưu ý quan trọng:</strong> ${note}
</div>`
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
  const [categoryLabel, setCategoryLabel] = useState('Bí quyết thi vào 10')
  const [initialCoverImage, setInitialCoverImage] = useState<string | null>(null)
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

  // State for tracking image upload & OCR progress per short
  const [processingIndex, setProcessingIndex] = useState<number | null>(null)

  // Apply default 2-step + callout template according to shorts-blog-layout.html
  const handleApplyTemplate = (index: number) => {
    const template = generateShortsGuidanceTemplate()
    handleShortChange(index, 'notes', template)
    toast.success("Đã áp dụng mẫu cấu trúc chuẩn shorts-blog-layout!")
  }

  // Core logic: process pasted or dropped image, upload/preview and generate structured guidance
  const processImageForShort = async (file: File, targetIdx: number) => {
    if (!file.type.startsWith('image/')) {
      toast.error("Vui lòng chọn một file hình ảnh!")
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Dung lượng ảnh vượt quá 10MB!")
      return
    }

    setProcessingIndex(targetIdx)
    toast.info("Đang xử lý ảnh & nhận diện công thức toán...")

    try {
      // 1. Upload or generate base64 preview URL
      let imageUrl = ''
      try {
        imageUrl = await uploadTempImage(file)
      } catch (_) {
        imageUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(file)
        })
      }

      // 2. OCR recognition with Gemini
      let ocrText = ''
      try {
        ocrText = await recognizeHandwriting(file)
      } catch (ocrErr) {
        console.warn('OCR unavailable or offline, using standard template:', ocrErr)
      }

      // 3. Format guidance according to shorts-blog-layout.html
      let problemText = 'Cho bài toán nhận diện dạng từ hình ảnh minh họa:'
      let formula = 'ax^2 + bx + c = 0 \\quad (a \\neq 0)'
      let autoTitle = ''

      if (ocrText && ocrText.trim()) {
        const cleanOcr = ocrText.trim()
        const formulaMatch = cleanOcr.match(/\$\$([\s\S]*?)\$\$|\$([^$]+)\$/)
        if (formulaMatch) {
          formula = formulaMatch[1] || formulaMatch[2]
          problemText = cleanOcr.replace(/\$\$[\s\S]*?\$\$|\$[^$]+\$/, '').trim() || problemText
        } else {
          problemText = cleanOcr
        }
        autoTitle = cleanOcr.slice(0, 45).replace(/[\n\r]+/g, ' ').trim()
      }

      const generatedNotes = generateShortsGuidanceTemplate({
        problemText,
        formula,
        quickSolveStep: 'Bấm MENU 9 2 2 trên Casio fx-580VNX để tìm nghiệm x1, x2 và tọa độ đỉnh parabol.',
        warningNote: 'Luôn kiểm tra điều kiện xác định và đối chiếu nghiệm trước khi kết luận!'
      })

      // 4. Update the short item in playlist
      setShortsList(prev => {
        const copy = [...prev]
        if (targetIdx >= copy.length) return copy
        const existing = copy[targetIdx]
        copy[targetIdx] = {
          ...existing,
          youtubeUrl: imageUrl,
          imageUrl: imageUrl,
          videoId: '',
          title: existing.title?.trim() ? existing.title : (autoTitle ? `Mẹo giải nhanh: ${autoTitle}` : `Mẹo giải bài tập #${targetIdx + 1}`),
          notes: generatedNotes
        }
        return copy
      })

      toast.success("Đã dán ảnh và tự động xuất hướng dẫn chuẩn shorts-blog-layout!")
    } catch (err: any) {
      console.error('Error processing image for short:', err)
      toast.error("Có lỗi xảy ra khi xử lý ảnh!")
    } finally {
      setProcessingIndex(null)
    }
  }

  // Handle card paste event
  const handleCardPaste = (e: React.ClipboardEvent, index: number) => {
    const items = e.clipboardData?.items
    if (!items) return

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile()
        if (file) {
          e.preventDefault()
          processImageForShort(file, index)
          break
        }
      }
    }
  }

  // Handle card drop event
  const handleCardDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.stopPropagation()
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) {
      processImageForShort(file, index)
    }
  }

  // Global window paste listener when in shorts_playlist mode
  useEffect(() => {
    if (postType !== 'shorts_playlist') return

    const handleGlobalPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return

      let imageFile: File | null = null
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          imageFile = items[i].getAsFile()
          break
        }
      }

      if (imageFile) {
        e.preventDefault()
        setShortsList(prev => {
          const emptyIdx = prev.findIndex(s => !s.youtubeUrl?.trim() && !s.title?.trim())
          if (emptyIdx !== -1) {
            setTimeout(() => {
              processImageForShort(imageFile!, emptyIdx)
            }, 50)
            return prev
          } else {
            const newId = String(Date.now())
            const newIdx = prev.length
            const nextList = [
              ...prev,
              { id: newId, youtubeUrl: '', videoId: '', title: '', duration: '0:50', notes: '' }
            ]
            setTimeout(() => {
              processImageForShort(imageFile!, newIdx)
            }, 50)
            return nextList
          }
        })
      }
    }

    window.addEventListener('paste', handleGlobalPaste)
    return () => {
      window.removeEventListener('paste', handleGlobalPaste)
    }
  }, [postType])

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
        if (existing.coverImage) setInitialCoverImage(existing.coverImage)
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
        setCategoryLabel('Bí quyết thi vào 10')
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

  const DEFAULT_COVER_IMAGE = 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=1200'

  const extractFirstImageFromContent = (rawContent: string): string | null => {
    if (!rawContent) return null
    // Match HTML <img src="...">
    const htmlMatch = rawContent.match(/<img[^>]+src=["']([^"']+)["']/i)
    if (htmlMatch && htmlMatch[1]) return htmlMatch[1]
    
    // Match Markdown ![alt](url)
    const mdMatch = rawContent.match(/!\[.*?\]\((https?:\/\/[^\s\)]+)\)/i)
    if (mdMatch && mdMatch[1]) return mdMatch[1]

    return null
  }

  const autoCoverImage = useMemo(() => {
    if (postType === 'shorts_playlist') {
      const validShorts = shortsList.filter(s => (s.videoId || s.youtubeUrl?.trim() || s.imageUrl?.trim()) && s.title.trim())
      if (validShorts.length > 0) {
        return getMediaThumbnail(validShorts[0])
      }
      return initialCoverImage || DEFAULT_COVER_IMAGE
    } else {
      const firstImage = extractFirstImageFromContent(content)
      return firstImage || initialCoverImage || DEFAULT_COVER_IMAGE
    }
  }, [postType, shortsList, content, initialCoverImage])

  const isCustomImageDetected = useMemo(() => {
    if (postType === 'shorts_playlist') {
      const valid = shortsList.find(s => (s.videoId || s.youtubeUrl?.trim() || s.imageUrl?.trim()) && s.title.trim())
      return !!valid
    } else {
      return !!extractFirstImageFromContent(content)
    }
  }, [postType, shortsList, content])

  const coverImageSourceLabel = useMemo(() => {
    if (postType === 'shorts_playlist') {
      return isCustomImageDetected ? 'Thumbnail Video Short #1' : 'Ảnh chuẩn Toan6789'
    } else {
      return isCustomImageDetected ? 'Ảnh đầu tiên trong bài viết' : 'Ảnh chuẩn Toan6789'
    }
  }, [postType, isCustomImageDetected])

  const coverImageDescription = useMemo(() => {
    if (postType === 'shorts_playlist') {
      return 'Hệ thống tự động sử dụng thumbnail của video Short / ảnh bài tập đầu tiên làm ảnh bìa hiển thị.'
    } else {
      return 'Hệ thống tự động trích xuất hình ảnh đầu tiên trong nội dung bài viết làm ảnh bìa. Khi bạn dán (Ctrl+V) hoặc chèn ảnh minh họa, ảnh bìa sẽ được cập nhật tự động.'
    }
  }, [postType])

  // Realtime TOC detection based on H1 headings (# Heading or <h1>Heading</h1>)
  const detectedHeadings = useMemo(() => {
    return extractH1Headings(content)
  }, [content])

  const handleGenerateAutoToc = () => {
    const headings = extractH1Headings(content)
    if (headings.length === 0) {
      toast.error("Chưa tìm thấy thẻ H1 trong bài viết. Hãy thêm các đề mục với '# Tiêu đề' hoặc '<h1>Tiêu đề</h1>' để tạo mục lục tự động!")
      return
    }

    const tocListHtml = headings
      .map((h, i) => `    <li><a href="#${h.id}" class="hover:text-primary hover:underline flex items-center gap-2"><span class="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">${i + 1}</span><span>${h.title}</span></a></li>`)
      .join('\n')

    const tocBlock = `<div class="toc-box bg-slate-50 border border-slate-200/90 rounded-2xl p-4 sm:p-5 my-5 shadow-xs">
  <div class="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary border-b border-slate-200/80 pb-2.5 mb-3">
    <span>📋</span>
    <span>MỤC LỤC BÀI VIẾT</span>
    <span class="text-xs font-normal text-slate-500">(${headings.length} mục)</span>
  </div>
  <ul class="space-y-2 text-xs font-semibold text-slate-700">
${tocListHtml}
  </ul>
</div>\n\n`

    if (content.includes('class="toc-box')) {
      const updated = content.replace(/<div class="toc-box[\s\S]*?<\/div>\s*/i, tocBlock)
      setContent(updated)
      toast.success(`Đã cập nhật lại mục lục tự động từ ${headings.length} thẻ H1!`)
    } else {
      setContent(tocBlock + content)
      toast.success(`Đã tạo mục lục tự động thành công từ ${headings.length} thẻ H1!`)
    }
  }

  const handleInsertH1Template = () => {
    const count = detectedHeadings.length + 1
    const template = `\n\n# ${count}. Tiêu đề mục chính thứ ${count}\nNội dung chi tiết cho mục này...\n`
    setContent(prev => prev + template)
    toast.success(`Đã thêm mẫu đề mục H1 số ${count}!`)
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

    if (postType === 'shorts_playlist') {
      const validShorts = shortsList.filter(s => (s.videoId || s.youtubeUrl?.trim()) && s.title.trim())
      if (validShorts.length === 0) {
        toast.error("Vui lòng nhập ít nhất 1 video Short hoặc hình ảnh với đường link và tiêu đề hợp lệ!")
        return
      }
      finalPlaylistData = JSON.stringify(validShorts)
    } else {
      if (!content.trim()) {
        toast.error("Vui lòng nhập Nội dung bài viết!")
        return
      }
    }

    const coverImage = autoCoverImage

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
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 w-full shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <Link 
              href="/blog" 
              aria-label="Quay lại danh sách Blog" 
              className="min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center hover:bg-slate-100 rounded-xl transition-colors text-slate-500 cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                {editPostId ? 'Chỉnh sửa bài viết Blog' : 'Tạo bài viết Blog mới'}
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                {postType === 'standard' ? <FileText className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5" />}
                <span>{postType === 'standard' ? 'Bài viết chuẩn' : 'Playlist Shorts'}</span>
              </span>
              <span className="hidden md:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                {editPostId ? 'Đang cập nhật' : 'Bản nháp tự lưu'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Mode Switcher */}
            <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('edit')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 min-h-[36px] ${
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
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 min-h-[36px] ${
                  activeTab === 'preview'
                    ? 'bg-white text-primary shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Eye className="w-3.5 h-3.5 text-primary" />
                Xem trước
              </button>
            </div>

            <Button onClick={handlePublish} className="min-h-[44px] px-6 font-bold text-xs rounded-xl flex items-center gap-2 shadow-sm shadow-primary/20 cursor-pointer">
              <Send className="w-4 h-4" />
              <span>{editPostId ? 'Cập nhật bài viết' : 'Xuất bản bài viết'}</span>
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

              {/* Post Type Selector Card - Creator Studio style */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-primary" />
                    Định dạng bài viết
                  </label>
                  <span className="text-xs text-slate-400">Chọn 1 trong 2 định dạng</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label 
                    className={`flex items-start gap-3.5 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      postType === 'standard' 
                        ? 'border-primary bg-primary/5 shadow-xs' 
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                    }`}
                  >
                    <input 
                      type="radio" 
                      name="postType" 
                      value="standard" 
                      checked={postType === 'standard'} 
                      onChange={() => setPostType('standard')}
                      className="mt-1 text-primary focus:ring-primary"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <FileText className={`w-4 h-4 ${postType === 'standard' ? 'text-primary' : 'text-slate-400'}`} />
                        <span className="text-xs font-bold text-slate-900">Bài viết chuẩn</span>
                      </div>
                      <span className="text-xs text-slate-500 block leading-relaxed">
                        Bài giảng lý thuyết, tin giáo dục với văn bản & công thức toán học KaTeX.
                      </span>
                    </div>
                  </label>

                  <label 
                    className={`flex items-start gap-3.5 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      postType === 'shorts_playlist' 
                        ? 'border-primary bg-primary/5 shadow-xs' 
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                    }`}
                  >
                    <input 
                      type="radio" 
                      name="postType" 
                      value="shorts_playlist" 
                      checked={postType === 'shorts_playlist'} 
                      onChange={() => setPostType('shorts_playlist')}
                      className="mt-1 text-primary focus:ring-primary"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Video className={`w-4 h-4 ${postType === 'shorts_playlist' ? 'text-primary' : 'text-slate-400'}`} />
                        <span className="text-xs font-bold text-slate-900">Playlist Video Shorts</span>
                      </div>
                      <span className="text-xs text-slate-500 block leading-relaxed">
                        Chuỗi video ngắn 9:16 (tips, mẹo Casio, giải nhanh) kèm ghi chú công thức đồng bộ.
                      </span>
                    </div>
                  </label>
                </div>
              </div>
              
              {/* Title & Slug Card */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
                {/* Title Input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-primary" />
                      Tiêu đề bài viết <span className="text-red-500">*</span>
                    </label>
                    <span className={`text-xs ${title.length > 100 ? 'text-amber-600 font-bold' : 'text-slate-400'}`}>
                      {title.length}/120 ký tự
                    </span>
                  </div>
                  <input 
                    type="text"
                    required
                    placeholder="Nhập tiêu đề bài viết (ví dụ: Tuyển tập 10 mẹo bấm máy Casio fx-580VNX giải nhanh Toán 9)..."
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
                <div className="space-y-4">
                  {/* Auto TOC Helper Card */}
                  <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
                          <List className="w-4 h-4" />
                        </span>
                        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                          Mục lục tự động (Thẻ H1)
                        </h3>
                        {detectedHeadings.length > 0 ? (
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200/60">
                            Đã nhận diện {detectedHeadings.length} đề mục H1
                          </span>
                        ) : (
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium">
                            Chưa có thẻ H1
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Quét các thẻ <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-primary font-bold"># Tiêu đề</code> hoặc <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-primary font-bold">&lt;h1&gt;</code> trong bài viết để tự động sinh khối Mục lục liên kết neo.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      <button
                        type="button"
                        onClick={handleInsertH1Template}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer min-h-[38px]"
                        title="Thêm mẫu tiêu đề H1 vào bài viết"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Thêm thẻ H1</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleGenerateAutoToc}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold transition-all shadow-xs cursor-pointer min-h-[38px]"
                        title="Tạo hoặc cập nhật khối mục lục bài viết từ thẻ H1"
                      >
                        <List className="w-3.5 h-3.5" />
                        <span>Tạo mục lục tự động</span>
                      </button>
                    </div>
                  </div>

                  <SharedEditorCard
                    title="Nội dung bài blog"
                    icon={<FileText className="text-primary w-5 h-5" />}
                    content={content}
                    onContentChange={setContent}
                    placeholder="Nhập nội dung bài blog..."
                  />
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Playlist Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Video className="w-4 h-4 text-primary" />
                        Danh sách Video Shorts trong Playlist ({shortsList.length})
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Dán ảnh bài toán hoặc dán link YouTube Shorts để tự động tạo bài học và ghi chú đồng bộ.
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

                  {/* Quick Paste & Drop Banner for entire playlist */}
                  <div 
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const file = e.dataTransfer.files?.[0];
                      if (file && file.type.startsWith('image/')) {
                        const newId = String(Date.now());
                        const newIdx = shortsList.length;
                        setShortsList(prev => [
                          ...prev,
                          { id: newId, youtubeUrl: '', videoId: '', title: '', duration: '0:50', notes: '' }
                        ]);
                        setTimeout(() => processImageForShort(file, newIdx), 50);
                      }
                    }}
                    className="p-4 bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-slate-50 border-2 border-dashed border-primary/30 hover:border-primary rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shrink-0 shadow-xs">
                        <UploadCloud className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-2">
                          <span>Kéo thả hoặc Dán ảnh đề bài (Ctrl + V)</span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">Tự động xuất hướng dẫn</span>
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Tự động nhận diện công thức và xuất hướng dẫn 2 bước & lưu ý chuẩn <code className="bg-white px-1.5 py-0.5 rounded text-primary font-mono font-semibold">shorts-blog-layout.html</code>
                        </p>
                      </div>
                    </div>
                    <label className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 text-primary font-bold text-xs rounded-xl border border-primary/20 shadow-xs cursor-pointer shrink-0 transition-all">
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Chọn ảnh từ máy</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            const newId = String(Date.now())
                            const newIdx = shortsList.length
                            setShortsList(prev => [
                              ...prev,
                              { id: newId, youtubeUrl: '', videoId: '', title: '', duration: '0:50', notes: '' }
                            ])
                            setTimeout(() => processImageForShort(file, newIdx), 50)
                            e.target.value = ''
                          }
                        }}
                      />
                    </label>
                  </div>

                  {shortsList.map((item, idx) => (
                    <div 
                      key={item.id || idx} 
                      onPaste={(e) => handleCardPaste(e, idx)}
                      className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 transition-all hover:border-slate-300"
                    >
                      {/* Short Header: #idx, title, move buttons, delete button */}
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-800">Bài học #{idx + 1}</span>
                          {item.videoId ? (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-mono font-semibold">
                              YouTube: {item.videoId}
                            </span>
                          ) : isImageUrl(item.youtubeUrl) ? (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold">
                              Ảnh bài học Shorts
                            </span>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveShort(idx, 'up')}
                            aria-label={`Di chuyển bài học #${idx + 1} lên`}
                            className="p-2 min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                            title="Di chuyển lên"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === shortsList.length - 1}
                            onClick={() => handleMoveShort(idx, 'down')}
                            aria-label={`Di chuyển bài học #${idx + 1} xuống`}
                            className="p-2 min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                            title="Di chuyển xuống"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveShort(idx)}
                            aria-label={`Xóa bài học #${idx + 1}`}
                            className="p-2 min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors ml-1 cursor-pointer"
                            title="Xóa video này"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Media Area: Paste / Upload Image Zone OR YouTube URL */}
                      <div className="space-y-3">
                        {isImageUrl(item.youtubeUrl) ? (
                          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <div className="relative w-16 h-24 bg-slate-900 rounded-lg overflow-hidden shrink-0 border border-slate-300 flex items-center justify-center">
                                <img
                                  src={item.imageUrl || item.youtubeUrl}
                                  alt={item.title || 'Ảnh bài học'}
                                  className="w-full h-full object-contain"
                                />
                                <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/80 text-white text-xs font-bold rounded">
                                  9:16
                                </span>
                              </div>
                              <div>
                                <span className="text-xs font-bold uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md inline-block mb-1">
                                  ẢNH BÀI HỌC (ĐÃ ĐỒNG BỘ)
                                </span>
                                <p className="text-xs font-semibold text-slate-800 line-clamp-1 max-w-[280px]">
                                  {item.title || 'Đã đính kèm ảnh bài học'}
                                </p>
                                <p className="text-xs text-slate-400 mt-0.5">
                                  Ghi chú bên dưới đã được định dạng theo cấu trúc shorts-blog-layout
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <label className="px-3 py-1.5 min-h-[38px] rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 shadow-2xs">
                                <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                                <span>Đổi ảnh</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="sr-only"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0]
                                    if (file) {
                                      processImageForShort(file, idx)
                                      e.target.value = ''
                                    }
                                  }}
                                />
                              </label>
                              <button
                                type="button"
                                onClick={() => {
                                  handleShortChange(idx, 'youtubeUrl', '')
                                  handleShortChange(idx, 'imageUrl', '')
                                }}
                                aria-label="Gỡ ảnh này"
                                className="p-2 min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Gỡ ảnh này"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* Drop & Paste Zone when no image yet */
                          <div
                            onPaste={(e) => handleCardPaste(e, idx)}
                            onDrop={(e) => handleCardDrop(e, idx)}
                            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                            className={`border-2 border-dashed rounded-xl p-4 text-center transition-all ${
                              processingIndex === idx
                                ? 'bg-blue-50/60 border-primary'
                                : 'bg-slate-50/70 border-slate-200 hover:border-primary/60 hover:bg-primary/5'
                            }`}
                          >
                            {processingIndex === idx ? (
                              <div className="py-3 flex flex-col items-center justify-center gap-2">
                                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                <span className="text-xs font-bold text-primary">Đang nhận dạng công thức và xuất hướng dẫn...</span>
                              </div>
                            ) : (
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-center gap-2 text-slate-700">
                                  <ImageIcon className="w-4 h-4 text-primary" />
                                  <span className="text-xs font-bold">Dán ảnh bài toán vào đây (Ctrl + V)</span>
                                </div>
                                <p className="text-xs text-slate-400">
                                  AI sẽ tự động nhận diện công thức và xuất hướng dẫn 2 bước & lưu ý chuẩn shorts-blog-layout
                                </p>
                                <div className="pt-1 flex items-center justify-center gap-2">
                                  <label className="px-3 py-1.5 min-h-[38px] bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:text-primary hover:border-primary/40 cursor-pointer shadow-2xs transition-all inline-flex items-center gap-1.5">
                                    <UploadCloud className="w-3.5 h-3.5" />
                                    <span>Chọn file ảnh</span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="sr-only"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0]
                                        if (file) {
                                          processImageForShort(file, idx)
                                          e.target.value = ''
                                        }
                                      }}
                                    />
                                  </label>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* YouTube URL or Image URL & Duration */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                          <div className="md:col-span-8 space-y-1.5">
                            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                              Hoặc dán Link YouTube Short / Link ảnh ngoài <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="url"
                              placeholder="Dán link YouTube Short (ví dụ: https://www.youtube.com/shorts/...) hoặc link ảnh (https://...)..."
                              value={item.youtubeUrl}
                              onChange={(e) => handleShortChange(idx, 'youtubeUrl', e.target.value)}
                              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            />
                          </div>

                          <div className="md:col-span-4 space-y-1.5">
                            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
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
                        </div>
                      </div>

                      {/* Title */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                          Tiêu đề của Video Short này <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Ví dụ: Mẹo Casio 1: Bấm máy giải phương trình bậc hai, hệ phương trình..."
                          value={item.title}
                          onChange={(e) => handleShortChange(idx, 'title', e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                      </div>

                      {/* Notes (LaTeX formula markdown) with Template button and Live Preview */}
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                            Ghi chú công thức toán học & các bước giải (Hỗ trợ LaTeX $...$)
                          </label>
                          <button
                            type="button"
                            onClick={() => handleApplyTemplate(idx)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 min-h-[32px] rounded-lg bg-blue-50 hover:bg-blue-100 text-primary text-xs font-bold transition-all cursor-pointer border border-blue-200/60 shadow-2xs"
                            title="Điền mẫu cấu trúc 2 bước và lưu ý chuẩn shorts-blog-layout.html"
                          >
                            <Wand2 className="w-3.5 h-3.5" />
                            <span>Mẫu chuẩn shorts-blog-layout</span>
                          </button>
                        </div>
                        <textarea
                          rows={4}
                          placeholder="Nhập lý thuyết cốt lõi, công thức giải nhanh (ví dụ: $ax^2 + bx + c = 0$), các phím bấm Casio..."
                          value={item.notes || ''}
                          onChange={(e) => handleShortChange(idx, 'notes', e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                        {item.notes && (
                          <div className="mt-2 p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-800">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
                              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                Xem trước giao diện Ghi chú đồng bộ:
                              </span>
                              <span className="badge-tag !mb-0 !text-xs">CHUẨN SHORTS-BLOG-LAYOUT</span>
                            </div>
                            <div className="text-slate-800 text-sm leading-relaxed [&_.step-box_strong]:text-primary [&_.step-box_p]:text-slate-700 [&_code]:bg-slate-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-md [&_code]:text-primary [&_code]:font-mono">
                              <MathText content={item.notes} />
                            </div>
                          </div>
                        )}
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

            {/* Right Column - Settings & Metadata Sidebar (4 cols - Creator Studio style) */}
            <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
              
              {/* Card 1: Author Info Box (Placed at Top) */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    <span>Tác giả bài viết</span>
                  </h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold">
                    Xác thực
                  </span>
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-3.5">
                    {authorAvatar ? (
                      <img 
                        src={authorAvatar} 
                        alt={authorName} 
                        className="w-12 h-12 rounded-xl object-cover border-2 border-primary/20 shrink-0" 
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-base shrink-0">
                        {getAvatarInitial(authorName)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{authorName}</h4>
                      <p className="text-xs text-primary font-semibold line-clamp-1">{authorRole}</p>
                      <p className="text-xs text-slate-400 mt-0.5">Tài khoản biên tập Toan6789</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Xuất bản & Phân loại Box */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span>Xuất bản & Phân loại</span>
                  </h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                    {categoryLabel}
                  </span>
                </div>

                <div className="p-5 space-y-4">
                  {/* Featured Post Toggle Item */}
                  <div className="p-3.5 bg-amber-50/60 border border-amber-200/80 rounded-xl space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 cursor-pointer select-none">
                          <Sparkles className="w-4 h-4 text-amber-500" />
                          Bài viết Nổi bật
                        </label>
                        <p className="text-xs text-slate-500">Đánh dấu bài nổi bật trên đầu trang Blog</p>
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
                      <p className="text-xs text-amber-700 font-medium border-t border-amber-200/60 pt-2 leading-relaxed">
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
                      <option value="Bi-Quyet-Thi">Bí quyết thi vào 10</option>
                      <option value="Tin-Tuc">Tin tức & Sự kiện</option>
                      <option value="Toan-6">Toán lớp 6</option>
                      <option value="Toan-7">Toán lớp 7</option>
                      <option value="Toan-8">Toán lớp 8</option>
                      <option value="Toan-9">Toán lớp 9</option>
                      <option value="Meo-Casio">Mẹo Casio</option>
                    </select>
                  </div>

                  {/* Read time / item estimate */}
                  <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      Quy mô nội dung:
                    </span>
                    <span className="font-bold text-slate-700">
                      {postType === 'shorts_playlist' ? `${shortsList.length} Shorts` : 'Bài viết chuẩn'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2: Cover Image Settings Box */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-primary" />
                    <span>Ảnh bìa đại diện</span>
                  </h3>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold flex items-center gap-1 border border-blue-100">
                    <Sparkles className="w-3 h-3 text-primary" />
                    Tự động
                  </span>
                </div>
                
                <div className="p-5 space-y-3.5">
                  <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-2xs group">
                    <img
                      src={autoCoverImage}
                      alt="Xem trước ảnh bìa bài viết"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = DEFAULT_COVER_IMAGE
                      }}
                    />
                    <div className="absolute top-2.5 left-2.5 z-10">
                      <span className="px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-xs text-white text-xs font-semibold shadow-xs flex items-center gap-1.5">
                        <ImageIcon className="w-3 h-3 text-blue-300" />
                        {coverImageSourceLabel}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed">
                    {coverImageDescription}
                  </p>
                </div>
              </div>

              {/* Card 3: Tags Section Box */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    <Tag className="w-4 h-4 text-primary" />
                    <span>Thẻ từ khóa ({tags.length})</span>
                  </h3>
                </div>

                <div className="p-5 space-y-3">
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      placeholder="Nhập thẻ..."
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }}
                      className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer min-h-[38px]"
                    >
                      Thêm
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {tags.map((t, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-bold flex items-center gap-1.5 border border-primary/20">
                        #{t}
                        <button 
                          type="button" 
                          onClick={() => handleRemoveTag(t)}
                          aria-label={`Xóa thẻ ${t}`}
                          className="hover:text-red-600 transition-colors p-0.5 cursor-pointer"
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
                shorts={shortsList.filter(s => (s.videoId || s.youtubeUrl?.trim()) && s.title.trim())}
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
                    {authorAvatar ? (
                      <img 
                        src={authorAvatar} 
                        alt={authorName}
                        className="w-11 h-11 rounded-full object-cover border-2 border-primary/20"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none'
                        }}
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-primary/10 border-2 border-primary/20 text-primary font-bold flex items-center justify-center text-sm">
                        {getAvatarInitial(authorName)}
                      </div>
                    )}
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{authorName}</h4>
                      <p className="text-xs text-slate-500">{authorRole}</p>
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

                {/* Cover Image in Live Preview */}
                {autoCoverImage && (
                  <div className="w-full h-64 sm:h-80 rounded-2xl overflow-hidden border border-slate-200">
                    <img
                      src={autoCoverImage}
                      alt={title || "Ảnh bài viết"}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Auto Table of Contents Preview */}
                {detectedHeadings.length > 0 && !content.includes('class="toc-box') && (
                  <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 sm:p-5 my-4 shadow-xs">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary border-b border-slate-200/80 pb-2 mb-3">
                      <List className="w-4 h-4 text-primary" />
                      <span>Mục lục bài viết (Tự động từ H1)</span>
                      <span className="text-xs font-normal text-slate-500">({detectedHeadings.length} mục)</span>
                    </div>
                    <ul className="space-y-2 text-xs font-semibold text-slate-700">
                      {detectedHeadings.map((h, i) => (
                        <li key={h.id || i} className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                            {i + 1}
                          </span>
                          <span className="text-slate-800">{h.title}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

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
