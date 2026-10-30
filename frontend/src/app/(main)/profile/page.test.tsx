import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
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

// Mock navigator.clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined),
  },
})

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

describe('ProfilePage Component - Partner & Referral Program', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('renders partner card with referral code, commission rates and balance for teacher', async () => {
    const mockTeacher = {
      id: 'teacher-123',
      email: 'teacher@example.com',
      fullName: 'Thầy Nguyễn Văn B',
      role: 'teacher',
      grade: '9',
      points: 500,
      referralCode: 'GT123456',
      commissionBalance: 180000,
      totalCommissionReceived: 1500000,
    }

    vi.mocked(api.apiFetch).mockResolvedValueOnce({
      data: mockTeacher,
    } as any)

    render(<ProfilePage />)

    await waitFor(() => {
      expect(screen.getByText(/Mã Giới Thiệu & Hoa Hồng Đối Tác/i)).toBeInTheDocument()
      expect(screen.getByText('GT123456')).toBeInTheDocument()
      expect(screen.getByText(/180\.000\s*đ/)).toBeInTheDocument()
      expect(screen.getByText(/1\.500\.000\s*đ/)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Sao chép mã/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Sao chép link đăng ký/i })).toBeInTheDocument()
    })

    // Test copy referral code
    const copyCodeBtn = screen.getByRole('button', { name: /Sao chép mã/i })
    await act(async () => {
      fireEvent.click(copyCodeBtn)
    })
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('GT123456')

    // Test copy referral registration link
    const copyLinkBtn = screen.getByRole('button', { name: /Sao chép link đăng ký/i })
    await act(async () => {
      fireEvent.click(copyLinkBtn)
    })
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(`${window.location.origin}/register?ref=GT123456`)
  })

  it('renders correct commission rates for admin (70%) and affiliate (30%)', async () => {
    const mockAdmin = {
      id: 'admin-123',
      email: 'admin@example.com',
      fullName: 'Quản Trị Viên',
      role: 'admin',
      referralCode: 'GTADMIN1',
      commissionBalance: 500000,
      totalCommissionReceived: 2000000,
    }

    vi.mocked(api.apiFetch).mockResolvedValueOnce({
      data: mockAdmin,
    } as any)

    const { unmount } = render(<ProfilePage />)

    await waitFor(() => {
      expect(screen.getByText('GTADMIN1')).toBeInTheDocument()
      expect(screen.getByText(/70%/)).toBeInTheDocument()
    })

    unmount()

    const mockAffiliate = {
      id: 'aff-123',
      email: 'affiliate@example.com',
      fullName: 'Đối Tác Affiliate',
      role: 'affiliate',
      referralCode: 'GTAFF123',
      commissionBalance: 100000,
      totalCommissionReceived: 300000,
    }

    vi.mocked(api.apiFetch).mockResolvedValueOnce({
      data: mockAffiliate,
    } as any)

    render(<ProfilePage />)

    await waitFor(() => {
      expect(screen.getByText('GTAFF123')).toBeInTheDocument()
      expect(screen.getByText(/30%/)).toBeInTheDocument()
    })
  })

  it('hides partner card completely when user is a student', async () => {
    const mockStudent = {
      id: 'student-123',
      email: 'student@example.com',
      fullName: 'Học sinh C',
      role: 'student',
      grade: '8',
      points: 100,
      referralCode: null,
      commissionBalance: 0,
      totalCommissionReceived: 0,
    }

    vi.mocked(api.apiFetch).mockResolvedValueOnce({
      data: mockStudent,
    } as any)

    render(<ProfilePage />)

    await waitFor(() => {
      expect(screen.getByText('Học sinh C')).toBeInTheDocument()
    })

    expect(screen.queryByText(/Mã Giới Thiệu & Hoa Hồng Đối Tác/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Sao chép mã/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Sao chép link đăng ký/i })).not.toBeInTheDocument()
  })

  it('renders grade badge and opens contact modal when clicked', async () => {
    const mockStudent = {
      id: 'student-grade5',
      email: 'grade5@example.com',
      fullName: 'Học sinh Lớp 5',
      role: 'student',
      grade: '5',
      points: 50,
    }

    vi.mocked(api.apiFetch).mockResolvedValueOnce({
      data: mockStudent,
    } as any)

    render(<ProfilePage />)

    await waitFor(() => {
      expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
      expect(screen.getAllByText('Lớp 5').length).toBeGreaterThanOrEqual(1)
    })

    // Click grade badge to open contact modal
    const gradeBtn = screen.getByRole('button', { name: 'Lớp 5' })
    await act(async () => {
      fireEvent.click(gradeBtn)
    })

    expect(screen.getByRole('heading', { name: /Yêu cầu Đổi Khối lớp/i })).toBeInTheDocument()
    expect(screen.getByText(/@toan6789_admin/i)).toBeInTheDocument()
  })
})
