import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import UserTable, { User } from './UserTable'

describe('UserTable', () => {
  const mockUsers: User[] = [
    {
      id: '1',
      name: 'Nguyen Van A',
      email: 'a@example.com',
      role: 'student',
      grade: '10',
      joinDate: '01/01/2026',
      status: 'active',
      expiresAt: '2026-12-31T23:59:59Z',
    },
    {
      id: '2',
      name: 'Tran Thi B',
      email: 'b@example.com',
      role: 'teacher',
      grade: '11',
      joinDate: '02/01/2026',
      status: 'active',
      expiresAt: null,
    },
  ]

  it('renders "Ngày hết hạn" column header and not "Ngày tham gia"', () => {
    render(<UserTable users={mockUsers} onSoftDelete={vi.fn()} />)
    expect(screen.getByText('Ngày hết hạn')).toBeInTheDocument()
    expect(screen.queryByText('Ngày tham gia')).not.toBeInTheDocument()
  })

  it('displays formatted expiration date or fallback', () => {
    render(<UserTable users={mockUsers} onSoftDelete={vi.fn()} />)
    expect(screen.getByText(/31\/12\/2026/)).toBeInTheDocument()
    expect(screen.getByText('Chưa kích hoạt')).toBeInTheDocument()
  })

  it('does not have recharge button or recharge inputs', () => {
    render(<UserTable users={mockUsers} onSoftDelete={vi.fn()} />)
    expect(screen.queryByTitle('Nạp tiền/Gia hạn')).not.toBeInTheDocument()
    expect(screen.queryByText('tháng')).not.toBeInTheDocument()
  })

  it('allows locking user', () => {
    const handleSoftDelete = vi.fn()
    window.confirm = vi.fn(() => true)
    render(<UserTable users={mockUsers} onSoftDelete={handleSoftDelete} />)

    const lockButtons = screen.getAllByTitle('Khóa tài khoản')
    expect(lockButtons.length).toBe(2)
    fireEvent.click(lockButtons[0])
    expect(handleSoftDelete).toHaveBeenCalledWith('1', 'Nguyen Van A')
  })
})
