import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import LoginBranding from './LoginBranding'

describe('LoginBranding Component', () => {
  it('renders branding elements with default copy', () => {
    render(<LoginBranding />)
    expect(screen.getByText('Toan6789')).toBeInTheDocument()
    expect(screen.getByText('Nền tảng Toán THCS')).toBeInTheDocument()
    expect(screen.getByText('Về trang chủ')).toBeInTheDocument()
    expect(screen.getByText('Chào mừng bạn trở lại!')).toBeInTheDocument()
    expect(screen.getByText(/Cùng chinh phục môn Toán mỗi ngày với các phương pháp tư duy hiện đại và thú vị/i)).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /Toan6789 Hero/i })).toBeInTheDocument()
    expect(screen.getByText(/Chuỗi 7 Ngày Streak/i)).toBeInTheDocument()
    expect(screen.getByText(/1.000\+ Dạng Toán & Lời Giải AI/i)).toBeInTheDocument()
    expect(screen.getByText('Hệ sinh thái EdTech 6789')).toBeInTheDocument()
    expect(screen.getByText('© 2026 Toan6789')).toBeInTheDocument()
    // Math symbols
    expect(screen.getByText('∑')).toBeInTheDocument()
    expect(screen.getByText('π')).toBeInTheDocument()
    expect(screen.getByText('√x')).toBeInTheDocument()
    expect(screen.getByText('f(x)')).toBeInTheDocument()
    expect(screen.getByText('x² + y² = r²')).toBeInTheDocument()
  })

  it('supports custom title and subtitle', () => {
    render(<LoginBranding title="Khám phá Toán học" subtitle="Bắt đầu ngay hôm nay" />)
    expect(screen.getByText('Khám phá Toán học')).toBeInTheDocument()
    expect(screen.getByText('Bắt đầu ngay hôm nay')).toBeInTheDocument()
  })
})
