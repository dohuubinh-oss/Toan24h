import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import LectureSelectorModal from './LectureSelectorModal'
import * as api from '@/lib/api'

vi.mock('@/lib/api', () => ({
  apiFetch: vi.fn(),
}))

const mockLectures = [
  { id: '1', title: 'Bài 1: Tập hợp', grade: '6', category: 'Số học' },
  { id: '2', title: 'Bài 2: Đơn thức', grade: '8', category: 'Đại số' },
]

describe('LectureSelectorModal Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(api.apiFetch).mockResolvedValue({ data: mockLectures })
  })

  it('does not render when isOpen is false', () => {
    render(<LectureSelectorModal isOpen={false} onClose={vi.fn()} onSelect={vi.fn()} />)
    expect(screen.queryByText('Chọn bài giảng liên kết')).not.toBeInTheDocument()
  })

  it('fetches and renders lectures when open', async () => {
    render(<LectureSelectorModal isOpen={true} onClose={vi.fn()} onSelect={vi.fn()} />)

    expect(screen.getByText('Chọn bài giảng liên kết')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByText('Bài 1: Tập hợp')).toBeInTheDocument()
      expect(screen.getByText('Bài 2: Đơn thức')).toBeInTheDocument()
    })
  })

  it('selects lecture on item click', async () => {
    const handleSelect = vi.fn()
    const handleClose = vi.fn()

    render(
      <LectureSelectorModal
        isOpen={true}
        onClose={handleClose}
        onSelect={handleSelect}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Bài 1: Tập hợp')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Bài 1: Tập hợp'))
    expect(handleSelect).toHaveBeenCalledWith(mockLectures[0])
    expect(handleClose).toHaveBeenCalled()
  })

  it('filters lectures by grade tab', async () => {
    render(<LectureSelectorModal isOpen={true} onClose={vi.fn()} onSelect={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByText('Bài 1: Tập hợp')).toBeInTheDocument()
    })

    // Click tab Lớp 8
    fireEvent.click(screen.getByText('Lớp 8'))
    expect(screen.queryByText('Bài 1: Tập hợp')).not.toBeInTheDocument()
    expect(screen.getByText('Bài 2: Đơn thức')).toBeInTheDocument()
  })
})
