import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MultipleChoiceQuestion from './MultipleChoiceQuestion'

// Mock ExplanationPopup
vi.mock('./ExplanationPopup', () => ({
  default: ({ isOpen, onClose, onSubmit }: any) => {
    if (!isOpen) return null
    return (
      <div data-testid="mock-explanation-popup">
        <button onClick={onClose}>Hủy</button>
        <button onClick={() => onSubmit('test explanation')}>Xác nhận</button>
      </div>
    )
  }
}))

describe('MultipleChoiceQuestion Component', () => {
  const options = [
    { id: 'A', text: '$x = 3$' },
    { id: 'B', text: '$x = 5$' },
    { id: 'C', text: '$x = 4$' },
    { id: 'D', text: '$x = -3$' },
  ]

  it('renders question and options', () => {
    render(
      <MultipleChoiceQuestion
        questionId={3}
        index={2}
        content="Nghiệm của phương trình $\\sqrt{x-1} = 2$ là:"
        options={options}
        selectedOptionId={null}
        isHintOpen={false}
        isFlagged={false}
        onSelectOption={vi.fn()}
        onToggleHint={vi.fn()}
        onToggleFlag={vi.fn()}
      />
    )
    
    expect(screen.getByText('Câu hỏi 3')).toBeInTheDocument()
    expect(screen.getByText(/Nghiệm của phương trình/)).toBeInTheDocument()
    expect(screen.getByText('A')).toBeInTheDocument()
    // Cannot query exact Katex output easily, just check the option container is there
  })

  it('opens popup when an option is clicked and calls onSelectOption upon confirm', async () => {
    const handleSelect = vi.fn()
    const user = userEvent.setup()
    
    render(
      <MultipleChoiceQuestion
        questionId={3}
        index={2}
        content="Nghiệm?"
        options={options}
        selectedOptionId={null}
        isHintOpen={false}
        isFlagged={false}
        onSelectOption={handleSelect}
        onToggleHint={vi.fn()}
        onToggleFlag={vi.fn()}
      />
    )
    
    // Click option B
    const optionB = screen.getByText('B').closest('button')!
    await user.click(optionB)
    
    // Popup should appear
    expect(screen.getByTestId('mock-explanation-popup')).toBeInTheDocument()
    
    // Click Confirm
    const confirmBtn = screen.getByText('Xác nhận')
    await user.click(confirmBtn)
    
    // onSelectOption should be called with B and explanation
    expect(handleSelect).toHaveBeenCalledWith('B', 'test explanation')
    
    // Popup should close
    expect(screen.queryByTestId('mock-explanation-popup')).not.toBeInTheDocument()
  })

  it('calls onToggleFlag when flag button is clicked', async () => {
    const handleToggleFlag = vi.fn()
    const user = userEvent.setup()
    
    render(
      <MultipleChoiceQuestion
        questionId={3}
        index={2}
        content="Nghiệm?"
        options={options}
        selectedOptionId={null}
        isHintOpen={false}
        isFlagged={false}
        onSelectOption={vi.fn()}
        onToggleHint={vi.fn()}
        onToggleFlag={handleToggleFlag}
      />
    )
    
    const flagBtn = screen.getByTitle('Đánh dấu câu hỏi này để xem lại sau')
    await user.click(flagBtn)
    
    expect(handleToggleFlag).toHaveBeenCalledTimes(1)
  })

  it('shows unflag text when isFlagged is true', () => {
    render(
      <MultipleChoiceQuestion
        questionId={3}
        index={2}
        content="Nghiệm?"
        options={options}
        selectedOptionId={null}
        isHintOpen={false}
        isFlagged={true}
        onSelectOption={vi.fn()}
        onToggleHint={vi.fn()}
        onToggleFlag={vi.fn()}
      />
    )
    
    expect(screen.getByText('Đã đánh dấu')).toBeInTheDocument()
  })
})
