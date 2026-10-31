import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import HomeNavigation from './HomeNavigation'

describe('HomeNavigation', () => {
  beforeEach(() => {
    localStorage.clear()
    document.cookie = 'userRole=; expires=Thu, 01 Jan 1970 00:00:00 UTC;'
  })

  it('renders logo and navigation links', () => {
    render(<HomeNavigation />)
    expect(screen.getAllByText(/Math/i)[0]).toBeInTheDocument()
    expect(screen.getAllByText(/AI/i)[0]).toBeInTheDocument()
    expect(screen.getAllByText('Trang chủ')[0]).toBeInTheDocument()
    expect(screen.getAllByText('Đăng nhập')[0]).toBeInTheDocument()
    expect(screen.getByText('Học ngay')).toBeInTheDocument()
  })

  it('renders initial of last word in avatar when logged in', () => {
    localStorage.setItem('user', JSON.stringify({ fullName: 'Nguyễn Văn An', role: 'student', grade: 9 }))
    document.cookie = 'userRole=student'

    render(<HomeNavigation isLoggedIn={true} />)
    expect(screen.getAllByText('A')[0]).toBeInTheDocument()
    expect(screen.getAllByText('Nguyễn Văn An')[0]).toBeInTheDocument()
  })

  it('opens and closes mobile SideMenu when clicking hamburger and close button', () => {
    render(<HomeNavigation />)
    const hamburgerBtn = screen.getByRole('button', { name: /Mở menu điều hướng/i })
    expect(hamburgerBtn).toBeInTheDocument()

    // Click to open mobile drawer
    fireEvent.click(hamburgerBtn)
    expect(screen.getByRole('button', { name: /Đóng menu/i })).toBeInTheDocument()
    expect(screen.getByText('Học Toán THCS thông minh')).toBeInTheDocument()
    expect(screen.getByText('Bài giảng lý thuyết')).toBeInTheDocument()
    expect(screen.getByText('Góc học tập & Blog')).toBeInTheDocument()

    // Click to close
    const closeBtn = screen.getByRole('button', { name: /Đóng menu/i })
    fireEvent.click(closeBtn)
  })

  it('renders logged in mobile SideMenu items with referral, settings and logout', () => {
    localStorage.setItem('user', JSON.stringify({ fullName: 'Nguyễn Văn An', role: 'student', grade: 9 }))
    document.cookie = 'userRole=student'

    render(<HomeNavigation isLoggedIn={true} />)
    const hamburgerBtn = screen.getByRole('button', { name: /Mở menu điều hướng/i })
    fireEvent.click(hamburgerBtn)

    expect(screen.getAllByText('Nguyễn Văn An')[0]).toBeInTheDocument()
    expect(screen.getAllByText('Toán 9')[0]).toBeInTheDocument()
    expect(screen.getByText('Giới thiệu & Đối tác')).toBeInTheDocument()
    expect(screen.getByText('Cài đặt & Tài khoản')).toBeInTheDocument()
    expect(screen.getByText('Luyện đề thi')).toBeInTheDocument()
    expect(screen.getByText('Về toan6789.vn')).toBeInTheDocument()
    expect(screen.getByText('Đăng xuất tài khoản')).toBeInTheDocument()
  })
})
