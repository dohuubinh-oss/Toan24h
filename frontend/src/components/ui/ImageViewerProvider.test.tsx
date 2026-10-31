import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ImageViewerProvider, useImageViewer } from './ImageViewerProvider'

function TestConsumer() {
  const { openImage } = useImageViewer()
  return (
    <div>
      <button onClick={() => openImage('https://example.com/test.png', 'Test Alt')}>
        Mở ảnh thủ công
      </button>
      <div className="latex-font">
        <img
          src="https://example.com/math-image.png"
          alt="Hình học không gian"
          width={200}
          height={200}
        />
      </div>
      <header>
        <nav>
          <img src="/logo.png" alt="Logo toan6789" width={40} height={40} />
        </nav>
      </header>
    </div>
  )
}

describe('ImageViewerProvider', () => {
  it('allows programmatic opening of image viewer via hook', () => {
    render(
      <ImageViewerProvider>
        <TestConsumer />
      </ImageViewerProvider>
    )

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    const btn = screen.getByRole('button', { name: /Mở ảnh thủ công/i })
    fireEvent.click(btn)

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Test Alt')).toBeInTheDocument()
  })

  it('delegates document click on content images to open lightbox', () => {
    render(
      <ImageViewerProvider>
        <TestConsumer />
      </ImageViewerProvider>
    )

    const mathImg = screen.getByAltText('Hình học không gian')
    fireEvent.click(mathImg)

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Hình học không gian')).toBeInTheDocument()
  })

  it('ignores logo images inside header nav', () => {
    render(
      <ImageViewerProvider>
        <TestConsumer />
      </ImageViewerProvider>
    )

    const logoImg = screen.getByAltText('Logo toan6789')
    fireEvent.click(logoImg)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
