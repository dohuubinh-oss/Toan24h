import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ConfirmModal } from './ConfirmModal'

describe('ConfirmModal Component', () => {
  it('does not render when isOpen is false', () => {
    render(
      <ConfirmModal
        isOpen={false}
        title="Xác nhận"
        description="Bạn có chắc chắn?"
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    )
    expect(screen.queryByText('Xác nhận')).not.toBeInTheDocument()
  })

  it('renders title, description and action buttons when open', () => {
    const handleClose = vi.fn()
    const handleConfirm = vi.fn()

    render(
      <ConfirmModal
        isOpen={true}
        title="Xóa câu hỏi"
        description="Bạn có chắc chắn muốn xóa câu hỏi này không?"
        onClose={handleClose}
        onConfirm={handleConfirm}
        confirmText="Đồng ý xóa"
        cancelText="Bỏ qua"
        isDestructive={true}
      />
    )

    expect(screen.getByText('Xóa câu hỏi')).toBeInTheDocument()
    expect(screen.getByText('Bạn có chắc chắn muốn xóa câu hỏi này không?')).toBeInTheDocument()
    expect(screen.getByText('Đồng ý xóa')).toBeInTheDocument()
    expect(screen.getByText('Bỏ qua')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Bỏ qua'))
    expect(handleClose).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByText('Đồng ý xóa'))
    expect(handleConfirm).toHaveBeenCalledTimes(1)
  })

  it('hides cancel button when hideCancel is true', () => {
    render(
      <ConfirmModal
        isOpen={true}
        title="Thông báo"
        description="Nội dung"
        hideCancel={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    )
    expect(screen.queryByText('Hủy')).not.toBeInTheDocument()
  })
})
