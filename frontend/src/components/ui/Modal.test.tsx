import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { Modal } from './Modal'

describe('Modal Component', () => {
  it('does not render when isOpen is false', () => {
    render(
      <Modal isOpen={false} onClose={vi.fn()}>
        <div>Modal Content</div>
      </Modal>
    )
    expect(screen.queryByText('Modal Content')).not.toBeInTheDocument()
  })

  it('renders content and title when isOpen is true', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Test Title" description="Test Description">
        <div>Modal Content</div>
      </Modal>
    )
    expect(screen.getByText('Test Title')).toBeInTheDocument()
    expect(screen.getByText('Test Description')).toBeInTheDocument()
    expect(screen.getByText('Modal Content')).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', () => {
    const handleClose = vi.fn()
    render(
      <Modal isOpen={true} onClose={handleClose} title="Test Modal">
        <div>Content</div>
      </Modal>
    )
    fireEvent.click(screen.getByLabelText('Đóng cửa sổ'))
    expect(handleClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when Escape key is pressed', () => {
    const handleClose = vi.fn()
    render(
      <Modal isOpen={true} onClose={handleClose}>
        <div>Content</div>
      </Modal>
    )
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(handleClose).toHaveBeenCalledTimes(1)
  })
})
