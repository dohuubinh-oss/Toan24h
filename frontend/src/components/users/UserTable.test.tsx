import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import UserTable from './UserTable'

describe('UserTable', () => {
  it('renders table columns', () => {
    render(<UserTable />)
    expect(screen.getByText('Họ tên & Avatar')).toBeInTheDocument()
    expect(screen.getByText('Vai trò')).toBeInTheDocument()
    expect(screen.getByText('Khối lớp')).toBeInTheDocument()
    expect(screen.getByText('Ngày tham gia')).toBeInTheDocument()
    expect(screen.getByText('Trạng thái')).toBeInTheDocument()
    expect(screen.getByText('Hành động')).toBeInTheDocument()
  })
})
