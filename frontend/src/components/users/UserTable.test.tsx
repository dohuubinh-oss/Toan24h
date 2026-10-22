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
    expect(screen.getByText(/2026|2027/)).toBeInTheDocument()
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

  it('renders initial of last word when user avatar is not provided', () => {
    render(<UserTable users={mockUsers} onSoftDelete={vi.fn()} />)
    // Nguyen Van A -> 'A'
    expect(screen.getByText('A')).toBeInTheDocument()
    // Tran Thi B -> 'B'
    expect(screen.getByText('B')).toBeInTheDocument()
  })

  it('does not display role change button when isAdmin is false', () => {
    render(<UserTable users={mockUsers} onSoftDelete={vi.fn()} isAdmin={false} />)
    expect(screen.queryByTitle(/Phân quyền/i)).not.toBeInTheDocument()
  })

  it('displays role change button when isAdmin is true and opens role modal', () => {
    const handleUpdateRole = vi.fn()
    render(<UserTable users={mockUsers} onSoftDelete={vi.fn()} isAdmin={true} onUpdateRole={handleUpdateRole} />)

    const roleButtons = screen.getAllByTitle(/Phân quyền/i)
    expect(roleButtons.length).toBe(2)

    // Click on the first user's role button
    fireEvent.click(roleButtons[0])

    // Modal should show up
    expect(screen.getByText(/Phân quyền người dùng/i)).toBeInTheDocument()
    expect(screen.getAllByText(/Nguyen Van A/i).length).toBeGreaterThanOrEqual(2)

    // Select 'Giáo viên' option
    const teacherOption = screen.getByLabelText(/Giáo viên/i)
    fireEvent.click(teacherOption)

    // Click confirm
    const saveButton = screen.getByRole('button', { name: /Lưu thay đổi/i })
    fireEvent.click(saveButton)

    expect(handleUpdateRole).toHaveBeenCalledWith('1', 'Nguyen Van A', 'teacher')
  })

  it('allows admin to set role to affiliate', () => {
    const handleUpdateRole = vi.fn()
    render(<UserTable users={mockUsers} onSoftDelete={vi.fn()} isAdmin={true} onUpdateRole={handleUpdateRole} />)

    const roleButtons = screen.getAllByTitle(/Phân quyền/i)
    fireEvent.click(roleButtons[0])

    // Select 'Affiliate' option
    const affiliateOption = screen.getByLabelText(/Affiliate/i)
    fireEvent.click(affiliateOption)

    // Click confirm
    const saveButton = screen.getByRole('button', { name: /Lưu thay đổi/i })
    fireEvent.click(saveButton)

    expect(handleUpdateRole).toHaveBeenCalledWith('1', 'Nguyen Van A', 'affiliate')
  })

  it('does not display student option in role management modal', () => {
    render(<UserTable users={mockUsers} onSoftDelete={vi.fn()} isAdmin={true} onUpdateRole={vi.fn()} />)
    const roleButtons = screen.getAllByTitle(/Phân quyền/i)
    fireEvent.click(roleButtons[0])

    expect(screen.queryByLabelText(/Học sinh \(Student\)/i)).not.toBeInTheDocument()
    expect(screen.getByLabelText(/Giáo viên/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Affiliate/i)).toBeInTheDocument()
  })
})

