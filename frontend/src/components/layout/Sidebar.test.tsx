import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import Sidebar from './Sidebar'

vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard/questions',
}))

describe('Sidebar', () => {
  it('does NOT render "Quản lý người dùng" link for teacher role', () => {
    render(<Sidebar role="teacher" />)
    expect(screen.getByText('Ngân hàng câu hỏi')).toBeInTheDocument()
    expect(screen.getByText('Ngân hàng đề thi')).toBeInTheDocument()
    expect(screen.getByText('Báo lỗi/Kháng cáo')).toBeInTheDocument()
    expect(screen.queryByText('Quản lý người dùng')).not.toBeInTheDocument()
  })

  it('renders "Quản lý người dùng" link for admin role', () => {
    render(<Sidebar role="admin" />)
    expect(screen.getByText('Ngân hàng câu hỏi')).toBeInTheDocument()
    expect(screen.getByText('Ngân hàng đề thi')).toBeInTheDocument()
    expect(screen.getByText('Quản lý người dùng')).toBeInTheDocument()
    expect(screen.getByText('Báo lỗi/Kháng cáo')).toBeInTheDocument()
  })

  it('renders student navigation links for student role', () => {
    render(<Sidebar role="student" />)
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Bài học')).toBeInTheDocument()
    expect(screen.getByText('Đề thi')).toBeInTheDocument()
    expect(screen.getByText('Bảng xếp hạng')).toBeInTheDocument()
    expect(screen.queryByText('Quản lý người dùng')).not.toBeInTheDocument()
  })
})
