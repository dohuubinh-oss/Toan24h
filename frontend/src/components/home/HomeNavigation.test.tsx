import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import HomeNavigation from './HomeNavigation'

describe('HomeNavigation', () => {
  it('renders logo and links', () => {
    render(<HomeNavigation />)
    expect(screen.getByText(/Math/i)).toBeInTheDocument()
    expect(screen.getByText(/AI/i)).toBeInTheDocument()
    expect(screen.getByText('Trang chủ')).toBeInTheDocument()
    expect(screen.getByText('Đăng nhập')).toBeInTheDocument()
    expect(screen.getByText('Học ngay')).toBeInTheDocument()
  })

  it('renders initial of last word in avatar when logged in', () => {
    localStorage.setItem('user', JSON.stringify({ fullName: 'Nguyễn Văn An', role: 'student', grade: 9 }))
    document.cookie = 'userRole=student'

    render(<HomeNavigation isLoggedIn={true} />)
    // Tên đầy đủ là Nguyễn Văn An -> ký tự avatar là chữ đầu của từ cuối ("An") -> 'A'
    expect(screen.getByText('A')).toBeInTheDocument()
    expect(screen.getByText('Nguyễn Văn An')).toBeInTheDocument()

    localStorage.clear()
    document.cookie = 'userRole=; expires=Thu, 01 Jan 1970 00:00:00 UTC;'
  })
})
