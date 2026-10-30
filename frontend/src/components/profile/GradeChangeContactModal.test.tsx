import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GradeChangeContactModal } from './GradeChangeContactModal'

describe('GradeChangeContactModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock navigator.clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockImplementation(() => Promise.resolve()),
      },
    })
  })

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <GradeChangeContactModal
        isOpen={false}
        onClose={vi.fn()}
        userEmail="test@toan6789.vn"
        userName="Nguyễn Văn A"
        currentGrade="5"
      />
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('renders modal with account details and contact options when isOpen is true', () => {
    render(
      <GradeChangeContactModal
        isOpen={true}
        onClose={vi.fn()}
        userEmail="hocsinh@toan6789.vn"
        userName="Trần Văn Nam"
        currentGrade="5"
      />
    )

    expect(screen.getByText('Yêu cầu Đổi Khối lớp')).toBeInTheDocument()
    expect(screen.getByText('hocsinh@toan6789.vn')).toBeInTheDocument()
    expect(screen.getByText('Lớp 5')).toBeInTheDocument()
    expect(screen.getByText('@toan6789_admin')).toBeInTheDocument()
    expect(screen.getByText('admin@toan6789.vn')).toBeInTheDocument()
  })

  it('calls onClose when close button or dismiss button is clicked', () => {
    const handleClose = vi.fn()
    render(
      <GradeChangeContactModal
        isOpen={true}
        onClose={handleClose}
        userEmail="test@toan6789.vn"
        currentGrade="6"
      />
    )

    const closeBtn = screen.getByLabelText('Đóng popup')
    fireEvent.click(closeBtn)
    expect(handleClose).toHaveBeenCalledTimes(1)

    const dismissBtn = screen.getByText('Đã hiểu & Đóng')
    fireEvent.click(dismissBtn)
    expect(handleClose).toHaveBeenCalledTimes(2)
  })

  it('copies telegram username when copy button is clicked', async () => {
    render(
      <GradeChangeContactModal
        isOpen={true}
        onClose={vi.fn()}
        userEmail="test@toan6789.vn"
        currentGrade="7"
      />
    )

    const copyBtn = screen.getByLabelText('Sao chép Username Telegram')
    await act(async () => {
      fireEvent.click(copyBtn)
    })
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('@toan6789_admin')
  })

  it('copies admin email when copy button is clicked', async () => {
    render(
      <GradeChangeContactModal
        isOpen={true}
        onClose={vi.fn()}
        userEmail="test@toan6789.vn"
        currentGrade="8"
      />
    )

    const copyBtn = screen.getByLabelText('Sao chép Email')
    await act(async () => {
      fireEvent.click(copyBtn)
    })
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('admin@toan6789.vn')
  })
})
