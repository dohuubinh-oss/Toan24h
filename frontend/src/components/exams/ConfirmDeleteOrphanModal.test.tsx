import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import ConfirmDeleteOrphanModal, { OrphanQuestion } from './ConfirmDeleteOrphanModal'

describe('ConfirmDeleteOrphanModal', () => {
  const mockQuestions: OrphanQuestion[] = [
    {
      id: 'q-1',
      bookName: 'Bài 1: Phương trình bậc nhất',
      content: 'Giải phương trình $2x + 4 = 0$',
    },
    {
      id: 'q-2',
      bookName: 'Bài 2: Hệ phương trình',
      content: 'Tìm nghiệm của hệ phương trình...',
    },
  ]

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <ConfirmDeleteOrphanModal
        isOpen={false}
        orphanQuestions={mockQuestions}
        onConfirmDelete={vi.fn()}
        onKeepInBank={vi.fn()}
        onClose={vi.fn()}
      />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders question list and checks all by default', () => {
    render(
      <ConfirmDeleteOrphanModal
        isOpen={true}
        orphanQuestions={mockQuestions}
        onConfirmDelete={vi.fn()}
        onKeepInBank={vi.fn()}
        onClose={vi.fn()}
      />
    )

    expect(screen.getByText(/câu hỏi không còn thuộc đề thi nào/i)).toBeInTheDocument()
    expect(screen.getByText('Bài 1: Phương trình bậc nhất')).toBeInTheDocument()
    expect(screen.getByText('Bài 2: Hệ phương trình')).toBeInTheDocument()

    // All checkboxes should be checked
    const checkboxes = screen.getAllByRole('checkbox')
    expect(checkboxes.length).toBeGreaterThanOrEqual(2)
    checkboxes.forEach(cb => expect(cb).toBeChecked())

    expect(screen.getByText(/Xóa 2 câu đã chọn khỏi ngân hàng/i)).toBeInTheDocument()
  })

  it('allows unchecking a question and updates the delete count', () => {
    render(
      <ConfirmDeleteOrphanModal
        isOpen={true}
        orphanQuestions={mockQuestions}
        onConfirmDelete={vi.fn()}
        onKeepInBank={vi.fn()}
        onClose={vi.fn()}
      />
    )

    const checkboxes = screen.getAllByRole('checkbox')
    // Uncheck first question (checkbox 1 or item checkbox)
    const itemCheckbox = screen.getByLabelText(/Bài 1: Phương trình bậc nhất/i)
    fireEvent.click(itemCheckbox)
    expect(itemCheckbox).not.toBeChecked()

    // Now button should say "Xóa 1 câu đã chọn"
    expect(screen.getByText(/Xóa 1 câu đã chọn khỏi ngân hàng/i)).toBeInTheDocument()
  })

  it('calls onConfirmDelete with selected question IDs', () => {
    const handleConfirmDelete = vi.fn()
    render(
      <ConfirmDeleteOrphanModal
        isOpen={true}
        orphanQuestions={mockQuestions}
        onConfirmDelete={handleConfirmDelete}
        onKeepInBank={vi.fn()}
        onClose={vi.fn()}
      />
    )

    // Click confirm delete
    const deleteBtn = screen.getByText(/Xóa 2 câu đã chọn khỏi ngân hàng/i)
    fireEvent.click(deleteBtn)

    expect(handleConfirmDelete).toHaveBeenCalledWith(['q-1', 'q-2'])
  })

  it('calls onKeepInBank when clicking keep button', () => {
    const handleKeepInBank = vi.fn()
    render(
      <ConfirmDeleteOrphanModal
        isOpen={true}
        orphanQuestions={mockQuestions}
        onConfirmDelete={vi.fn()}
        onKeepInBank={handleKeepInBank}
        onClose={vi.fn()}
      />
    )

    const keepBtn = screen.getByRole('button', { name: /giữ lại toàn bộ/i })
    fireEvent.click(keepBtn)

    expect(handleKeepInBank).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when clicking cancel button', () => {
    const handleClose = vi.fn()
    render(
      <ConfirmDeleteOrphanModal
        isOpen={true}
        orphanQuestions={mockQuestions}
        onConfirmDelete={vi.fn()}
        onKeepInBank={vi.fn()}
        onClose={handleClose}
      />
    )

    const cancelBtn = screen.getByText(/Hủy/i)
    fireEvent.click(cancelBtn)

    expect(handleClose).toHaveBeenCalledTimes(1)
  })
})
