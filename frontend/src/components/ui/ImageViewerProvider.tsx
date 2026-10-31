'use client'

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import ImageViewerModal from './ImageViewerModal'

interface ImageViewerContextType {
  openImage: (src: string, alt?: string) => void
  closeImage: () => void
}

const ImageViewerContext = createContext<ImageViewerContextType | undefined>(undefined)

export function useImageViewer() {
  const context = useContext(ImageViewerContext)
  if (!context) {
    throw new Error('useImageViewer must be used within an ImageViewerProvider')
  }
  return context
}

export function ImageViewerProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [imageSrc, setImageSrc] = useState('')
  const [imageAlt, setImageAlt] = useState('')

  const openImage = useCallback((src: string, alt?: string) => {
    if (!src) return
    setImageSrc(src)
    setImageAlt(alt || 'Hình ảnh chi tiết')
    setIsOpen(true)
  }, [])

  const closeImage = useCallback(() => {
    setIsOpen(false)
  }, [])

  // Global click delegation for content images (MathText, illustrations, diagrams, blogs)
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null
      if (!target || target.tagName !== 'IMG') return

      const img = target as HTMLImageElement

      // Exclude logos, small avatars, buttons, or explicitly excluded images
      if (
        img.hasAttribute('data-no-zoom') ||
        img.getAttribute('role') === 'presentation' ||
        img.closest('header nav') ||
        img.closest('.no-zoom') ||
        (img.width < 45 && img.height < 45) ||
        img.src.includes('logo') ||
        img.src.includes('avatar') ||
        img.alt?.toLowerCase().includes('logo') ||
        img.alt?.toLowerCase().includes('avatar')
      ) {
        return
      }

      // Check if image is part of math content, lecture, blog, question, or study diagram
      const isContentImage =
        img.closest('.latex-font') ||
        img.closest('[data-testid="question-illustration"]') ||
        img.closest('.prose') ||
        img.closest('article') ||
        img.closest('[data-zoomable="true"]') ||
        img.classList.contains('zoomable') ||
        img.naturalWidth > 120

      const imgSrc = img.currentSrc || img.src
      if (isContentImage && imgSrc) {
        openImage(imgSrc, img.alt || 'Hình vẽ minh họa')
      }
    }

    document.addEventListener('click', handleDocumentClick)
    return () => document.removeEventListener('click', handleDocumentClick)
  }, [openImage])

  return (
    <ImageViewerContext.Provider value={{ openImage, closeImage }}>
      {children}
      <ImageViewerModal
        isOpen={isOpen}
        src={imageSrc}
        alt={imageAlt}
        onClose={closeImage}
      />
    </ImageViewerContext.Provider>
  )
}
