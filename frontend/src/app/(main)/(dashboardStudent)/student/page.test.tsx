import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import StudentDashboardPage from './page'

// Mock cookies
vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue(undefined)
  })
}))

describe('StudentDashboardPage Component', () => {
  it('renders main layout components', async () => {
    const Page = await StudentDashboardPage()
    render(Page)
    
    // Main column elements
    expect(screen.getByText(/Chào mừng trở lại/i)).toBeInTheDocument()
    expect(screen.getByText(/Đang học tiếp/i)).toBeInTheDocument()
    expect(screen.getByText(/Chủ đề toán học/i)).toBeInTheDocument()
    
    // Sidebar elements
    expect(screen.getByText(/Bảng xếp hạng/i)).toBeInTheDocument()
    expect(screen.getByText(/Thành tích/i)).toBeInTheDocument()
    expect(screen.getByText(/Thử thách/i)).toBeInTheDocument()
  })
})
