import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import StudentDashboardPage from './page'

describe('StudentDashboardPage Component', () => {
  it('renders main layout components', () => {
    render(<StudentDashboardPage />)
    
    // Main column elements
    expect(screen.getByText(/Chào mừng trở lại/i)).toBeInTheDocument()
    expect(screen.getByText(/Đang học tiếp/i)).toBeInTheDocument()
    expect(screen.getByText(/Chủ đề toán học/i)).toBeInTheDocument()
    
    // Sidebar elements
    expect(screen.getByText(/Bảng xếp hạng/i)).toBeInTheDocument()
    expect(screen.getByText(/Thành tích/i)).toBeInTheDocument()
    expect(screen.getByText(/Thử thách hàng ngày/i)).toBeInTheDocument()
  })
})
