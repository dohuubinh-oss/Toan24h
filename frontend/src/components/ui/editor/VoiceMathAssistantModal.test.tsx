import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import VoiceMathAssistantModal from './VoiceMathAssistantModal'

// Mock MathText component for unit testing
vi.mock('@/components/ui/MathText', () => ({
  default: ({ content }: { content: string }) => <div data-testid="math-preview">{content}</div>
}))

describe('VoiceMathAssistantModal', () => {
  it('renders modal when open with input and action buttons', () => {
    const handleInsert = vi.fn()
    const handleClose = vi.fn()

    render(
      <VoiceMathAssistantModal
        isOpen={true}
        onClose={handleClose}
        onInsert={handleInsert}
      />
    )

    expect(screen.getByText(/Trợ lý Nói & Nhập Toán/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Nói hoặc gõ công thức tiếng Việt/i)).toBeInTheDocument()
  })

  it('converts typed text to LaTeX live and inserts on button click', () => {
    const handleInsert = vi.fn()
    const handleClose = vi.fn()

    render(
      <VoiceMathAssistantModal
        isOpen={true}
        onClose={handleClose}
        onInsert={handleInsert}
      />
    )

    const input = screen.getByPlaceholderText(/Nói hoặc gõ công thức tiếng Việt/i)
    fireEvent.change(input, { target: { value: 'x bình phương cộng hai x trừ năm bằng không' } })

    const insertBtn = screen.getByRole('button', { name: /Chèn vào bài/i })
    expect(insertBtn).not.toBeDisabled()
    fireEvent.click(insertBtn)

    expect(handleInsert).toHaveBeenCalledWith('x^2 + 2x - 5 = 0', true)
    expect(handleClose).toHaveBeenCalled()
  })

  it('does not render when isOpen is false', () => {
    const handleInsert = vi.fn()
    const handleClose = vi.fn()

    const { container } = render(
      <VoiceMathAssistantModal
        isOpen={false}
        onClose={handleClose}
        onInsert={handleInsert}
      />
    )

    expect(container.firstChild).toBeNull()
  })
})
