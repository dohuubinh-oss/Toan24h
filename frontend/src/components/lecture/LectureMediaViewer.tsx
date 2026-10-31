'use client'
import React, { useState } from 'react'
import { Maximize2 } from 'lucide-react'
import ImageViewerModal from '@/components/ui/ImageViewerModal'

interface LectureMediaViewerProps {
  mediaType: 'image' | 'youtube'
  url: string
}

export default function LectureMediaViewer({ mediaType, url }: LectureMediaViewerProps) {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [isYoutubeLoaded, setIsYoutubeLoaded] = useState(false)

  // Hàm trích xuất Video ID từ link YouTube
  const getYoutubeVideoId = (videoUrl: string) => {
    try {
      const urlObj = new URL(videoUrl)
      if (urlObj.pathname.includes('/embed/')) {
        return urlObj.pathname.split('/embed/')[1].split('?')[0]
      }
      if (urlObj.searchParams.has('v')) {
        return urlObj.searchParams.get('v')
      }
      return null
    } catch {
      return null
    }
  }

  const videoId = mediaType === 'youtube' ? getYoutubeVideoId(url) : null
  const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : ''

  return (
    <div className="w-full">
      {mediaType === 'youtube' ? (
        <div className="aspect-video w-full rounded-xl overflow-hidden shadow-sm border border-slate-200 relative bg-slate-900 group">
          {!isYoutubeLoaded ? (
            <div 
              className="absolute inset-0 cursor-pointer flex items-center justify-center"
              onClick={() => setIsYoutubeLoaded(true)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={thumbnailUrl} 
                alt="Video thumbnail" 
                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                loading="lazy"
              />
              <div className="absolute bg-red-600/90 text-white p-3 rounded-2xl shadow-lg group-hover:scale-110 group-hover:bg-red-600 transition-all duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          ) : (
            <iframe
              data-testid="youtube-iframe"
              src={url.includes('?') ? `${url}&autoplay=1` : `${url}?autoplay=1`}
              title="YouTube video player"
              className="w-full h-full animate-in fade-in duration-300"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          )}
        </div>
      ) : (
        <>
          <div 
            className="w-full rounded-xl overflow-hidden shadow-sm border border-slate-200 relative cursor-pointer bg-slate-100 flex items-center justify-center"
            onClick={() => setIsLightboxOpen(true)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              data-testid="media-image"
              src={url} 
              alt="Lecture visual" 
              className="w-full h-auto object-contain"
              loading="lazy"
            />
          </div>

          {/* Fullscreen Zoomable Lightbox */}
          <ImageViewerModal
            isOpen={isLightboxOpen}
            src={url}
            alt="Hình ảnh bài giảng"
            onClose={() => setIsLightboxOpen(false)}
          />
        </>
      )}
    </div>
  )
}
