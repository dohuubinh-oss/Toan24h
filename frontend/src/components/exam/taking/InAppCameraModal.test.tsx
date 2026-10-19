import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import InAppCameraModal from './InAppCameraModal'
import { ToastProvider } from '@/components/ui/ToastProvider'

// Mock recognizeHandwriting
vi.mock('@/lib/api', () => ({
  recognizeHandwriting: vi.fn()
}))

import { recognizeHandwriting } from '@/lib/api'

describe('InAppCameraModal Component', () => {
  let mockTrack: { stop: any }
  let mockStream: { getTracks: any }

  beforeEach(() => {
    vi.clearAllMocks()
    mockTrack = { stop: vi.fn() }
    mockStream = { getTracks: vi.fn().mockReturnValue([mockTrack]) }

    // Mock navigator.mediaDevices.getUserMedia
    Object.defineProperty(global.navigator, 'mediaDevices', {
      writable: true,
      value: {
        getUserMedia: vi.fn().mockResolvedValue(mockStream)
      }
    })

    // Mock URL object methods
    global.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-image-url')
    global.URL.revokeObjectURL = vi.fn()

    // Mock HTMLMediaElement.prototype.play
    HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined)

    // Mock HTMLCanvasElement.prototype.toBlob
    HTMLCanvasElement.prototype.toBlob = vi.fn(function (this: HTMLCanvasElement, callback: any) {
      callback(new Blob(['mock-image-data'], { type: 'image/jpeg' }))
    })

    // Mock HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
      drawImage: vi.fn()
    }) as any
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const renderModal = (props: { isOpen: boolean; onClose?: () => void; onUploadSuccess?: (t: string) => void }) => {
    return render(
      <ToastProvider>
        <InAppCameraModal
          isOpen={props.isOpen}
          onClose={props.onClose || vi.fn()}
          onUploadSuccess={props.onUploadSuccess || vi.fn()}
        />
      </ToastProvider>
    )
  }

  it('does not render when isOpen is false', () => {
    renderModal({ isOpen: false })
    expect(screen.queryByText(/Chụp ảnh bài làm/i)).not.toBeInTheDocument()
  })

  it('requests camera stream on open and cleans up tracks on unmount', async () => {
    const { unmount } = renderModal({ isOpen: true })

    expect(screen.getByText(/Chụp ảnh bài làm trực tiếp/i)).toBeInTheDocument()
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Chụp ảnh/i })).toBeInTheDocument()
    })

    unmount()
    expect(mockTrack.stop).toHaveBeenCalled()
  })

  it('handles camera permission denied gracefully', async () => {
    navigator.mediaDevices.getUserMedia = vi.fn().mockRejectedValue(new Error('Permission denied'))

    renderModal({ isOpen: true })

    await waitFor(() => {
      expect(screen.getByText(/Không thể truy cập máy ảnh/i)).toBeInTheDocument()
    })
  })

  it('captures photo, calls OCR, and triggers onUploadSuccess', async () => {
    const mockOnUploadSuccess = vi.fn()
    const mockOnClose = vi.fn()
    ;(recognizeHandwriting as any).mockResolvedValue('\\frac{1}{2} + \\frac{1}{3} = \\frac{5}{6}')

    renderModal({
      isOpen: true,
      onClose: mockOnClose,
      onUploadSuccess: mockOnUploadSuccess
    })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Chụp ảnh/i })).toBeInTheDocument()
    })

    // Click snap button
    const snapBtn = screen.getByRole('button', { name: /Chụp ảnh/i })
    fireEvent.click(snapBtn)

    // Verify preview and confirm button appear
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Sử dụng ảnh này/i })).toBeInTheDocument()
    })

    // Click confirm / use photo
    const confirmBtn = screen.getByRole('button', { name: /Sử dụng ảnh này/i })
    fireEvent.click(confirmBtn)

    await waitFor(() => {
      expect(recognizeHandwriting).toHaveBeenCalled()
      expect(mockOnUploadSuccess).toHaveBeenCalledWith('\\frac{1}{2} + \\frac{1}{3} = \\frac{5}{6}')
      expect(mockOnClose).toHaveBeenCalled()
    })
  })
})
