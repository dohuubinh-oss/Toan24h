import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import ImageViewerModal from './ImageViewerModal'

describe('ImageViewerModal Component', () => {
  it('does not render when isOpen is false', () => {
    render(
      <ImageViewerModal
        isOpen={false}
        src="https://example.com/math-diagram.png"
        alt="Tam giác vuông ABC"
        onClose={vi.fn()}
      />
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders modal with image, alt text and controls when isOpen is true', () => {
    const handleClose = vi.fn()
    render(
      <ImageViewerModal
        isOpen={true}
        src="https://example.com/math-diagram.png"
        alt="Tam giác vuông ABC"
        onClose={handleClose}
      />
    )

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Tam giác vuông ABC')).toBeInTheDocument()
    const img = screen.getByAltText('Tam giác vuông ABC')
    expect(img).toHaveAttribute('src', 'https://example.com/math-diagram.png')
    expect(screen.getByText('100%')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Đóng xem ảnh/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Phóng to/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Thu nhỏ/i })).toBeInTheDocument()
  })

  it('calls onClose when clicking close button or pressing Escape', () => {
    const handleClose = vi.fn()
    render(
      <ImageViewerModal
        isOpen={true}
        src="https://example.com/math-diagram.png"
        alt="Hình vẽ"
        onClose={handleClose}
      />
    )

    const closeBtn = screen.getByRole('button', { name: /Đóng xem ảnh/i })
    fireEvent.click(closeBtn)
    expect(handleClose).toHaveBeenCalledTimes(1)

    // Test Escape key
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(handleClose).toHaveBeenCalledTimes(2)
  })

  it('zooms in when clicking Zoom In button and resets zoom on Reset button', () => {
    render(
      <ImageViewerModal
        isOpen={true}
        src="https://example.com/math-diagram.png"
        alt="Hình vẽ"
        onClose={vi.fn()}
      />
    )

    const zoomInBtn = screen.getByRole('button', { name: /Phóng to/i })
    expect(screen.getByText('100%')).toBeInTheDocument()

    // Click Zoom In
    fireEvent.click(zoomInBtn)
    expect(screen.getByText('150%')).toBeInTheDocument()

    fireEvent.click(zoomInBtn)
    expect(screen.getByText('200%')).toBeInTheDocument()

    // Click Zoom Out
    const zoomOutBtn = screen.getByRole('button', { name: /Thu nhỏ/i })
    fireEvent.click(zoomOutBtn)
    expect(screen.getByText('150%')).toBeInTheDocument()

    // Click Reset
    const resetBtn = screen.getByRole('button', { name: /Đặt lại về ban đầu/i })
    fireEvent.click(resetBtn)
    expect(screen.getByText('100%')).toBeInTheDocument()
  })
})
