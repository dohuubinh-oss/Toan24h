import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import DynamicWatermark from './DynamicWatermark'

describe('DynamicWatermark Component', () => {
  beforeEach(() => {
    localStorage.clear()

    // Mock HTMLCanvasElement.prototype.getContext and toDataURL
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
      clearRect: vi.fn(),
      save: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      fillText: vi.fn(),
      restore: vi.fn(),
    }) as any
    HTMLCanvasElement.prototype.toDataURL = vi.fn().mockReturnValue('data:image/png;base64,mockWatermarkPattern')
  })

  it('renders watermark using custom text prop', () => {
    render(<DynamicWatermark text="student_vip@gmail.com" />)

    const watermark = screen.getByTestId('dynamic-watermark')
    expect(watermark).toBeInTheDocument()
    expect(watermark.style.backgroundImage).toContain('mockWatermarkPattern')
    expect(screen.getByText(/ID: student_vip@gmail.com/i)).toBeInTheDocument()
  })

  it('automatically resolves student email from localStorage user', () => {
    localStorage.setItem(
      'user',
      JSON.stringify({
        id: 'u-123',
        email: 'nguyenvana@gmail.com',
        fullName: 'Nguyễn Văn A',
      })
    )

    render(<DynamicWatermark />)

    const watermark = screen.getByTestId('dynamic-watermark')
    expect(watermark).toBeInTheDocument()
    expect(screen.getByText(/ID: nguyenvana@gmail.com/i)).toBeInTheDocument()
  })

  it('falls back to phone number if email is not available', () => {
    localStorage.setItem(
      'user',
      JSON.stringify({
        id: 'u-456',
        phone: '0987654321',
        fullName: 'Học Sinh VIP',
      })
    )

    render(<DynamicWatermark />)

    expect(screen.getByText(/ID: 0987654321/i)).toBeInTheDocument()
  })

  it('renders nothing when no user is logged in and no text prop is provided', () => {
    render(<DynamicWatermark />)

    expect(screen.queryByTestId('dynamic-watermark')).not.toBeInTheDocument()
  })

  it('applies pointer-events-none and select-none to ensure zero interference with user clicks', () => {
    render(<DynamicWatermark text="hocsinh@toan6789.vn" />)

    const watermark = screen.getByTestId('dynamic-watermark')
    expect(watermark.className).toContain('pointer-events-none')
    expect(watermark.className).toContain('select-none')
  })
})
