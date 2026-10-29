'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ShortItem } from '@/data/blogData'
import MathText from '@/components/ui/MathText'
import { extractYouTubeVideoId, isImageUrl, getMediaThumbnail } from '@/lib/youtubeUtils'
import { 
  Play, BookOpen, Layers, Check, Bookmark, ArrowRight,
  Image as ImageIcon, ChevronLeft, ChevronRight 
} from 'lucide-react'

export interface ShortsPlaylistStageProps {
  shorts: ShortItem[]
  postTitle?: string
  authorName?: string
}

export function ShortsPlaylistStage({
  shorts = [],
  postTitle,
  authorName = 'Ban biên tập Toan6789'
}: ShortsPlaylistStageProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [saved, setSaved] = useState(false)

  const total = shorts.length
  const currentShort = shorts[currentIndex] || null

  const handlePrev = useCallback(() => {
    if (total === 0) return
    setCurrentIndex((prev) => (prev - 1 + total) % total)
  }, [total])

  const handleNext = useCallback(() => {
    if (total === 0) return
    setCurrentIndex((prev) => (prev + 1) % total)
  }, [total])

  // Keyboard navigation: ArrowLeft / ArrowRight
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      const target = e.target as HTMLElement
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return
      }

      if (e.key === 'ArrowLeft') {
        handlePrev()
      } else if (e.key === 'ArrowRight') {
        handleNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handlePrev, handleNext])

  if (!shorts || shorts.length === 0 || !currentShort) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200/80 p-10 text-center text-slate-500 shadow-xs">
        <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <h3 className="font-bold text-slate-700">Chưa có nội dung nào trong playlist</h3>
        <p className="text-xs text-slate-400 mt-1">Playlist này đang được cập nhật các mẹo giải nhanh và hình ảnh công thức.</p>
      </div>
    )
  }

  const isImage = isImageUrl(currentShort.youtubeUrl || currentShort.imageUrl) || (!currentShort.videoId && !!currentShort.youtubeUrl)
  const mediaUrl = currentShort.imageUrl || currentShort.youtubeUrl || ''

  const handleSaveNotebook = () => {
    if (currentShort.notes && typeof navigator !== 'undefined' && navigator.clipboard) {
      const cleanText = currentShort.notes.replace(/<[^>]+>/g, '').trim()
      navigator.clipboard.writeText(cleanText)
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const effectiveVideoId = currentShort.videoId || extractYouTubeVideoId(currentShort.youtubeUrl || '')
  const embedUrl = effectiveVideoId
    ? `https://www.youtube-nocookie.com/embed/${effectiveVideoId}?autoplay=1&rel=0&modestbranding=1`
    : ''

  return (
    <div className="space-y-6">
      {/* Theater 2-Column Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-50/60 p-4 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        
        {/* Left Column: 9:16 Shorts / Image Player (5 cols on lg) */}
        <div className="lg:col-span-5 flex flex-col items-center gap-3">
          <div className="w-full max-w-[340px] aspect-[9/16] bg-slate-950 rounded-2xl sm:rounded-3xl overflow-hidden relative shadow-md border-4 border-slate-800 flex flex-col justify-between">
            {/* Top brand header overlay */}
            <div className="absolute top-0 inset-x-0 p-3 z-20 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-center justify-between pointer-events-none">
              <span className="text-xs font-bold text-white tracking-wider flex items-center gap-1.5">
                {isImage ? (
                  <>
                    <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
                    ẢNH BÀI HỌC
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                    SHORTS TIP
                  </>
                )}
              </span>
              <span className="text-xs font-semibold text-white/95 bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full">
                {currentIndex + 1} / {total}
              </span>
            </div>

            {/* Media Area: YouTube Embed or Image */}
            <div className="relative w-full h-full flex items-center justify-center bg-slate-950 overflow-hidden">
              {isImage ? (
                <>
                  {/* Blurred backdrop image */}
                  <img
                    src={mediaUrl}
                    alt={currentShort.title}
                    className="absolute inset-0 w-full h-full object-cover blur-xl opacity-35 scale-110 pointer-events-none"
                  />
                  {/* Sharp main image */}
                  <img
                    src={mediaUrl}
                    alt={currentShort.title}
                    className="relative z-10 w-full h-full object-contain drop-shadow-md select-none"
                  />
                </>
              ) : (
                <iframe
                  key={effectiveVideoId || currentIndex}
                  src={embedUrl}
                  title={`YouTube Shorts Player - ${currentShort.title}`}
                  className="w-full h-full object-cover border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              )}
            </div>

            {/* Bottom floating title overlay */}
            <div className="absolute bottom-0 inset-x-0 p-3.5 z-20 bg-gradient-to-t from-black/95 via-black/60 to-transparent pointer-events-none">
              <div className="text-white text-xs sm:text-sm font-bold line-clamp-2 leading-snug drop-shadow-sm">
                {currentShort.title}
              </div>
            </div>
          </div>

          {/* Quick Prev / Next Controls under player for mobile & desktop */}
          <div className="flex items-center justify-between w-full max-w-[340px] px-1">
            <button
              type="button"
              onClick={handlePrev}
              disabled={total <= 1}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-primary hover:border-primary/40 text-xs font-bold transition-all shadow-2xs min-h-[40px] disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              aria-label="Xem video hoặc ảnh trước đó"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Phần trước</span>
            </button>

            <span className="text-xs font-bold text-slate-600 bg-white/80 border border-slate-200/80 px-3 py-1.5 rounded-lg">
              {currentIndex + 1} / {total}
            </span>

            <button
              type="button"
              onClick={handleNext}
              disabled={total <= 1}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-white hover:bg-primary/90 text-xs font-bold transition-all shadow-xs min-h-[40px] disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              aria-label="Xem video hoặc ảnh tiếp theo"
            >
              <span>Phần tiếp</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Column: Synchronized Math Notes & Cheatsheet (7 cols on lg) */}
        <div className="lg:col-span-7 flex flex-col justify-between bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-xs">
          <div className="space-y-4">
            {/* Header of Notes: Matching shorts-blog-layout.html */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <span className="badge-tag">
                  GHI CHÚ BÀI HỌC (ĐỒNG BỘ THEO VIDEO)
                </span>
                <h3 className="text-lg sm:text-xl font-extrabold text-slate-800 mt-1 leading-snug">
                  {currentShort.title}
                </h3>
              </div>

              <button
                type="button"
                onClick={handleSaveNotebook}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:text-primary hover:border-primary/40 text-xs font-semibold bg-white hover:bg-slate-50 transition-all cursor-pointer min-h-[40px] shadow-2xs shrink-0"
              >
                {saved ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600 font-bold">Đã lưu sổ tay</span>
                  </>
                ) : (
                  <>
                    <Bookmark className="w-3.5 h-3.5 text-slate-500" />
                    <span>Lưu sổ tay</span>
                  </>
                )}
              </button>
            </div>

            {/* Note Content Body with step-box, formula-highlight, and LaTeX MathText */}
            <div className="text-slate-800 text-sm leading-relaxed [&_.step-box_strong]:text-primary [&_.step-box_p]:text-slate-700 [&_code]:bg-slate-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-md [&_code]:text-primary [&_code]:font-mono">
              <MathText content={currentShort.notes || '<p class="text-slate-400 italic">Chưa có ghi chú cho nội dung này.</p>'} />
            </div>
          </div>

          {/* Action button at bottom & Micro Footer (matching shorts-blog-layout.html) */}
          <div className="space-y-3 pt-5 mt-4 border-t border-slate-100">
            <Link
              href="/practices"
              className="w-full min-h-[44px] rounded-xl bg-primary hover:bg-blue-700 text-white font-bold text-sm transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Luyện tập 3 câu tương tự</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 pt-1">
              <span>Mẹo: Bấm vào danh sách video bên dưới hoặc dùng phím <strong>&larr;</strong> / <strong>&rarr;</strong> để chuyển nhanh</span>
              <span className="text-slate-500 font-medium">{authorName}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Mini Playlist Rail */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            <h4 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wider">
              Danh sách video trong chuyên đề ({total})
            </h4>
          </div>
          <span className="text-xs text-slate-400 hidden sm:inline">Bấm vào thẻ để chuyển nhanh</span>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
          {shorts.map((item, idx) => {
            const isActive = idx === currentIndex
            const itemIsImage = isImageUrl(item.youtubeUrl || item.imageUrl) || (!item.videoId && !!item.youtubeUrl)
            const thumbUrl = getMediaThumbnail(item)
            return (
              <div
                key={item.id || idx}
                data-testid={`rail-item-${idx}`}
                role="button"
                tabIndex={0}
                aria-label={`Chuyển đến phần ${idx + 1}: ${item.title}`}
                onClick={() => setCurrentIndex(idx)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setCurrentIndex(idx)
                  }
                }}
                className={`min-w-[140px] max-w-[140px] p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between shrink-0 focus:outline-none focus:ring-2 focus:ring-primary ${
                  isActive
                    ? 'border-primary bg-primary/5 shadow-xs ring-2 ring-primary/20'
                    : 'border-slate-200 hover:border-primary/40 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="relative aspect-[9/12] rounded-lg overflow-hidden bg-slate-900 flex items-center justify-center">
                    <img
                      src={thumbUrl}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                      <div className="w-7 h-7 rounded-full bg-white/80 backdrop-blur-xs flex items-center justify-center text-primary shadow-xs">
                        {itemIsImage ? (
                          <ImageIcon className="w-3.5 h-3.5 text-primary" />
                        ) : (
                          <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                        )}
                      </div>
                    </div>
                    <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/75 text-white text-xs font-bold leading-none">
                      #{idx + 1}
                    </span>
                  </div>

                  <p className={`text-xs font-bold line-clamp-2 leading-tight ${isActive ? 'text-primary' : 'text-slate-800'}`}>
                    {item.title}
                  </p>
                </div>

                <span className="text-xs text-slate-500 mt-2 block font-medium">
                  {itemIsImage ? 'Hình ảnh' : (item.duration || 'Shorts')}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
