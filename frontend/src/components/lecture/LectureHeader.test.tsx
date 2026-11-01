import React, { act } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import LectureHeader from './LectureHeader'

vi.mock('@/lib/bookmarkApi', () => ({
  toggleBookmark: vi.fn(),
  getBookmarkedLectures: vi.fn().mockResolvedValue([]),
}))

vi.mock('@/components/ui/ToastProvider', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

describe('LectureHeader - Mở Drive button visibility', () => {
  beforeEach(() => {
    // Clear cookies & storage
    document.cookie = 'userRole=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
    localStorage.clear()
  })

  it('does NOT render Mở Drive button for anonymous guests', async () => {
    await act(async () => {
      render(
        <LectureHeader
          title="Bài 1: Số hữu tỉ"
          grade="7"
          category="Đại số"
          createdAt="2026-10-15T00:00:00Z"
          id="lec-123"
          gg_link="https://drive.google.com/file/d/12345/view"
        />
      )
    })

    expect(screen.queryByText('Mở Drive')).not.toBeInTheDocument()
  })

  it('does NOT render Mở Drive button when user is a student', async () => {
    document.cookie = 'userRole=student; path=/'

    await act(async () => {
      render(
        <LectureHeader
          title="Bài 1: Số hữu tỉ"
          grade="7"
          category="Đại số"
          createdAt="2026-10-15T00:00:00Z"
          id="lec-123"
          gg_link="https://drive.google.com/file/d/12345/view"
        />
      )
    })

    expect(screen.queryByText('Mở Drive')).not.toBeInTheDocument()
  })

  it('renders Mở Drive button when user is a teacher', async () => {
    document.cookie = 'userRole=teacher; path=/'

    await act(async () => {
      render(
        <LectureHeader
          title="Bài 1: Số hữu tỉ"
          grade="7"
          category="Đại số"
          createdAt="2026-10-15T00:00:00Z"
          id="lec-123"
          gg_link="https://drive.google.com/file/d/12345/view"
        />
      )
    })

    await waitFor(() => {
      const driveLink = screen.getByText('Mở Drive')
      expect(driveLink).toBeInTheDocument()
      expect(driveLink.closest('a')).toHaveAttribute('href', 'https://drive.google.com/file/d/12345/view')
    })
  })

  it('renders Mở Drive button when user is an admin', async () => {
    document.cookie = 'userRole=admin; path=/'

    await act(async () => {
      render(
        <LectureHeader
          title="Bài 1: Số hữu tỉ"
          grade="7"
          category="Đại số"
          createdAt="2026-10-15T00:00:00Z"
          id="lec-123"
          gg_link="https://drive.google.com/file/d/12345/view"
        />
      )
    })

    await waitFor(() => {
      const driveLink = screen.getByText('Mở Drive')
      expect(driveLink).toBeInTheDocument()
      expect(driveLink.closest('a')).toHaveAttribute('href', 'https://drive.google.com/file/d/12345/view')
    })
  })

  it('does NOT render Mở Drive button if gg_link is missing or empty even for admin', async () => {
    document.cookie = 'userRole=admin; path=/'

    await act(async () => {
      render(
        <LectureHeader
          title="Bài 1: Số hữu tỉ"
          grade="7"
          category="Đại số"
          createdAt="2026-10-15T00:00:00Z"
          id="lec-123"
          gg_link=""
        />
      )
    })

    expect(screen.queryByText('Mở Drive')).not.toBeInTheDocument()
  })
})
