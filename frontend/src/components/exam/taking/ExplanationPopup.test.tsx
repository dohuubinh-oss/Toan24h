import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ExplanationPopup from './ExplanationPopup'

// Mock RichTextEditor
vi.mock('@/components/questions/creator/editor/RichTextEditor', () => ({
  default: ({ onChange, content, placeholder }: any) => (
    <textarea 
      data-testid="mock-rich-text-editor" 
      placeholder={placeholder}
      value={content}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}))

describe('ExplanationPopup Component', () => {
  it('renders correctly when open', () => {
    render(
      <ExplanationPopup
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />
    )
    
    expect(screen.getByText('Giải thích đáp án')).toBeInTheDocument()
    expect(screen.getByTestId('mock-rich-text-editor')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Xác nhận/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Hủy/i })).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(
      <ExplanationPopup
        isOpen={false}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />
    )
    
    expect(screen.queryByText('Giải thích đáp án')).not.toBeInTheDocument()
  })

  it('disables submit button when explanation is empty', async () => {
    render(<ExplanationPopup isOpen={true} onClose={vi.fn()} onSubmit={vi.fn()} />)
    
    const submitBtn = screen.getByRole('button', { name: /Xác nhận/i })
    expect(submitBtn).toBeDisabled()
  })

  it('enables submit button and calls onSubmit when explanation is provided', async () => {
    const handleSubmit = vi.fn()
    render(
      <ExplanationPopup
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={handleSubmit}
      />
    )
    
    const editor = screen.getByTestId('mock-rich-text-editor')
    await userEvent.type(editor, 'Biết ngay mà')
    
    const submitBtn = screen.getByRole('button', { name: /Xác nhận/i })
    expect(submitBtn).not.toBeDisabled()
    
    await userEvent.click(submitBtn)
    expect(handleSubmit).toHaveBeenCalledWith('Biết ngay mà')
  })
})
