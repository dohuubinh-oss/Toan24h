import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import CreateBlogPostPage from './page'
import { ToastProvider } from '@/components/ui/ToastProvider'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}))

describe('CreateBlogPostPage shorts playlist mode', () => {
  it('allows switching post type to Playlist Video Shorts and adding short items', () => {
    render(
      <ToastProvider>
        <CreateBlogPostPage />
      </ToastProvider>
    )

    const shortsRadio = screen.getByLabelText(/Playlist Video Shorts/i)
    fireEvent.click(shortsRadio)

    const addBtn = screen.getAllByRole('button', { name: /Thêm video Short/i })[0]
    expect(addBtn).toBeInTheDocument()
    fireEvent.click(addBtn)

    expect(screen.getAllByPlaceholderText(/Dán link YouTube Short/i).length).toBe(2)

    // Fill data for first short
    const shortsInputs = screen.getAllByPlaceholderText(/Dán link YouTube Short/i)
    fireEvent.change(shortsInputs[0], { target: { value: 'https://www.youtube.com/shorts/dQw4w9WgXcQ' } })
    const titleInputs = screen.getAllByPlaceholderText(/Mẹo Casio 1/i)
    fireEvent.change(titleInputs[0], { target: { value: 'Tip 1: Bấm máy cực trị' } })

    // Switch to preview mode
    const previewTabBtn = screen.getByRole('button', { name: /Xem trước/i })
    fireEvent.click(previewTabBtn)

    expect(screen.getAllByText('Tip 1: Bấm máy cực trị').length).toBeGreaterThan(0)
  })
})
