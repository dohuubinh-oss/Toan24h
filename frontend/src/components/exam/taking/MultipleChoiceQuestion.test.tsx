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
    { id: 'A', label: 'A', text: '$x = 3$' },
    { id: 'B', label: 'B', text: '$x = 5$' },
    { id: 'C', label: 'C', text: '$x = 4$' },
    { id: 'D', label: 'D', text: '$x = -3$' },
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

  it('renders student explanation under options with light blue styling when provided', () => {
    render(
      <MultipleChoiceQuestion
        questionId={3}
        index={2}
        content="Nghiệm?"
        options={options}
        selectedOptionId="B"
        selectedExplanation="Em bình phương 2 vế được x - 1 = 4 suy ra x = 5"
        isHintOpen={false}
        isFlagged={false}
        onSelectOption={vi.fn()}
        onToggleHint={vi.fn()}
        onToggleFlag={vi.fn()}
      />
    )

    expect(screen.getByText('Lời giải thích của bạn')).toBeInTheDocument()
    expect(screen.getByText(/Em bình phương 2 vế/)).toBeInTheDocument()
    // Verify light blue container styling
    const explanationBox = screen.getByText('Lời giải thích của bạn').closest('div.bg-sky-50\\/80')
    expect(explanationBox).toBeInTheDocument()
  })

  it('renders inline hints under explanation when isHintOpen is true in practice mode', () => {
    render(
      <MultipleChoiceQuestion
        questionId={3}
        index={2}
        content="Nghiệm?"
        options={options}
        selectedOptionId="B"
        selectedExplanation="Em áp dụng công thức"
        hint="Đặt điều kiện xác định x >= 1"
        mistakes="Quên đặt điều kiện dưới dấu căn"
        shortAnswer="Thử trực tiếp các đáp án A, B, C, D"
        generalMethod="Phương trình căn bậc hai cơ bản"
        isHintOpen={true}
        isFlagged={false}
        examType="practice"
        onSelectOption={vi.fn()}
        onToggleHint={vi.fn()}
        onToggleFlag={vi.fn()}
      />
    )

    expect(screen.getByTestId('question-hints-inline')).toBeInTheDocument()
    // Step 1: Gợi ý hướng giải is active by default
    expect(screen.getByText('Gợi ý hướng giải bài toán')).toBeInTheDocument()
    expect(screen.getByText(/Đặt điều kiện xác định/)).toBeInTheDocument()

    // Step button exists for next sequential step: Mẹo giải nhanh
    expect(screen.getByText('Mẹo giải nhanh')).toBeInTheDocument()
  })

  it('toggles solution guide (Hình 3) when isHintOpen is true in readonly result mode', () => {
    const { rerender } = render(
      <MultipleChoiceQuestion
        questionId={3}
        index={2}
        content="Nghiệm?"
        options={options}
        selectedOptionId="B"
        selectedExplanation="Giải thích của học sinh"
        correctOptionId="B"
        solutionGuide="Lời giải chuẩn: x = 5"
        readonly={true}
        isHintOpen={true}
        isFlagged={false}
        onSelectOption={vi.fn()}
        onToggleHint={vi.fn()}
        onToggleFlag={vi.fn()}
      />
    )

    // Component like Hình 3 is shown
    expect(screen.getByTestId('solution-guide-result')).toBeInTheDocument()
    expect(screen.getByText('Lời giải chi tiết (Đáp án chuẩn)')).toBeInTheDocument()
    expect(screen.getByText(/Lời giải chuẩn: x = 5/)).toBeInTheDocument()

    // When isHintOpen is false, Hình 3 is hidden
    rerender(
      <MultipleChoiceQuestion
        questionId={3}
        index={2}
        content="Nghiệm?"
        options={options}
        selectedOptionId="B"
        selectedExplanation="Giải thích của học sinh"
        correctOptionId="B"
        solutionGuide="Lời giải chuẩn: x = 5"
        readonly={true}
        isHintOpen={false}
        isFlagged={false}
        onSelectOption={vi.fn()}
        onToggleHint={vi.fn()}
        onToggleFlag={vi.fn()}
      />
    )
    expect(screen.queryByTestId('solution-guide-result')).toBeNull()
  })
})
