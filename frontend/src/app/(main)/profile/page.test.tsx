import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ProfilePage from './page'
import * as api from '@/lib/api'
import { toast } from 'react-hot-toast'

const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: mockPush,
  })),
}))

vi.mock('@/lib/api', () => ({
  apiFetch: vi.fn(),
  uploadUserAvatar: vi.fn(),
}))

vi.mock('react-hot-toast', () => ({
  default: {
    error: vi.fn(),
    success: vi.fn(),
  },
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
  Toaster: () => null,
}))

// Mock window.confirm
global.confirm = vi.fn(() => true)

describe('ProfilePage Component - Dual Telegram', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('renders dual Telegram linking cards when neither is linked', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'student@example.com',
      fullName: 'Nguyễn Văn A',
      role: 'student',
      grade: '9',
      points: 150,
      telegramId: null,
      telegramId2: null,
    }

    vi.mocked(api.apiFetch).mockResolvedValueOnce({
      data: mockUser,
    } as any)

    render(<ProfilePage />)

    await waitFor(() => {
      expect(screen.getByText('Telegram 1 (Học sinh)')).toBeInTheDocument()
      expect(screen.getByText('Telegram 2 (Phụ huynh)')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Liên kết Telegram Học sinh/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Liên kết Telegram Phụ huynh/i })).toBeInTheDocument()
    })
  })

  it('displays connected info for both slots and allows unlinking', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'student@example.com',
      fullName: 'Nguyễn Văn A',
      role: 'student',
      grade: '9',
      points: 150,
      telegramId: 111222,
      telegramUsername: 'student_tg',
      telegramId2: 333444,
      telegramUsername2: 'parent_tg',
    }

    vi.mocked(api.apiFetch).mockResolvedValueOnce({
      data: mockUser,
    } as any)

    render(<ProfilePage />)

    await waitFor(() => {
      expect(screen.getByText('@student_tg')).toBeInTheDocument()
      expect(screen.getByText('@parent_tg')).toBeInTheDocument()
    })

    // Unlink slot 2 (Parent)
    vi.mocked(api.apiFetch).mockResolvedValueOnce({
      message: 'Hủy liên kết thành công',
      slot: 2,
    } as any)
    vi.mocked(api.apiFetch).mockResolvedValueOnce({
      data: { ...mockUser, telegramId2: null, telegramUsername2: null },
    } as any)

    const unlinkBtns = screen.getAllByTitle(/Hủy liên kết Telegram/i)
    expect(unlinkBtns.length).toBe(2)

    fireEvent.click(unlinkBtns[1]) // Slot 2

    await waitFor(() => {
      expect(api.apiFetch).toHaveBeenCalledWith('/users/me/unlink-telegram', {
        method: 'POST',
        body: JSON.stringify({ slot: 2 }),
      })
    })
  })
})
