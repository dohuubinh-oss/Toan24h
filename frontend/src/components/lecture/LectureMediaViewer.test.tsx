import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import LectureMediaViewer from './LectureMediaViewer'

describe('LectureMediaViewer', () => {
  it('renders a youtube facade and loads iframe on click', () => {
    const url = 'https://www.youtube.com/embed/dQw4w9WgXcQ'
    render(<LectureMediaViewer mediaType="youtube" url={url} />)
    
    // Initial state: no iframe, should show thumbnail
    expect(screen.queryByTestId('youtube-iframe')).not.toBeInTheDocument()
    const thumbnail = screen.getByAltText('Video thumbnail')
    expect(thumbnail).toBeInTheDocument()
    expect(thumbnail).toHaveAttribute('src', expect.stringContaining('dQw4w9WgXcQ'))
    
    // Click on the thumbnail container
    fireEvent.click(thumbnail)
    
    // Now iframe should be in the document
    const iframe = screen.getByTestId('youtube-iframe')
    expect(iframe).toBeInTheDocument()
    expect(iframe).toHaveAttribute('src', expect.stringContaining(url))
    expect(iframe).toHaveAttribute('src', expect.stringContaining('autoplay=1'))
  })

  it('renders an image when type is image', () => {
    const url = 'https://example.com/image.png'
    render(<LectureMediaViewer mediaType="image" url={url} />)
    const img = screen.getByTestId('media-image')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', url)
  })

  it('opens lightbox when image is clicked and closes when close button is clicked', () => {
    const url = 'https://example.com/image.png'
    render(<LectureMediaViewer mediaType="image" url={url} />)
    
    // Click image to open lightbox
    const img = screen.getByTestId('media-image')
    fireEvent.click(img)
    
    const lightboxImage = screen.getByTestId('lightbox-image')
    expect(lightboxImage).toBeInTheDocument()
    
    // Close lightbox
    const closeBtn = screen.getByTestId('lightbox-close')
    fireEvent.click(closeBtn)
    
    expect(screen.queryByTestId('lightbox-image')).not.toBeInTheDocument()
  })
})
