'use client'
import React, { useState } from 'react'
import { X, Maximize2 } from 'lucide-react'

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

          {/* Lightbox */}
          {isLightboxOpen && (
            <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-200">
              <button 
                data-testid="lightbox-close"
                onClick={() => setIsLightboxOpen(false)}
                className="absolute top-4 right-4 md:top-8 md:right-8 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
              >
                <X size={24} />
              </button>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                data-testid="lightbox-image"
                src={url} 
                alt="Enlarged view" 
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}
