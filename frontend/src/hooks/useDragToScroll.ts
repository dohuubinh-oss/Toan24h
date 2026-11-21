'use client'

import { useRef, useEffect, useState, RefObject } from 'react'

export interface UseDragToScrollOptions {
  speed?: number
  threshold?: number
  disabled?: boolean
}

export interface UseDragToScrollReturn<T extends HTMLElement> {
  ref: RefObject<T | null>
  isDragging: boolean
}

/**
 * Hook cho phép kéo trượt ngang bằng chuột (Drag-to-scroll).
 * - Nhấn giữ chuột và kéo sang trái/phải để cuộn container.
 * - Ngăn chặn click ngoài ý muốn vào các thẻ con khi kết thúc thao tác kéo.
 */
export function useDragToScroll<T extends HTMLElement = HTMLDivElement>(
  options: UseDragToScrollOptions = {}
): UseDragToScrollReturn<T> {
  const { speed = 1, threshold = 4, disabled = false } = options
  const ref = useRef<T | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || disabled) return

    let isDown = false
    let startX = 0
    let scrollLeft = 0
    let hasMoved = false

    const getX = (e: MouseEvent) => (e.pageX !== undefined && e.pageX !== 0 ? e.pageX : (e.clientX ?? 0))

    const handleMouseDown = (e: MouseEvent) => {
      // Chỉ bắt chuột trái
      if (e.button !== 0) return

      // Bỏ qua các phần tử nhập liệu
      const target = e.target as HTMLElement | null
      if (target?.closest('input, textarea, select, [contenteditable="true"], .no-drag-scroll')) {
        return
      }

      // Chỉ kích hoạt khi container thực tế có scrollbar ngang
      if (el.scrollWidth <= el.clientWidth) return

      isDown = true
      hasMoved = false
      startX = getX(e)
      scrollLeft = el.scrollLeft

      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDown) return

      const currentX = getX(e)
      const dx = (currentX - startX) * speed

      if (!hasMoved && Math.abs(dx) > threshold) {
        hasMoved = true
        setIsDragging(true)
        el.style.userSelect = 'none'
        el.style.cursor = 'grabbing'
      }

      if (hasMoved) {
        e.preventDefault()
        el.scrollLeft = scrollLeft - dx
      }
    }

    const handleMouseUp = () => {
      if (isDown) {
        if (hasMoved) {
          setIsDragging(false)
          el.style.userSelect = ''
          el.style.cursor = ''

          // Chặn sự kiện click phát sinh ngay sau khi vừa nhả chuột sau khi kéo
          const preventClick = (e: MouseEvent) => {
            e.preventDefault()
            e.stopPropagation()
          }
          window.addEventListener('click', preventClick, { capture: true, once: true })
        }
      }

      isDown = false
      hasMoved = false
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    el.addEventListener('mousedown', handleMouseDown)

    return () => {
      el.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      el.style.userSelect = ''
      el.style.cursor = ''
    }
  }, [disabled, speed, threshold])

  return { ref, isDragging }
}

export default useDragToScroll
