'use client'

import React, { useEffect, ReactNode } from 'react'

export interface DragScrollProviderProps {
  children: ReactNode
  threshold?: number
  speed?: number
}

/**
 * DragScrollProvider
 * 
 * Tự động kích hoạt tính năng kéo chuột trượt ngang (Drag-to-scroll)
 * cho toàn bộ bảng và vùng có thanh cuộn ngang (.overflow-x-auto, [data-drag-scroll])
 * trên toàn hệ thống.
 * 
 * - Nhấn giữ chuột trái và kéo sang trái/phải để cuộn bảng mượt mà.
 * - Tự động chặn sự kiện click vào hàng/nút khi kết thúc kéo để tránh chuyển trang nhầm.
 * - Click chuột bình thường không kéo vẫn mở link/hành động bình thường.
 * - Tự động bỏ qua các trường nhập liệu (input, textarea, select).
 */
export function DragScrollProvider({
  children,
  threshold = 5,
  speed = 1,
}: DragScrollProviderProps) {
  useEffect(() => {
    let activeContainer: HTMLElement | null = null
    let isDown = false
    let startX = 0
    let startScrollLeft = 0
    let hasMoved = false

    const getX = (e: MouseEvent) => (e.clientX !== undefined ? e.clientX : (e.pageX ?? 0))

    const handleMouseDown = (e: MouseEvent) => {
      // Chỉ nhận chuột trái
      if (e.button !== 0) return

      const target = e.target as HTMLElement | null
      if (!target) return

      // Bỏ qua các phần tử nhập liệu hoặc phần tử được đánh dấu loại trừ
      if (target.closest('input, textarea, select, [contenteditable="true"], .no-drag-scroll')) {
        return
      }

      // Tìm container cuộn ngang gần nhất
      const container = target.closest<HTMLElement>(
        '.overflow-x-auto, .overflow-x-scroll, [data-drag-scroll="true"], [data-drag-scroll]'
      )

      if (!container) return

      // Kiểm tra thực tế container có tràn ngang để cuộn hay không
      if (container.scrollWidth <= container.clientWidth) return

      activeContainer = container
      isDown = true
      hasMoved = false
      startX = getX(e)
      startScrollLeft = container.scrollLeft

      window.addEventListener('mousemove', handleMouseMove, { passive: false })
      window.addEventListener('mouseup', handleMouseUp)
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDown || !activeContainer) return

      const currentX = getX(e)
      const dx = (currentX - startX) * speed

      if (!hasMoved && Math.abs(dx) > threshold) {
        hasMoved = true
        activeContainer.style.cursor = 'grabbing'
        document.body.classList.add('drag-scrolling')
        document.body.style.cursor = 'grabbing'
        document.body.style.userSelect = 'none'
      }

      if (hasMoved) {
        e.preventDefault()
        activeContainer.scrollLeft = startScrollLeft - dx
      }
    }

    const handleMouseUp = () => {
      if (isDown && hasMoved) {
        if (activeContainer) {
          activeContainer.style.cursor = ''
        }
        document.body.classList.remove('drag-scrolling')
        document.body.style.cursor = ''
        document.body.style.userSelect = ''

        // Chặn sự kiện click phát sinh ngay sau thao tác kéo
        const preventClick = (e: MouseEvent) => {
          e.preventDefault()
          e.stopPropagation()
        }
        window.addEventListener('click', preventClick, { capture: true, once: true })
      }

      isDown = false
      hasMoved = false
      activeContainer = null
      document.body.classList.remove('drag-scrolling')
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousedown', handleMouseDown)

    return () => {
      document.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [threshold, speed])

  return <>{children}</>
}

export default DragScrollProvider
