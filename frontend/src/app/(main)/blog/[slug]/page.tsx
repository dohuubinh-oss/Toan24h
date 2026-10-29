'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { 
  ArrowLeft, ArrowRight, Calendar, Clock, Share2, Sparkles, BookOpen, 
  ChevronRight, Award, List, CheckCircle2, FileQuestion 
} from 'lucide-react'
import { getBlogPosts, BlogPost, extractH1Headings } from '@/data/blogData'
import MathText from '@/components/ui/MathText'
import { useToast } from '@/components/ui/ToastProvider'
import { ShortsPlaylistStage } from '@/components/blog/ShortsPlaylistStage'
import { parseShortsPlaylist } from '@/lib/youtubeUtils'
import { getAvatarInitial } from '@/lib/utils'

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

  const postHeadings = useMemo(() => {
    return post?.content ? extractH1Headings(post.content) : []
  }, [post?.content])

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
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-xl shadow-xs hover:bg-primary/90 transition-all min-h-[42px]"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại trang Blog
          </Link>
        </div>
      </div>
    )
  }

  // Find previous and next posts
  const currentIndex = posts.findIndex(p => p.id === post.id)
  const prevPost = currentIndex > 0 ? posts[currentIndex - 1] : null
  const nextPost = currentIndex < posts.length - 1 ? posts[currentIndex + 1] : null

  // Get related posts (excluding current post)
  const relatedPosts = posts
    .filter(p => p.id !== post.id)
    .slice(0, 4)

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href)
      toast.success("Đã sao chép liên kết bài viết!")
    }
  }

  const isShortsPlaylist = post.postType === 'shorts_playlist'

  return (
    <div className="min-h-screen bg-slate-50 py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Breadcrumb Navigation - Consistent with /blog and system */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-medium border-b border-slate-200/80 pb-4">
          <Link href="/dashboard" className="hover:text-primary transition-colors cursor-pointer">Trang chủ</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <Link href="/blog" className="hover:text-primary transition-colors cursor-pointer">Góc học tập & Blog</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <Link href={`/blog?category=${post.category}`} className="text-slate-600 hover:text-primary transition-colors font-semibold">
            {post.categoryLabel}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-primary font-bold line-clamp-1 max-w-[240px] sm:max-w-md">{post.title}</span>
        </div>

        {/* 2-Column Academic Portal Grid Layout (8 cols Content + 4 cols Sticky Sidebar) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Content Area (8 Cols) */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Article Main Card */}
            <article className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden p-6 sm:p-10 space-y-6">
              
              {/* Category badge & tags */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-bold text-xs uppercase tracking-wider">
                  {post.categoryLabel}
                </span>

                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {post.tags.map((tag, idx) => (
                      <span key={idx} className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-md">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 leading-snug tracking-tight">
                {post.title}
              </h1>

              {/* Optional Lead Summary */}
              {post.summary && (
                <p className="text-sm sm:text-base text-slate-600 font-medium italic border-l-4 border-primary pl-4 py-2 bg-slate-50/80 rounded-r-xl">
                  {post.summary}
                </p>
              )}

              {/* Author, Date, ReadTime & Share Bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 py-3 border-y border-slate-100">
                {/* Left: Author */}
                <div className="flex items-center gap-3">
                  {post.author.avatar ? (
                    <img 
                      src={post.author.avatar} 
                      alt={post.author.name}
                      className="w-11 h-11 rounded-full object-cover border-2 border-primary/20 bg-slate-100"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div 
                    className={`w-11 h-11 rounded-full bg-primary/10 text-primary border border-primary/20 items-center justify-center font-bold text-xs uppercase shrink-0 ${post.author.avatar ? 'hidden' : 'flex'}`}
                  >
                    {getAvatarInitial(post.author.name)}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span>{post.author.name}</span>
                      <span className="text-xs px-1.5 py-0.2 bg-blue-50 text-primary font-bold rounded">Tác giả</span>
                    </h4>
                    <p className="text-xs text-slate-500 font-medium">{post.author.role}</p>
                  </div>
                </div>

                {/* Right: Date, ReadTime & Share */}
                <div className="flex items-center gap-4">
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

                  <button
                    onClick={handleShare}
                    className="flex items-center gap-2 px-3.5 py-2 min-h-[38px] rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-primary text-xs font-bold transition-all cursor-pointer border border-slate-200/60"
                    aria-label="Chia sẻ bài viết"
                  >
                    <Share2 className="w-4 h-4" />
                    Chia sẻ
                  </button>
                </div>
              </div>

              {/* Media & Content Area */}
              {isShortsPlaylist ? (
                <div className="pt-2">
                  <ShortsPlaylistStage 
                    shorts={parseShortsPlaylist(post.playlistData || post.content)}
                    postTitle={post.title}
                    authorName={post.author.name}
                  />
                </div>
              ) : (
                <div className="space-y-6 pt-2">
                  {post.coverImage && (
                    <div className="relative w-full aspect-video sm:aspect-21/9 rounded-2xl overflow-hidden bg-slate-100 shadow-xs border border-slate-100">
                      <Image
                        src={post.coverImage}
                        alt={post.title}
                        fill
                        priority
                        sizes="(max-width: 1024px) 100vw, 896px"
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="text-slate-800 leading-relaxed text-sm sm:text-base font-sans [&_p:first-child]:mt-0 [&_img]:w-full [&_img]:h-auto [&_img]:rounded-2xl [&_img]:mb-6 [&_img]:object-cover [&_img]:shadow-xs">
                    <MathText content={post.content} />
                  </div>
                </div>
              )}

            </article>

            {/* Practice CTA Banner */}
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-primary rounded-3xl p-6 sm:p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md">
              <div className="space-y-1.5 text-center sm:text-left">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-200">Ôn tập thực chiến Toán THCS</span>
                <h3 className="text-xl sm:text-2xl font-extrabold text-white">Bạn muốn rèn luyện dạng toán này?</h3>
                <p className="text-xs sm:text-sm text-blue-100 max-w-xl">
                  Thực hành ngay với ngân hàng đề thi thử bám sát chương trình mới, tự động chấm điểm và chỉ ra lỗi sai từng bước với AI.
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0 flex-wrap justify-center">
                <Link
                  href="/practices"
                  className="px-5 py-3 rounded-xl bg-white text-primary hover:bg-slate-50 font-bold text-xs sm:text-sm transition-all shadow-md flex items-center gap-2 cursor-pointer min-h-[44px]"
                >
                  <span>Luyện bài tập ngay</span>
                  <ArrowLeft className="w-4 h-4 rotate-180" />
                </Link>
              </div>
            </div>

            {/* Previous / Next Post Navigation Card */}
            {(prevPost || nextPost) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {prevPost ? (
                  <Link
                    href={`/blog/${prevPost.slug}`}
                    className="bg-white rounded-2xl border border-slate-200/80 p-4 hover:border-primary/40 hover:shadow-sm transition-all group flex flex-col justify-between"
                  >
                    <span className="text-xs font-bold text-slate-400 group-hover:text-primary flex items-center gap-1">
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Bài viết trước
                    </span>
                    <p className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-primary transition-colors line-clamp-2 mt-2">
                      {prevPost.title}
                    </p>
                  </Link>
                ) : <div className="hidden sm:block" />}

                {nextPost && (
                  <Link
                    href={`/blog/${nextPost.slug}`}
                    className="bg-white rounded-2xl border border-slate-200/80 p-4 hover:border-primary/40 hover:shadow-sm transition-all group flex flex-col justify-between text-right"
                  >
                    <span className="text-xs font-bold text-slate-400 group-hover:text-primary flex items-center justify-end gap-1">
                      Bài viết tiếp theo
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                    <p className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-primary transition-colors line-clamp-2 mt-2">
                      {nextPost.title}
                    </p>
                  </Link>
                )}
              </div>
            )}

            {/* Back to Blog List Link */}
            <div className="flex items-center justify-between pt-2">
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-primary hover:border-primary/30 text-xs font-bold transition-all shadow-2xs min-h-[40px]"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Quay lại danh sách Blog</span>
              </Link>
            </div>
          </div>

          {/* Right Sticky Sidebar (4 Cols) */}
          <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
            
            {/* Author Card Widget */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-3.5">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <Award className="w-4 h-4 text-primary" />
                <span>Chuyên gia & Tác giả</span>
              </h3>
              <div className="flex items-start gap-3 pt-1">
                {post.author.avatar ? (
                  <img 
                    src={post.author.avatar} 
                    alt={post.author.name}
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-primary/20 shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-lg uppercase shrink-0">
                    {getAvatarInitial(post.author.name)}
                  </div>
                )}
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-900">{post.author.name}</h4>
                  <p className="text-xs text-primary font-semibold">{post.author.role}</p>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Đội ngũ giáo viên chuyên môn Toán THCS & Ban biên tập Toan6789.vn.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Table of Contents / Highlights Widget */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <List className="w-4 h-4 text-primary" />
                <span>{isShortsPlaylist ? 'Danh sách bài học trong Playlist' : (postHeadings.length > 0 ? 'Mục lục bài viết (H1)' : 'Trọng tâm bài giảng')}</span>
              </h3>
              
              {isShortsPlaylist ? (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {parseShortsPlaylist(post.playlistData || post.content).map((short, idx) => (
                    <div 
                      key={short.id || idx}
                      className="p-2.5 rounded-xl bg-slate-50 hover:bg-primary/5 border border-slate-100 hover:border-primary/20 transition-all text-xs font-semibold text-slate-800 flex items-center gap-2.5"
                    >
                      <span className="w-6 h-6 rounded-md bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="line-clamp-1">{short.title || `Mẹo giải số ${idx + 1}`}</span>
                    </div>
                  ))}
                </div>
              ) : postHeadings.length > 0 ? (
                <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                  {postHeadings.map((heading, idx) => (
                    <a
                      key={heading.id || idx}
                      href={`#${heading.id}`}
                      className="p-2.5 rounded-xl bg-slate-50 hover:bg-primary/5 hover:text-primary border border-slate-100 hover:border-primary/20 transition-all text-xs font-semibold text-slate-700 flex items-center gap-2.5 group cursor-pointer"
                    >
                      <span className="w-5 h-5 rounded-md bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                        {idx + 1}
                      </span>
                      <span className="line-clamp-2">{heading.title}</span>
                    </a>
                  ))}
                </div>
              ) : (
                <ul className="space-y-2 text-xs font-semibold text-slate-700">
                  <li className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Phương pháp nhận diện & Phân loại dạng toán</span>
                  </li>
                  <li className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Công thức giải nhanh & Mẹo bấm máy Casio</span>
                  </li>
                  <li className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Lưu ý bẫy đề thi & Điều kiện xác định</span>
                  </li>
                </ul>
              )}
            </div>

            {/* Recommended Exam Widget */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 rounded-3xl p-5 text-white shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
                  ĐỀ THI ĐỀ XUẤT
                </span>
                <Sparkles className="w-4 h-4 text-amber-400" />
              </div>
              <h4 className="text-sm font-bold text-white line-clamp-2">
                Bộ Đề Thi Thử Vào 10 Chuyên Đề: {post.categoryLabel}
              </h4>
              <p className="text-xs text-slate-300">
                Kiểm tra năng lực thực tế, nhận điểm số và đáp án phân tích chi tiết từng bước.
              </p>
              <Link
                href="/practices"
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs transition-all shadow-xs cursor-pointer min-h-[40px]"
              >
                <FileQuestion className="w-4 h-4" />
                <span>Vào phòng thi thử ngay</span>
              </Link>
            </div>

            {/* Related Articles in Sidebar */}
            {relatedPosts.length > 0 && (
              <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-3.5">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span>Bài viết liên quan</span>
                  </span>
                  <Link href="/blog" className="text-primary text-xs font-bold hover:underline">
                    Xem tất cả
                  </Link>
                </h3>

                <div className="space-y-3">
                  {relatedPosts.map(rel => (
                    <Link
                      key={rel.id}
                      href={`/blog/${rel.slug}`}
                      className="flex gap-3 group items-start hover:bg-slate-50 p-2 rounded-xl transition-all"
                    >
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-100">
                        <Image
                          src={rel.coverImage}
                          alt={rel.title}
                          fill
                          sizes="64px"
                          loading="lazy"
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="space-y-1 min-w-0 flex-1">
                        <span className="text-xs font-bold text-primary bg-primary/10 px-1.5 py-0.2 rounded inline-block">
                          {rel.categoryLabel}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                          {rel.title}
                        </h4>
                        <p className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {rel.readTime}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

          </aside>

        </div>

      </div>
    </div>
  )
}
