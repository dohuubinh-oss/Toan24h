import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import CreateBlogPostPage from './page'
import { ToastProvider } from '@/components/ui/ToastProvider'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock('@/lib/api', () => ({
  uploadTempImage: vi.fn().mockResolvedValue('https://example.com/uploaded-image.png'),
  recognizeHandwriting: vi.fn().mockResolvedValue('Cho phương trình bậc ba: $$y = ax^3 + bx^2 + cx + d$$'),
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

  it('allows applying shorts-blog-layout guidance template on a short item', () => {
    render(
      <ToastProvider>
        <CreateBlogPostPage />
      </ToastProvider>
    )

    const shortsRadio = screen.getByLabelText(/Playlist Video Shorts/i)
    fireEvent.click(shortsRadio)

    // Click "Mẫu chuẩn shorts-blog-layout" button
    const templateBtn = screen.getByRole('button', { name: /Mẫu chuẩn shorts-blog-layout/i })
    expect(templateBtn).toBeInTheDocument()
    fireEvent.click(templateBtn)

    // Check that textarea contains step-box and formula-highlight with Grade 9 / THCS quadratic formula
    const textarea = screen.getByPlaceholderText(/Nhập lý thuyết cốt lõi/i) as HTMLTextAreaElement
    expect(textarea.value).toContain('step-box')
    expect(textarea.value).toContain('BƯỚC 1: DẠNG TOÁN & ĐỀ BÀI')
    expect(textarea.value).toContain('formula-highlight')
    expect(textarea.value).toContain('ax^2 + bx + c = 0')
    expect(textarea.value).toContain('BƯỚC 2: MẸO BẤM MÁY TRONG 15 GIÂY')
    expect(textarea.value).toContain('callout-warning')
    expect(textarea.value).toContain('đối chiếu nghiệm')
  })

  it('renders "Bí quyết thi vào 10" category and automatically handles cover image extraction without manual URL input', () => {
    render(
      <ToastProvider>
        <CreateBlogPostPage />
      </ToastProvider>
    )

    // Verify Category options
    const categorySelect = screen.getByDisplayValue('Bí quyết thi vào 10')
    expect(categorySelect).toBeInTheDocument()

    // Verify Auto cover image box is rendered with automatic extraction badge
    expect(screen.getByText('Ảnh bìa đại diện')).toBeInTheDocument()
    expect(screen.getByText('Tự động')).toBeInTheDocument()
    expect(screen.getByText(/Hệ thống tự động trích xuất hình ảnh đầu tiên trong nội dung bài viết/i)).toBeInTheDocument()

    // Verify manual link input is REMOVED
    const coverInput = screen.queryByPlaceholderText(/https:\/\/images\.unsplash\.com\/\.\.\. hoặc link ảnh tùy chọn/i)
    expect(coverInput).not.toBeInTheDocument()
  })

  it('handles image upload/paste and generates guidance matching shorts-blog-layout.html', async () => {
    render(
      <ToastProvider>
        <CreateBlogPostPage />
      </ToastProvider>
    )

    const shortsRadio = screen.getByLabelText(/Playlist Video Shorts/i)
    fireEvent.click(shortsRadio)

    // Simulate file input change
    const fileInputs = document.querySelectorAll('input[type="file"]')
    expect(fileInputs.length).toBeGreaterThan(0)

    const file = new File(['fake-image-bytes'], 'math-problem.png', { type: 'image/png' })
    fireEvent.change(fileInputs[0], { target: { files: [file] } })

    await waitFor(() => {
      // Check that title was auto-generated from OCR on the newly added short
      const titleInputs = screen.getAllByPlaceholderText(/Mẹo Casio/i) as HTMLInputElement[]
      const hasGeneratedTitle = titleInputs.some(input => input.value.includes('Mẹo giải nhanh'))
      expect(hasGeneratedTitle).toBe(true)

      // Check that notes contain step-box, formula-highlight, and callout-warning
      const textareas = screen.getAllByPlaceholderText(/Nhập lý thuyết cốt lõi/i) as HTMLTextAreaElement[]
      const hasGeneratedNotes = textareas.some(ta => ta.value.includes('step-box'))
      expect(hasGeneratedNotes).toBe(true)
    }, { timeout: 3000 })
  })

  it('renders Creator Studio layout with structured header, post type selector, and 4 inspector cards', () => {
    render(
      <ToastProvider>
        <CreateBlogPostPage />
      </ToastProvider>
    )

    // Header Back button & title
    const backBtn = screen.getByRole('link', { name: /Quay lại danh sách Blog/i })
    expect(backBtn).toHaveAttribute('href', '/blog')
    expect(screen.getByText('Tạo bài viết Blog mới')).toBeInTheDocument()

    // 4 Inspector cards in the Right Sidebar
    expect(screen.getByText('Tác giả bài viết')).toBeInTheDocument()
    expect(screen.getByText('Xuất bản & Phân loại')).toBeInTheDocument()
    expect(screen.getByText('Ảnh bìa đại diện')).toBeInTheDocument()
    expect(screen.getByText(/Thẻ từ khóa/i)).toBeInTheDocument()
  })

  it('provides automatic Table of Contents (TOC) creation from H1 headings', () => {
    render(
      <ToastProvider>
        <CreateBlogPostPage />
      </ToastProvider>
    )

    // Verify TOC banner exists
    expect(screen.getByText('Mục lục tự động (Thẻ H1)')).toBeInTheDocument()
    expect(screen.getByText(/Tạo mục lục tự động/i)).toBeInTheDocument()
    expect(screen.getByText('Chưa có thẻ H1')).toBeInTheDocument()

    // Click "+ Thêm thẻ H1" to add first H1 heading
    const addH1Btn = screen.getByRole('button', { name: /\+ Thêm thẻ H1/i })
    fireEvent.click(addH1Btn)

    // Check that H1 was recognized and count updated
    expect(screen.getByText('Đã nhận diện 1 đề mục H1')).toBeInTheDocument()

    // Click "+ Thêm thẻ H1" again to add second H1 heading
    fireEvent.click(addH1Btn)
    expect(screen.getByText('Đã nhận diện 2 đề mục H1')).toBeInTheDocument()

    // Click "Tạo mục lục tự động"
    const genTocBtn = screen.getByRole('button', { name: /Tạo mục lục tự động/i })
    fireEvent.click(genTocBtn)

    // Switch to Preview Tab to verify generated TOC renders in preview
    const previewTabBtn = screen.getByRole('button', { name: /Xem trước/i })
    fireEvent.click(previewTabBtn)

    expect(screen.getAllByText(/MỤC LỤC BÀI VIẾT/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Tiêu đề mục chính thứ 1/i).length).toBeGreaterThan(0)
  })
})
