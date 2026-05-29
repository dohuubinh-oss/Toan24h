import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MultipleChoiceQuestion from './MultipleChoiceQuestion'

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
        content="Nghiệm của phương trình $\\sqrt{x-1} = 2$ là:"
        options={options}
        selectedOptionId={null}
        isFlagged={false}
        onSelectOption={vi.fn()}
        onToggleFlag={vi.fn()}
      />
    )
    
    expect(screen.getByText('Câu 3')).toBeInTheDocument()
    expect(screen.getByText(/Nghiệm của phương trình/)).toBeInTheDocument()
    expect(screen.getByText('A')).toBeInTheDocument()
    expect(screen.getByText('$x = 3$')).toBeInTheDocument()
  })

  it('calls onSelectOption when an option is clicked', async () => {
    const handleSelect = vi.fn()
    const user = userEvent.setup()
    
    render(
      <MultipleChoiceQuestion
        questionId={3}
        content="Nghiệm?"
        options={options}
        selectedOptionId={null}
        isFlagged={false}
        onSelectOption={handleSelect}
        onToggleFlag={vi.fn()}
      />
    )
    
    // We can query the radio button directly since it's associated via label, or click the text
    const radioB = screen.getByDisplayValue('B')
    await user.click(radioB)
    
    expect(handleSelect).toHaveBeenCalledWith('B')
  })

  it('calls onToggleFlag when flag button is clicked', async () => {
    const handleToggleFlag = vi.fn()
    const user = userEvent.setup()
    
    render(
      <MultipleChoiceQuestion
        questionId={3}
        content="Nghiệm?"
        options={options}
        selectedOptionId={null}
        isFlagged={false}
        onSelectOption={vi.fn()}
        onToggleFlag={handleToggleFlag}
      />
    )
    
    const flagBtn = screen.getByRole('button', { name: /Đánh dấu/i })
    await user.click(flagBtn)
    
    expect(handleToggleFlag).toHaveBeenCalledTimes(1)
  })

  it('shows unflag text when isFlagged is true', () => {
    render(
      <MultipleChoiceQuestion
        questionId={3}
        content="Nghiệm?"
        options={options}
        selectedOptionId={null}
        isFlagged={true}
        onSelectOption={vi.fn()}
        onToggleFlag={vi.fn()}
      />
    )
    
    expect(screen.getByText('Bỏ đánh dấu')).toBeInTheDocument()
  })
})
